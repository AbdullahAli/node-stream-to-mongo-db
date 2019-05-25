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

    const open = async () => {
      if (config.dbConnection) {
        dbConnection = config.dbConnection; // eslint-disable-line prefer-destructuring
      } else {
        client = await MongoClient.connect(config.dbURL, { useNewUrlParser: true });
        dbConnection = await client.db();
      }
      dbConnection.on('error', () => writable.destroy());
      if (!collection) collection = await dbConnection.collection(config.collection);
    }

    // this function is usefull to insert records and reset the records array
    const insert = async () => {
      await collection.insertMany(records, config.insertOptions);
      records = [];
    };

    const close = async () => {
      if (!config.dbConnection && client) {
        await client.close();
      }
      writable.emit('close');
    };

    // stream
    const writable = new Writable({
      objectMode: true,
      autoDestroy: false, // Force nodejs-8.xx like functionality
      emitClose: false, // Force nodejs-8.xx like functionality
      write: async (record, encoding, next) => {
        // connection
        if (!dbConnection) {
          await open();
        }

        // add to batch records
        records.push(record);

        // insert and reset batch recors
        if (records.length >= config.batchSize) await insert();

        // next stream
        next();
      },
      final: async (done) => {
        try {
          if (records.length > 0) await insert();
          done();
        } catch (error) {
          done(error);
        } finally {
          writable.destroy();
        }
      },
      destroy: async (error, done) => {
        await close();
        done();
      }
    });

    return writable;
  },
};
