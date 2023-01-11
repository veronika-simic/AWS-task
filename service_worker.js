/* const SQSWorker = require("sqs-worker");

const options = {
  url: "https://sqs.us-east-1.amazonaws.com/222621649155/ImageQueue.fifo",
};

const queue = new SQSWorker(options, worker);

function worker(notifi, done) {
  let message;
  try {
    message = JSON.parse(notifi.Data);
  } catch (error) {
    throw error;
  }

  console.log(message);
  let success = true;

  done(null, success);
}
 */

/* get image from s3 */
const sharp = require("sharp");
const AWS = require("aws-sdk");
const s3 = new AWS.S3({ region: "us-east-1" });
const fs = require("fs");
s3.getObject(
  { Bucket: "images-bucket-vera", Key: "AWS.png" },
  (error, data) => {
    if (error) {
      console.log(error);
    } else {
      console.log(data);
    }
  }
);

const uploadFile = (fileName, bucketName) => {
    let fileContent = fs.readFileSync(fileName);
    fileContent = sharp(fileContent).rotate(180);
    const params = {
      Bucket: bucketName,
      Key: "AWS.png",
      Body: fileContent,
    };
  
    s3.upload(params, (err, data) => {
      if (err) {
        console.log(err);
      } else {
        console.log(data);
      }
    });
  };
  
  uploadFile('AWS.png', 'rotated-images')
  
/* update state and url path in dynamoDB */
