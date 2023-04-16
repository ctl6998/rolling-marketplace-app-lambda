import json
import boto3
import logging


logger = logging.getLogger()

client = boto3.client('dynamodb')

def lambda_handler(event, context):
    response = getStudent(event['queryStringParameters']['userid'])
    return response
    
def getStudent(userid):
  try:
    data = client.query(
      TableName='Products',
      IndexName='userid',
      KeyConditionExpression='#userid = :value',
      ExpressionAttributeValues={
        ':value': {
          'S': f'{userid}'
        }
        
      },
      ExpressionAttributeNames={
        '#userid': 'userid'
      }
      response = {
        'statusCode': 200,
        'body': json.dumps(data),
        'headers': {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
      return response
  }
    )
  except:
    logger.exception('Something wrong with the query!')
  