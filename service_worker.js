const SQSWorker = require("sqs-worker");

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
