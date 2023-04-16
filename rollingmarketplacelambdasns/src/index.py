import json
import boto3

client = boto3.client('sns')
db = boto3.resource('dynamodb')
TABLE_NAME = 'Products'

def lambda_handler(event, context):
   table = db.Table(TABLE_NAME)
   response = table.scan()
   count = response['Count']
   message = f"Total number of items that we have in our store {count}"
   response = client.publish(TopicArn='arn:aws:sns:<ap-southeast-1>:<902265466494>:<popular_products>', Message=message)
   print("Message published")
   return(response)