---
title: Use Go to Restore Glacier to S3
date: 2019-01-22
---

I had a great deal of difficulty searching for an answer to this I have included it here to hopefully save someone else the effort.

How to make a S3 request to retrieve items that have transitioned into AWS Glacier from an S3 bucket using the Go AWS SDK API.

{{<highlight go>}}
package main

import (
	"fmt"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/awserr"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
)

func main() {
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String("ap-southeast-2"),
	})

	svc := s3.New(sess)
	input := &s3.RestoreObjectInput{
		Bucket: aws.String("BucketName"),
		Key:    aws.String("FileKey"),
		RestoreRequest: &s3.RestoreRequest{
			Days: aws.Int64(1),
			GlacierJobParameters: &s3.GlacierJobParameters{
				Tier: aws.String("Expedited"), // Valid values: Expedited | Standard | Bulk
			},
		},
	}

	result, err := svc.RestoreObject(input)
	if err != nil {
		if aerr, ok := err.(awserr.Error); ok {
			switch aerr.Code() {
			case s3.ErrCodeObjectAlreadyInActiveTierError:
				fmt.Println(s3.ErrCodeObjectAlreadyInActiveTierError, aerr.Error())
			default:
				fmt.Println(aerr.Error())
			}
		} else {
			// Print the error, cast err to awserr.Error to get the Code and
			// Message from an error.
			fmt.Println(err.Error())
		}
		return
	}

	fmt.Println(result)
}
{{</highlight>}}