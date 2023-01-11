const express = require("express");
const swaggerUI = require("swagger-ui-express");
const YAML = require("yamljs");
const upload = require("express-fileupload");
const swaggerJsDocs = YAML.load("./api.yaml");
const AWS = require("aws-sdk");
const app = express();
app.use(express.json());
app.use(upload());

const s3 = new AWS.S3({
  region: "us-east-1",
});

const TABLE_NAME = "user-images";
const dynamoDB = new AWS.DynamoDB.DocumentClient({ region: "us-east-1" });
const sqs = new AWS.SQS({ region: "us-east-1" });
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerJsDocs));

app.post("/upload-image", (req, res) => {
  if (!req.files) {
    res.status(400).send("No file uploaded");
  } else {
    console.log(
      "File with name ",
      +req.files.file.name + " was uploaded for processing."
    );
    // Get the uploaded file
    const uploadedFile = req.files.file;
    const fileName = uploadedFile.name;
    const fileData = uploadedFile.data;
   
    // Set up the S3 upload parameters
    const uploadParams = {
      Bucket: "images-bucket-vera",
      Key: fileName,
      Body: fileData,
    };

    // Upload the file to S3
    s3.upload(uploadParams, (err, data) => {
      if (err) {
        console.log(err);
        return res.status(500).send("Error uploading file to S3.");
      } else {
        console.log(`File uploaded successfully. ${data.Location}`);
      }

      /* Add image properties to DynamoDB */
      const image_id = Math.floor(Math.random(0, 10000));
      const params = {
        TableName: TABLE_NAME,
        Item: {
          image_id: image_id,
          fileName: fileName,
          originalFilePath: data.Location + "/" + image_id,
          processedFilePath: "",
          image_state: "in progress",
        },
      };
      dynamoDB.put(params, (error) => {
        if (error) {
          console.log(error);
          return res.status(500).send("Could not add image to dynamo db");
        } else {
          console.log("Image data added to table");
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
          taskState: "in progress",
        }),
      };
      sqs.sendMessage(sqsParams, (error, data) => {
        if (error) {
          console.log("Error sending message to SQS: ", error);
        } else {
          console.log("Message sent to SQS:", data.MessageId);
        }
      });
    });
  }
});

app.get("/image/:id", (req, res) => {
  res.send(req.params.id);
});

app.listen(4000, () => console.log("Running"));
