const AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-1" });
const dynamodb = new AWS.DynamoDB();

const params = {
  TableName: "user-images-data",
  KeySchema: [
    {
      AttributeName: "image_id",
      KeyType: "HASH" /* partition key */,
    },
  ],
  AttributeDefinitions: [
    { AttributeName: "image_id", AttributeType: "N" },
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
