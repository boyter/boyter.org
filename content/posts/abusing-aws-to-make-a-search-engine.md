---
title: Abusing AWS Lambda to make a search engine
date: 2021-03-02
---

There is a saying in computing.

> Never do at runtime what you can do at compile time.

Lets see how far we can take that, using AWS Lambda by building a search engine... where we bake index into the lambdas themselves.

The plan, is to shard the index out to say 100 lambdas, where we bake the index into the lambda itself. Then we call each lambda using a controlling lambda which collects all the results, gets the top results and returns them.

> There is a hard limit of 50MB for compressed deployment package with AWS Lambda and an uncompressed AWS Lambda hard limit of 250MB.

That should be enough for a proof of concept.


Create lambda

https://www.sqlshack.com/calling-an-aws-lambda-function-from-another-lambda-function/

https://docs.aws.amazon.com/sdk-for-go/v1/developer-guide/lambda-go-example-run-function.html


First create a policy to allowing us to invoke a lambda. This is pretty loose, but we will only be assigning it to our controlling lambda.

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "lambda:InvokeFunction",
            "Resource": "*"
        }
    ]
}
```

Im going to call it the InvokeLambdaPolicy. 

Next we need to deploy the base lambdas, 