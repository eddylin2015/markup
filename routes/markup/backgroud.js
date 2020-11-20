
'use strict';

const config = require('./config');
const logging = require('./logging');
const topicName = config.get('TOPIC_NAME');
const subscriptionName = config.get('SUBSCRIPTION_NAME');

function getTopic(cb) {
  pubsub.createTopic(topicName, (err, topic) => {
    // topic already exists.
    if (err && err.code === 6) {
      cb(null, pubsub.topic(topicName));
      return;
    }
    cb(err, topic);
  });
}

// Used by the worker to listen to pubsub messages.
// When more than one worker is running they will all share the same
// subscription, which means that pub/sub will evenly distribute messages
// to each worker.
function subscribe(cb) {
  let subscription;

  // Event handlers
  function handleMessage(message) {
    const data = JSON.parse(message.data);
    message.ack();
    cb(null, data);
  }
  function handleError(err) {
    logging.error(err);
  }

  getTopic((err, topic) => {
    if (err) {
      cb(err);
      return;
    }

    topic.createSubscription(subscriptionName, (err, sub) => {
      if (err) {
        cb(err);
        return;
      }

      subscription = sub;

      // Listen to and handle message and error events
      subscription.on('message', handleMessage);
      subscription.on('error', handleError);

      logging.info(
        `Listening to ${topicName} with subscription ${subscriptionName}`
      );
    });
  });

  // Subscription cancellation function
  return () => {
    if (subscription) {
      // Remove event listeners
      subscription.removeListener('message', handleMessage);
      subscription.removeListener('error', handleError);
      subscription = undefined;
    }
  };
}

// Adds a book to the queue to be processed by the worker.
function queueBook(bookId) {
  getTopic((err, topic) => {
    if (err) {
      logging.error('Error occurred while getting pubsub topic', err);
      return;
    }

    const data = {
      action: 'processBook',
      bookId: bookId,
    };

    topic.publish(Buffer.from(JSON.stringify(data)), err => {
      if (err) {
        logging.error('Error occurred while queuing background task', err);
      } else {
        logging.info(`Book ${bookId} queued for background processing`);
      }
    });
  });
}

module.exports = {
  subscribe,
  queueBook,
};
