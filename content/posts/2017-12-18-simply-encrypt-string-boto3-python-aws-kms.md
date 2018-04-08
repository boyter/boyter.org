---
title: Simply encrypt or decrypt a string using Boto3 Python and AWS KMS
author: Ben E. Boyter
type: post
date: 2017-12-18T02:54:59+00:00
url: /2017/12/simply-encrypt-string-boto3-python-aws-kms/
nkweb_code_in_head:
  - default
nkweb_Use_Custom_js:
  - default
nkweb_Use_Custom_Values:
  - default
nkweb_Use_Custom:
  - 'false'
categories:
  - AWS
  - Random
  - Tip

---
Another one of those things I need to look up every now and then. Below is a snippet of how to encrypt and decrypt a string using Python and KMS in AWS. The interesting thing is that you don't need to supply the KMS key alias in the decryption portion. So long as whatever role or key you are using can access the key it should work. For the encryption you can either supply the full ARN of the key or the alias so long as you prefix it with alias/

{{<highlight python>}}
import base64
import boto3


def encrypt(session, secret, alias):
    client = session.client('kms')
    ciphertext = client.encrypt(
        KeyId=alias,
        Plaintext=bytes(secret),
    )
    return base64.b64encode(ciphertext["CiphertextBlob"])


def decrypt(session, secret):
    client = session.client('kms')
    plaintext = client.decrypt(
        CiphertextBlob=bytes(base64.b64decode(secret))
    )
    return plaintext["Plaintext"]


session = boto3.session.Session()
print encrypt(session, 'something', 'alias/MyKeyAlias')
print decrypt(session, 'AQECAINdoimaasydoasidDASD5asd45')
{{</highlight>}}