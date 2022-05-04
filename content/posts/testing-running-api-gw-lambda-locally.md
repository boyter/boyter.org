---
title: Testing and Running Go API GW Lambda's Locally
date: 2022-04-25
---

I have been working with AWS API Gateway and Lambda using Go a lot recently. One of the more annoying things about API Gateway and Lambda is the inability to run things locally. As a result I tend to write a lot of unit tests to compensate. This works up till you start doing things like SQL queries as mocking away the database is a less than ideal situation if you are working with raw SQL, which I tend to do since I don't like most ORM's. These limitations of unit tests is why I prefer integration tests.

Previously I had worked worked around this by looking in the main function of the Go lambda for any arguments, and if they were encountered flipping over to run the code the handler would normally do. So for example,

{{<highlight go>}}

func main() {
	env := common.NewEnvironment()
	s := service{env: env}

	if len(os.Args) > 1 {
		return s.getSomething(context.TODO(), events.APIGatewayProxyRequest{})
	}

	lambda.Start(s.Handler)
}

func (s service) Handler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	return s.getSomething(ctx, request)
}
{{</highlight>}}

The above allowed you to run the lambda locally, passing in database connection details via environmental config. You could then configure your service function to call into the database, acting as it would when deployed in AWS and allowing for integration testing. 

```
DB_USER=user DB_PASS=pass go run . ANYTHING
```

When you added additional methods such as POST/PUT/DELETE and such you can modify the code and move on. However this is not a great solution, because ideally I would like to not have to keep modifying the same code over and over. I would also like to be able to keep things around such that I can write integration tests over them.

By extending the above we can create a way to pass in everything we want into our lambda as a restful service, allowing us to recreate how it works in API gateway. The format to call it is as follows,

```
# GET requests
go run . GET 
go run . GET key:value,id:123

# POST request
go run . POST content

# POST request
go run . DELETE "" auth:tokenvalue
``` 

The arguments are in order

 - the type of the HTTP call, so GET, POST, PUT, DELETE, PATCH etc...
 - the body of the request OR for a get request the params in key:value,key2:value2 format
 - the headers for the request in key:value,key2:value2 format

We can then couple the above with the below code and we can now call into our lambda's getting a response that is printed out on the command line which is 100% the same as what the lambda would return to API GW.


{{<highlight go>}}
func main() {
	env := common.NewEnvironment()
	s := service{env: env}

	if len(os.Args) > 1 {
		startCommandLine(service)
		return
	}

	lambda.Start(s.Handler)
}

func startCommandLine(service service) {
	body := ""
	headers := map[string]string{}

	if len(os.Args) > 2 {
		body = os.Args[2]
	}

	if len(os.Args) > 3 {
		keyValues := strings.Split(os.Args[3], ",")
		for _, kv := range keyValues {
			t := strings.Split(kv, ":")
			if len(t) == 2 {
				headers[t[0]] = t[1]
			}
		}
	}

	var marshalled []byte
	switch os.Args[1] {
	case "post":
		res, _ := service.postSomething(context.TODO(),
			events.APIGatewayProxyRequest{
				Body:    body,
				Headers: headers,
			},
		)
		marshalled, _ = json.Marshal(res)
	case "get":
		queryStringParams := map[string]string{}
		if body != "" {
			keyValues := strings.Split(body, ",")
			for _, kv := range keyValues {
				t := strings.Split(kv, ":")
				if len(t) == 2 {
					queryStringParams[t[0]] = t[1]
				}
			}
		}

		res, _ := service.getSomething(context.TODO(), events.APIGatewayProxyRequest{
			QueryStringParameters: queryStringParams,
			Body:                  body,
		})
		marshalled, _ = json.Marshal(res)
	case "delete":
		res, _ := service.deleteSomething(context.TODO(),
			events.APIGatewayProxyRequest{
				Body:    body,
				Headers: headers,
			},
		)
		marshalled, _ = json.Marshal(res)
	}

	fmt.Println(string(marshalled))
}
{{</highlight>}}

With the above we can actually write integration tests against our lambdas. However there is one additional benefit. Because we can call out to the the lambda's directly we can now spin up a HTTP server which maps back to our lambda's allowing for local HTTP testing! In short we can replicate a small amount of the functionality of API Gateway locally.

We only need a small amount of Go code to achieve this.

{{<highlight go>}}
// Very experimental way of serving lambda's behind a local HTTP server for testing purposes
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os/exec"
	"path"
	"strings"
)

type wrapper struct {
	Body       string            `json:"body"`
	StatusCode int               `json:"statusCode"`
	Headers    map[string]string `json:"headers"`
}

func allHandler(dir string, w http.ResponseWriter, r *http.Request) {
	fmt.Println(r.Method, r.URL.String(), dir)

	cmdArgs := []string{
		"run",
		".",
	}

	switch r.Method {
	case "":
		fallthrough
	case "GET":
		getParams := []string{}
		for k, v := range r.URL.Query() {
			getParams = append(getParams, fmt.Sprintf("%v:%v", k, v[0]))
		}
		cmdArgs = append(cmdArgs, "get")
		if len(getParams) != 0 {
			cmdArgs = append(cmdArgs, strings.Join(getParams, ","))
		}
	case "DELETE":
		fallthrough
	case "POST":
		fallthrough
	case "PUT":
		cmdArgs = append(cmdArgs, strings.ToLower(r.Method))
		all, err := ioutil.ReadAll(r.Body)
		if err != nil {
			fmt.Println(err.Error())
			return
		}
		defer r.Body.Close()
		cmdArgs = append(cmdArgs, string(all))
	case "OPTIONS":
		w.Header().Add("Access-Control-Allow-Methods", "OPTIONS,POST,GET,PUT,DELETE")
		w.Header().Add("Access-Control-Allow-Origin", "*")
		w.Header().Add("Access-Control-Allow-Headers", "*")
		w.WriteHeader(http.StatusNoContent)
		return
	}

	// now deal with headers
	headers := []string{}
	for k, v := range r.Header {
		headers = append(headers, fmt.Sprintf("%v:%v", k, v[0]))
	}
	if len(headers) != 0 {
		cmdArgs = append(cmdArgs, strings.Join(headers, ","))
	}

	cmd := exec.Command("go", cmdArgs...)
	var stdout bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	cmd.Dir = path.Join("./lambda/", dir)

	err := cmd.Run()
	if err != nil {
		_, _ = w.Write([]byte(err.Error()))
		return
	}
	fmt.Print(stderr.String())

	var wrap wrapper
	err = json.Unmarshal(stdout.Bytes(), &wrap)
	if err != nil {
		_, _ = w.Write([]byte(err.Error()))
		return
	}

	for k, v := range wrap.Headers {
		w.Header().Add(k, v)
	}

	w.WriteHeader(wrap.StatusCode)
	_, _ = w.Write([]byte(wrap.Body))
}


func main() {
	http.HandleFunc("/something", func(w http.ResponseWriter, r *http.Request) {
		allHandler("something", w, r)
	})

	err := http.ListenAndServe(fmt.Sprintf(":%d", 8888), nil)
	if err != nil {
		fmt.Println(err.Error())
	}
}
{{</highlight>}}

With the above running, and assuming you have your lambdas in the path `./lambda/` you can then browse to http://localhost:8888/something and it should call the GET function of your lambda located at `./lambda/something/` and return the result. It should also pass back all the appropriate headers and set the HTTP status as a fully configured API Gateway would. Because it invokes `go run .` under the hood it also means you can modify code on the fly and hit the API endpoint again and it should reflect you changes instantly. Adding additional lambda's is just a matter of adding more routes mapped to more lambdas.

I have been using the above for several weeks now and am really enjoying the experience. It has made manual testing so much faster since I can use postman and various other HTTP testing tools locally without waiting for API gateway to deploy. It also means I can run integration tests locally ensuring that behavior defined is correct. In short a huge win all around.

While I am aware you can achieve a lot of the above using SAM I have not had much success with it personally. It's also an additional dependency I would have needed to bring, plus include all of the cloudformation in the same repository, where as currently its split out based on discipline. In short this works well for me and the team I am working with.

