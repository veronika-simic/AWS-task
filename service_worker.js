const AWS = require("aws-sdk");

AWS.config.update({
  region: "us-east-1",
});

const sqs = new AWS.SQS();

const sharp = require("sharp");
const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB();
const TABLE_NAME = "user-images";

const queueUrl =
  "https://sqs.us-east-1.amazonaws.com/222621649155/ImageQueue.fifo";

const fs = require("fs");
const request = require("request");

const download = function (uri, filename, callback) {
  request.head(uri, () => {
    request(uri).pipe(fs.createWriteStream(filename)).on("close", callback);
  });
};
const sqsParams = {
  QueueUrl: queueUrl,
  MaxNumberOfMessages: 10,
  VisibilityTimeout: 20,
  WaitTimeSeconds: 5,
};

sqs.receiveMessage(sqsParams, function (err, data) {
  if (err) {
    console.log("Receive Error", err);
  } else if (data.Messages) {
    const dynamoGetParams = {
      Key: {
        image_id: {
          N: JSON.parse(data.Messages[0].Body).image_id.toString(),
        },
        fileName: {
          S: JSON.parse(data.Messages[0].Body).fileName,
        },
      },
      TableName: TABLE_NAME,
    };

    dynamodb.getItem(dynamoGetParams, (error, data) => {
      if (error) {
        console.log(error);
      } else {
        download(data.Item.originalFilePath.S, "user-image.jpeg", function () {
          console.log("done");
        });
      }
    });

    fileContent = sharp("./user-image.jpeg").rotate(180);
    const s3params = {
      Bucket: "rotated-images",
      Key:
        JSON.parse(data.Messages[0].Body).image_id.toString() +
        JSON.parse(data.Messages[0].Body).fileName,
      Body: fileContent,
    };
    s3.upload(s3params, (err, data) => {
      if (err) {
        console.log(err);
      } else {
        console.log(`File uploaded successfully. ${data.Location}`);
        const dynamoParams = {
          TableName: TABLE_NAME,
          Key: {
            image_id: s3params.Key,
            fileName: JSON.parse(data.Messages[0].Body).fileName,
          },
          UpdateExpression: "set processedFilePath = :p, image_state = :s",
          ExpressionAttributeValues: {
            ":p": data.Location,
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
        });
      }
    });

    var deleteParams = {
      QueueUrl: queueUrl,
      ReceiptHandle: data.Messages[0].ReceiptHandle,
    };

    sqs.deleteMessage(deleteParams, function (err, data) {
      if (err) {
        console.log("Delete Error", err);
      } else {
        console.log("Message Deleted", data);
      }
    });
  }
});

/* while the image is being rotated state should be in progress */
