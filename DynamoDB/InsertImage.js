const AWS = require("aws-sdk");

const docClient = new AWS.DynamoDB.DocumentClient();

const table = "user-images";

const image_id = 1;
const fileName = "";
const state = "in progress";
const originalFilePath = "";
const processedFilePath = "";
const params = {
  TableName: table,
  Item: {
    image_id: image_id,
    fileName: fileName,
    originalFilePath: originalFilePath,
    processedFilePath: processedFilePath,
    state: state,
  },
};

console.log("Adding the image to table..... ");

docClient.put(params, function (err, data) {
  if (err) {
    console.log("Unable to add the image", err);
  } else {
    console.log("Image added", data);
  }
});
