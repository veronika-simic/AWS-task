/* express */
const express = require("express");
const app = express();
const upload = require("express-fileupload");
/* swagger */
const swaggerUI = require("swagger-ui-express");
const YAML = require("yamljs");
const swaggerJsDocs = YAML.load("./api.yaml");

const sw = require("./service_worker");

/* aws */
const AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-1" });
const s3 = new AWS.S3();
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const dynamodb = new AWS.DynamoDB();
const sqs = new AWS.SQS();

const auth = require("./auth");

const TABLE_NAME = "user-images-data";

app.use(express.json());
app.use(upload());
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerJsDocs));

app.post("/upload-image", (req, res) => {
  const image_id = Math.floor(Math.random(0, 1) * 10000);
  const uploadedFile = req.files.file;
  const fileName = uploadedFile.name;
  const fileData = uploadedFile.data;

  if (!req.files) {
    res.status(400).send("No file uploaded");
  } else {
    auth(req, res);
    console.log("File with name " + fileName + " was uploaded for processing.");

    const s3Params = {
      Bucket: "images-bucket-vera",
      Key: image_id + fileName,
      Body: fileData,
    };
    console.log(s3Params.Key);
    s3.upload(s3Params, (err, data) => {
      if (err) {
        console.log(err);
        return res.status(500).send("Error uploading file to S3.");
      } else {
        console.log(`File uploaded successfully. ${data.Location}`);
      }

      const dynamoParams = {
        TableName: TABLE_NAME,
        Item: {
          image_id: image_id,
          fileName: fileName,
          originalFilePath: data.Location,
          processedFilePath: "",
          image_state: "created",
        },
      };
      dynamoDB.put(dynamoParams, (error) => {
        if (error) {
          console.log(error);
          return res
            .status(500)
            .send("Could not add file to table. Check the file type");
        } else {
          console.log("Image data added to table " + TABLE_NAME);
          return res
            .status(200)
            .send(
              "Image data added successfully. Image id is: " +
                image_id +
                " use it to get the rotated image."
            );
        }
      });

      const sqsParams = {
        MessageGroupId: String(image_id),
        MessageDeduplicationId: String(image_id),
        QueueUrl:
          "https://sqs.us-east-1.amazonaws.com/222621649155/ImageQueue.fifo",
        MessageBody: JSON.stringify({
          image_id: image_id,
          fileName: fileName,
          taskState: "created",
        }),
        MessageAttributes: {
          image_id: {
            DataType: "String",
            StringValue: String(image_id),
          },
          fileName: {
            DataType: "String",
            StringValue: fileName,
          },
          state: {
            DataType: "String",
            StringValue: dynamoParams.Item.image_state,
          },
        },
      };
      console.log(sqsParams.MessageBody);
      sqs.sendMessage(sqsParams, (error, data) => {
        if (error) {
          console.log("Error sending message to SQS: ", error);
        } else {
          console.log("Message sent to SQS:", data.MessageId);
        }
        sw();
      });
    });
  }
});

app.get("/image/:id", (req, res) => {
  const dynamoGetParams = {
    Key: {
      image_id: {
        N: req.params.id.toString(),
      },
    },
    TableName: TABLE_NAME,
  };

  dynamodb.getItem(dynamoGetParams, (error, data) => {
    if (error) {
      console.log(error);
      return res.status(500).send("Error getting item from DynamoDB");
    } else {
      console.log("Item retrieved from DynamoDB");
      console.log("Item state is:", data.Item.image_state.S);
      console.log("Item file name is:", data.Item.fileName.S);
      console.log("Item original S3 path is:", data.Item.originalFilePath.S);
      console.log("Item processed S3 path is:", data.Item.processedFilePath.S);
      return res.status(200).send(data.Item);
    }
  });
});

app.listen(4000, () => console.log("Running"));
