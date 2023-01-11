const AWS = require("aws-sdk");
const s3 = new AWS.S3({ region: "us-east-1" });
const params = {
  Bucket: "rotated-images",
  ACL: "public-read-write" /* defines who has access to bucket, if not specified by default is private, it can also be public-read-write */,
};

s3.createBucket(params, function (err, data) {
  if (err) {
    console.log(err);
  } else {
    console.log(data);
  }
});
