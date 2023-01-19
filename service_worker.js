const AWS = require("aws-sdk");

AWS.config.update({
  region: "us-east-1",
});

const sqs = new AWS.SQS();

const sharp = require("sharp");
const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB();
const dynamodbClient = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = "user-images-data";

const queueUrl =
  "https://sqs.us-east-1.amazonaws.com/222621649155/ImageQueue.fifo";

const fs = require("fs");
const request = require("request");

module.exports = () => {
  const download = async function (uri, filename, callback) {
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
      const image_id = JSON.parse(data.Messages[0].Body).image_id;
      const dynamoGetParams = {
        Key: {
          image_id: {
            N: image_id.toString(),
          },
        },
        TableName: TABLE_NAME,
      };
      dynamodb.getItem(dynamoGetParams, (error, data) => {
        if (error) {
          console.log(error);
        } else {
          console.log("Fetching image....");
          download(data.Item.originalFilePath.S, "user-image.jpg", function () {
            console.log("Image is ready for processing");
            
          });
        }
      });

      setTimeout(() => {
        fileContent = sharp("./user-image.jpg", { failOnError: false }).rotate(
          180
        );
        let dynamoParams = {
          TableName: TABLE_NAME,
          Key: {
            image_id: image_id,
          },
          UpdateExpression: "set image_state = :s",
          ExpressionAttributeValues: {
            ":s": "in progress",
          },
        };
        dynamodbClient.update(dynamoParams, function (err, data) {
          if (err) {
            console.log(err);
          } else {
            console.log("State changed to in progress");
          }
        });
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
            console.log(`Find it here:  ${data.Location}`);
            dynamoParams = {
              TableName: TABLE_NAME,
              Key: {
                image_id: image_id,
              },
              UpdateExpression: "set processedFilePath = :p, image_state = :s",
              ExpressionAttributeValues: {
                ":p": data.Location,
                ":s": "finished",
              },
            };
            setTimeout(() => {
              dynamodbClient.update(dynamoParams, function (err, data) {
                if (err) {
                  return err;
                } else {
                  console.log("State changed to finished");
                  return data;
                }
              });
            }, "5000");
          }
        });
        var deleteParams = {
          QueueUrl: queueUrl,
          ReceiptHandle: data.Messages[0].ReceiptHandle,
        };

        sqs.deleteMessage(deleteParams, function (err, data) {
          if (err) {
            return err;
          } else {
            return data;
          }
        });
      }, "3000");

      setTimeout(() => {
        fs.unlink("./user-image.jpg", () => {
          return "Image deleted";
        });
      }, "4000");
    }
  });
};
