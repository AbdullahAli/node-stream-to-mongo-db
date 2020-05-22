import { Writable } from 'stream';
import { MongoClient } from 'mongodb';

module.exports = {
  streamToMongoDB: (options) => {
    const config = Object.assign(
      // default config
      {
        batchSize: 1,
        insertOptions: { w: 1 },
      },
      // overrided options
      options,
    );

    // those variables can't be initialized without Promises, so we wait first drain
    let client;
    let dbConnection;
    let collection;
    let records = [];

    // this function is usefull to insert records and reset the records array
    const insert = async () => {
      await collection.insertMany(records, config.insertOptions);
      records = [];
    };

    const close = async () => {
      if (!config.dbConnection && client) {
        await client.close();
      }
    };

    // stream
    const writable = new Writable({
      objectMode: true,
      write: async (record, encoding, next) => {
        try {
          // connection
          if (!dbConnection) {
            if (config.dbConnection) {
              dbConnection = config.dbConnection; // eslint-disable-line prefer-destructuring
            } else {
              client = await MongoClient.connect(config.dbURL, { useNewUrlParser: true, useUnifiedTopology: true });
              dbConnection = await client.db();
            }
          }
          if (!collection) collection = await dbConnection.collection(config.collection);

          // add to batch records
          records.push(record);

          // insert and reset batch recors
          if (records.length >= config.batchSize) await insert();

          // next stream
          next();
        } catch (error) {
          await close();
          writable.emit('error', error);
        }
      }
    });

    writable.on('finish', async () => {
      try {
        if (records.length > 0) await insert();
        await close();

        writable.emit('close');
      } catch(error) {
        await close();

        writable.emit('error', error);
      }
    });

    return writable;
  },
};
