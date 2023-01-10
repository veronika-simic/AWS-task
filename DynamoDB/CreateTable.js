const AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-1" });
const dynamodb = new AWS.DynamoDB();

const params = {
  TableName: "user-images",
  KeySchema: [
    {
      AttributeName: "image_id",
      KeyType: "HASH" /* partition key */,
    },
    {
      AttributeName: "fileName",
      KeyType: "RANGE" /* sort key */,
    },
  ],
  AttributeDefinitions: [
    { AttributeName: "image_id", AttributeType: "N" },
    { AttributeName: "fileName", AttributeType: "S" },
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 4,
    WriteCapacityUnits: 4,
  },
};

dynamodb.createTable(params, function (err, data) {
  if (err) {
    console.log(err);
  } else {
    console.log(data);
  }
});
