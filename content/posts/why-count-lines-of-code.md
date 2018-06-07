---
title: Why count lines of code?
date: 2018-06-07
---

A work college (let's call him Owen as that's his name) asked me the other day 

> "I dont understand the problem space `scc` et al solve. If you wanted to write a short post, i'd read and share the hell out of it. Basically, it seems like a heap of people can see the need for it, and I'm trying to understand it myself"

Owen is one of the more switched on people I know. As such if he is asking whats the point of tools such as scc, tokei, sloccount, cloc, loc and gocloc then I suspect quite a few other people are asking the same thing.

To quote the lead from a few of the tools mentioned.

> scc is a very fast accurate code counter with complexity calculations and COCOMO estimates written in pure Go 

> cloc counts blank lines, comment lines, and physical lines of source code in many programming languages. Given two versions of a code base, cloc can compute differences in blank, comment, and source lines.

> "SLOCCount" a set of tools for counting physical Source Lines of Code (SLOC) in a large number of languages of a potentially large set of programs.

> Tokei is a program that displays statistics about your code. Tokei will show number of files, total lines within those files and code, comments, and blanks grouped by language.

So what?

I am going to explain personally where I have used these tools. Others may have different experiences but I suspect there will be a lot of overlap.


Testimonials from SLOCCOunt

> "SLOCCount allows me to easily and quickly quantify the source lines of code and variety in languages. Even though these are just two fairly basic aspects of a project, it helps a lot to get a first impression of the size and complexity of projects." -- Auke Jilderda, Philips Research.

> "SLOCCount has really helped us a lot in our studies on libre software engineering" -- Jesus M. Gonzalez Barahona, Grupo de Sistemas y Comunicaciones, ESCET, Universidad Rey Juan Carlos.
> "Thanks for SLOCCount! It's great... We're using SLOCs derived from SLOCCount to compare our software to the software it replaces ... Keep up the good work" -- Sam Tregar
> "Wow, using sloccount on the full POPFile source shows that developing it would have cost around $500K in a regular software company. That seems about right given the length of time we've been working on it and the number of people involved. Cool tool." -- John Graham Cumming 



`scc` takes the idea a little further than the other tools by including a complexity estimate. Anyone who has worked with Visual Studio and the .NET languages for a few years will have eventually discovered that one of the neat things you can do with it is produce cyclomatic complexity https://en.wikipedia.org/wiki/Cyclomatic_complexity calculations, down to counts per solution/project/namespace/file/class/method.

Cyclomatic complexity is a software metric that allows you to extimate the complexity of a project. What this allows you to do 


To show how it all works I am going to walk through analysing a project that I know Owen is far more familiar with than myself. Kombusion https://github.com/KablamoOSS/kombustion which is a AWS Cloudformation Tool on steriods. I am going to assume that the reader knows nothing about it beyond the name and what it does at this point.

To start lets just get a basic idea of what is in the current repository and the size.

```
$ scc
-------------------------------------------------------------------------------
Language                 Files     Lines     Code  Comments   Blanks Complexity
-------------------------------------------------------------------------------
Go                        1782    333844   259667     39278    34899      41001
Markdown                    45      5400     4090         0     1310          0
YAML                        34      2021     1830        73      118         15
Assembly                    25       903      680         0      223         25
JSON                        15    319180   319180         0        0          0
Perl                         8      1141      859       140      142        163
Shell                        7       934      560       293       81         77
Protocol Buffers             6       912      693         1      218          0
TOML                         3       127       39        70       18          0
Plain Text                   3       227      190         0       37          0
Makefile                     3        64       47         0       17          8
HTML                         1        27       27         0        0          0
BASH                         1        21       16         2        3          0
C                            1        47       29         7       11          0
Dockerfile                   1        33        6        17       10          0
-------------------------------------------------------------------------------
Total                     1935    664881   587913     39881    37087      41289
-------------------------------------------------------------------------------
Estimated Cost to Develop $21,846,106
Estimated Schedule Effort 49.528242 months
Estimated People Required 52.248735
-------------------------------------------------------------------------------
```

What is apparent is that the vast majority of the appliation is written using Go. Knowing this, and that Go has a vendor directory which contains all of the requirements lets run `scc` ignoring that directory.

```
$ scc --pbl vendor -co .
-------------------------------------------------------------------------------
Language                 Files     Lines     Code  Comments   Blanks Complexity
-------------------------------------------------------------------------------
Go                        1110     43605    34286      2568     6751       4152
Markdown                    20       864      633         0      231          0
YAML                        16      1717     1573        71       73          6
JSON                        14    319087   319087         0        0          0
ASP.NET                      4         9        9         0        0          0
HTML                         1        27       27         0        0          0
Dockerfile                   1        33        6        17       10          0
TOML                         1        59       24        25       10          0
-------------------------------------------------------------------------------
Total                     1167    365401   355645      2681     7075       4158
-------------------------------------------------------------------------------
```

What we can now see is that compared to the previous run the number of lines has dropped considerably from `333844` to `43605`. This means there is a huge amount of code that this application depends on. We can also see that most of the languages have dropped off the list.

Perhaps most interesting is that there is a huge amount of JSON in the application. Lets inspect just the JSON to see what it might be. The below will whitelist to just json files and ignore all the complexity calculations, but with the `--files` flag we can also see each file individually.

```
$ scc --pbl vendor -wl json --files -c -co .
-------------------------------------------------------------------------------
Language                     Files       Lines      Code    Comments     Blanks
-------------------------------------------------------------------------------
JSON                            14      319087    319087           0          0
-------------------------------------------------------------------------------
~te/source/North Virginia.json           25602     25602           0          0
generate/source/Oregon.json              25602     25602           0          0
generate/source/Ireland.json             25602     25602           0          0
generate/source/Ohio.json                23748     23748           0          0
generate/source/Tokyo.json               23745     23745           0          0
generate/source/Sydney.json              23137     23137           0          0
~enerate/source/Frankfurt.json           22725     22725           0          0
generate/source/Seoul.json               22399     22399           0          0
~enerate/source/Singapore.json           21827     21827           0          0
generate/source/London.json              21607     21607           0          0
generate/source/Mumbai.json              21593     21593           0          0
~/source/North California.json           20672     20672           0          0
generate/source/Canada.json              20414     20414           0          0
~enerate/source/Sao Paulo.json           20414     20414           0          0
-------------------------------------------------------------------------------
Total                           14      319087    319087           0          0
-------------------------------------------------------------------------------
```

Looks like these are generated and region specific. I am going to make a guess at this point that they are checked in cloudformation definitions. 

```
$ head -n 10 generate/source/Sydney.json
{
  "PropertyTypes": {
    "AWS::ElasticLoadBalancingV2::ListenerCertificate.Certificate": {
      "Documentation": "http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-elasticloadbalancingv2-listener-certificates.html",
      "Properties": {
        "CertificateArn": {
          "Documentation": "http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-elasticloadbalancingv2-listener-certificates.html#cfn-elasticloadbalancingv2-listener-certificates-certificatearn",
          "PrimitiveType": "String",
          "Required": false,
          "UpdateType": "Mutable"
```

Looks like the guess was right. Lets continue to explore, but this time lets ignore JSON and focus on Go which is the meat of the application. The below will whitelist to Go files sorted by complexity ignoring the vendor directory.

```
$ scc --pbl vendor -wl go --files -s complexity .
-------------------------------------------------------------------------------
Language                 Files     Lines     Code  Comments   Blanks Complexity
-------------------------------------------------------------------------------
Go                        1110     43605    34286      2568     6751       4152
-------------------------------------------------------------------------------
~ternal/genplugin/genplugin.go       398      335         3       60         83
generate/generate.go                 681      573        22       86         81
~al/cloudformation/template.go       277      216        19       42         54
internal/plugins/load.go             211      157        22       32         51
internal/plugins/install.go          284      231        15       38         50
internal/plugins/add.go              220      163        23       34         36
~loudformation/tasks/upsert.go       128      109         6       13         26
```

From the above we can deduce that there are four areas that are reasonably complex. Those would be the file genplugin.go, generate.go, template.go and the files in internal/plugins. We can also make a guess that there are few unit tests for any of the above as I would expect complex test files to appear next to them. They may still be covered by integration tests however.

Lets have a look at `genplugin.go` where two portions caught my eye.

{{<highlight go>}}
func getVal(v interface{}, depth int, append string) string {
	typ := reflect.TypeOf(v).Kind()
	if typ == reflect.Int {
		return fmt.Sprint("\"", v, "\"", append)
	} else if typ == reflect.Bool {
		return fmt.Sprint("\"", v, "\"", append)
	} else if typ == reflect.String {
		return fmt.Sprint("\"", strings.Replace(strings.Replace(v.(string), "\n", "\\n", -1), "\"", "\\\"", -1), "\"", append)
	} else if typ == reflect.Slice {
		return printSlice(v.([]interface{}), depth+1, append)
	} else if typ == reflect.Map {
		return printMap(v.(map[interface{}]interface{}), depth+1, append)
	}

	return "UNKNOWN_TYPE_" + typ.String()
}
{{</highlight>}}

{{<highlight go>}}
	if len(config.Parameters) > 0 {
		writeLine(buf, "// Parse the config data\n"+
			"var config "+resname+"Config\n"+
			"if err = yaml.Unmarshal([]byte(data), &config); err != nil {\n"+
			"  return\n"+
			"}\n"+
			"\n"+
			"// validate the config\n"+
			"config.Validate()\n\n// defaults\n")
		for paramName, param := range config.Parameters {
			if strings.HasPrefix(param.Type, "List<") || param.Type == "CommaDelimitedList" {
				writeLine(buf, "param"+paramName+" := []interface{}{}\n"+
					"if len(config.Properties."+paramName+") > 0 {\n"+
					"  param"+paramName+" = config.Properties."+paramName+"\n"+
					"}\n\n")
			} else {
				defaultVal := ""
				if param.Default != nil {
					defaultVal = fmt.Sprintf("%v", param.Default) // ensure it's a string if int is given
				}
				writeLine(buf, "param"+paramName+" := \""+defaultVal+"\"\n"+
					"if config.Properties."+paramName+" != nil {\n"+
					"  param"+paramName+" = *config.Properties."+paramName+"\n"+
					"}\n\n")
			}
		}
	}
{{</highlight>}}

I'd say both of those are reasonable complex. Note I have no idea what they are doing, I am just exploring a codebase I have never looked at before.

The file `generate.go` is another target.