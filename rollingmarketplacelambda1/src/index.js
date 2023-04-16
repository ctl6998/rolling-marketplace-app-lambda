const AWS = require('aws-sdk');
const crypto = require("crypto");

AWS.config.update(
    {
        region: 'ap-southeast-1'
    }
);
const dynamodb = new AWS.DynamoDB.DocumentClient();
const dynamodbTableName = "Products";
const productPath = "/product";
const productsPath = "/products";

exports.handler = async function(event){
    console.log('Request event: ', event);
    let response;
    switch(true){
        case event.httpMethod == 'GET' && event.path == productPath:
            response = await getProduct(event.queryStringParameters.id)
            break;
        case event.httpMethod == 'GET' && event.path == productsPath:
            response = await getProducts();
            break;
        case event.httpMethod == 'POST' && event.path == productPath:
            response = await saveProduct(JSON.parse(event.body));
            break;
        case event.httpMethod == 'PATCH' && event.path == productPath:
            const requestBody = JSON.parse(event.body);
            response = await modifyProduct(requestBody.id, requestBody.updateKey, requestBody.updateValue);
            break;
        case event.httpMethod == 'DELETE' && event.path == productPath:
            response = await deleteProduct(JSON.parse(event.body).id);
            break;
    }
    return response;
}

async function getProduct(productId){
    const params = {
        TableName: dynamodbTableName,
        Key: {
            'id': productId
        }
    }
    return await dynamodb.get(params).promise().then((response) => {
        return buildResponse(200, response.Item);
    }, (error) => {
        console.error("This error happens when things actually went pretty ok... Can not find the product with the given ID", error);
    });
}

async function getProducts(){
    const params = {
        TableName: dynamodbTableName,
    }
    const allProducts = await scanDynamoRecords(params, []);
    const body = {
        products: allProducts
    }
    return buildResponse(200, body);
}

async function scanDynamoRecords(scanParams, itemArray){
    try{
        const dynamoData = await dynamodb.scan(scanParams).promise();
        itemArray = itemArray.concat(dynamoData.Items);
        if (dynamoData.LastEvaluatedKey){
            scanParams.ExclusiveStartKey = dynamoData.LastEvaluatedKey;
            return await scanDynamoRecords(scanParams, itemArray);
        }
        return itemArray;
    } catch(error){
        console.error("Can not scan the items in the table", error);
    }
}

async function saveProduct(requestBody){
    const uuid = crypto.randomBytes(16).toString("hex");
    const params = {
        TableName: dynamodbTableName,
        Item: {
              'id': uuid,
              "date": requestBody.date,
              "name": requestBody.name,
              "price": requestBody.price,
              "image": requestBody.image,
              "description": requestBody.description,
              "categories": requestBody.categories
              }
        }
    return await dynamodb.put(params)
    .promise()
    .then(() => {
        const body = {
            Operation: 'SAVE',
            Message: 'SUCCESS',
            Item: requestBody
        };
        return buildResponse(200, body);
    }, (error) => {
        console.error('Can not save the product', error);
    });
}

async function modifyProduct(productId, updateKey, updateValue){
    const params = {
        TableName: dynamodbTableName,
        Key: {
            'id': productId
        },
        UpdateExpression: `set ${updateKey} = :value`,
        ExpressionAttributeValues: {
            ':value': updateValue
        },
        ReturnValues: 'UPDATED_NEW'
    }
    return await dynamodb.update(params).promise().then((response) => {
        const body = {
            Operation: 'UPDATE',
            Message: 'SUCCESS',
            Item: response
        }
        return buildResponse(200, body);
    }, (error) => {
        console.error('Can not update the product', error);
    })
}

async function deleteProduct(productId){
    const params = {
        TableName: dynamodbTableName,
        Key: {
            'id': productId
        },
        ReturnValues: 'ALL_OLD'
    }
    return await dynamodb.delete(params).promise().then((response) =>{
        const body = {
            Operation: 'DELETE',
            Message: 'SUCCESS',
            Item: response
        }
        return buildResponse(200, body)
    }, (error) => {
        console.error('Can not delete the product', error);
    })
}

function buildResponse(statusCode, body) {
    return{
        statusCode: statusCode,
        headers: {
            'Access-Control-Allow-Headers' : '*',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST,GET,PATCH,DELETE'
        },
        body: JSON.stringify(body)
    }
}

