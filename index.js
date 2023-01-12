/* express */
const express = require("express");
const app = express();
const upload = require("express-fileupload");

/* swagger */
const swaggerUI = require("swagger-ui-express");
const YAML = require("yamljs");
const swaggerJsDocs = YAML.load("./api.yaml");

/* aws */
const AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-1" });
const s3 = new AWS.S3();
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS();

const TABLE_NAME = "user-images";

app.use(express.json());
app.use(upload());
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerJsDocs));

app.post("/upload-image", (req, res) => {
  const uploadedFile = req.files.file;
  const fileName = uploadedFile.name;
  const fileData = uploadedFile.data;

  if (!req.files) {
    res.status(400).send("No file uploaded");
  } else {
    console.log("File with name " + fileName + " was uploaded for processing.");

    const s3Params = {
      Bucket: "images-bucket-vera",
      Key: fileName,
      Body: fileData,
    };
    s3.upload(s3Params, (err, data) => {
      if (err) {
        console.log(err);
        return res.status(500).send("Error uploading file to S3.");
      } else {
        console.log(`File uploaded successfully. ${data.Location}`);
      }

      const image_id = Math.floor(Math.random(0, 10000));
      const dynamoParams = {
        TableName: TABLE_NAME,
        Item: {
          image_id: image_id,
          fileName: fileName,
          originalFilePath: data.Location + "/" + image_id,
          processedFilePath: "",
          image_state: "in progress",
        },
      };
      dynamoDB.put(dynamoParams, (error) => {
        if (error) {
          console.log(error);
          return res.status(500).send("Could not add image to table");
        } else {
          console.log("Image data added to table " + TABLE_NAME);
          return res.status(200).send("Image data added successfully");
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
      };
      console.log(sqsParams.MessageBody)
      /* sqs.sendMessage(sqsParams, (error, data) => {
        if (error) {
          console.log("Error sending message to SQS: ", error);
        } else {
          console.log("Message sent to SQS:", data.MessageId);
        }
      }); */
    });
  }
});

app.get("/image/:id", (req, res) => {
  res.send(req.params.id);
});

app.listen(4000, () => console.log("Running"));
