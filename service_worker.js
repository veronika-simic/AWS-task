const AWS = require("aws-sdk");

AWS.config.update({
  region: "us-east-1",
});

const sqs = new AWS.SQS();

const sharp = require("sharp");
const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = "user-images";
const fs = require("fs");

const queueUrl =
  "https://sqs.us-east-1.amazonaws.com/222621649155/ImageQueue.fifo";

const sqsParams = {
  QueueUrl: queueUrl,
  MaxNumberOfMessages: 10,
  VisibilityTimeout: 20,
  WaitTimeSeconds: 5,
};

sqs.receiveMessage(sqsParams, function (err, data) {
  if (err) {
    console.log("Receive Error", err);
  } else {
    console.log("Received message", data.Messages[5].Body);
    console.log(JSON.parse(data.Messages[5].Body).fileName)

    s3.getObject(
      {
        Bucket: "images-bucket-vera",
        Key: JSON.parse(data.Messages[5].Body).fileName,
      },
      (error, data) => {
        if (error) {
          console.log(error);
        } else {
          console.log(data);
         /*  const { Body } = s3.getObject(s3params);
          fs.writeFile(location, Body); */
        }
      }
    );

    /*  fileContent = sharp(fileContent).rotate(180);
    const s3params = {
      Bucket: "rotated-images",
      Key: String(data.Messages[0].Body.image_id),
      Body: fileContent,
    };

    s3.upload(s3params, (err, data) => {
      if (err) {
        console.log(err);
      } else {
        console.log(data);
      }
    });
    const dynamoParams = {
      TableName: TABLE_NAME,
      Key: {
        image_id: data.Messages[0].Body.image_id,
        fileName: data.Messages[0].Body.fileName,
      },
      UpdateExpression: "set processedFilePath = :p, image_state = :s",
      ExpressionAttributeValues: {
        ":p": "https://rotated-images.s3.amazonaws.com/AWS.png",
        ":s": "finished",
      },
      ReturnValues: "UPDATED_NEW",
    };
    dynamodb.update(dynamoParams, function (err, data) {
      if (err) {
        console.log(err);
      } else {
        console.log(data);
      }
    });*/
  }
});
