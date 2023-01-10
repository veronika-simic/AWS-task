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

app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerJsDocs));

app.get("/image/:id", (req, res) => {
  res.send(req.params.id);
});

app.post("/upload-image", (req, res) => {
  if (!req.files) {
    res.status(400).send("No file uploaded");
  } else {
    console.log(
      "File with name ",
      + req.files.file.name + " was uploaded for processing."
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
        return res.status(200).send("File uploaded successfully.");
      }
    });
  }
});

app.listen(4000, () => console.log("Running"));
