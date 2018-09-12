import { Writable } from 'stream';
import { MongoClient } from 'mongodb';

module.exports = {
  streamToMongoDB: (options) => {
    const config = Object.assign(
      // default config
      {
        batchSize: 1,
        operationType: 'insert'
      },
      // override config
      options
    );

    // These variables can't be initialized without Promises, so we wait for the first drain
    let dbConnection;
    let collection;
    let records = [];

    // Supported operations
    const operations = {
      insert: async () => {
        return collection.insertMany(records);
      },
      update: async () => {
        // make sure we have some index so we can select the correct record to update
        if (typeof config.indexName === 'undefined') {
          return Promise.reject(Error('Operation type was update, but no index was provided.'));
        }

        // update each record in tandem.
        return Promise.all(records.map(doc =>
          collection.updateMany({ [config.indexName]: doc[config.indexName] }, { $set: doc })));
      },
      delete: async () => {
        // make sure we have some index so we can select the correct record to update
        if (typeof config.indexName === 'undefined') {
          return Promise.reject(Error('Operation type was delete, but no index was provided.'));
        }

        // update each record in tandem.
        return Promise.all(records.map(doc =>
          collection.deleteMany({ [config.indexName]: doc[config.indexName] }, { $set: doc })));
      },
      invalid: () => { return Promise.reject(Error(`Invalid operation type: ${config.operationType}`)); }
    };

    // Utility for writing to the db with the correct operation
    const writeToDB = async () => {
      if (Object.keys(operations).includes(config.operationType)) {
        try {
          return operations[config.operationType]();
        } catch (err) {
          return operations.invalid();
        }
      } else {
        // TODO: add some kind of error message for invalid operations
        return operations.invalid();
      }
    };

    // stream
    const writable = new Writable({
      objectMode: true,
      write: async (record, encoding, next) => {
        // try/catch for initialization
        try {
          // connection
          if (!dbConnection) dbConnection = await MongoClient.connect(config.dbURL);
          if (!collection) collection = await dbConnection.collection(config.collection);
        } catch (err) {
          if (dbConnection) await dbConnection.close();
          writable.emit('Error on db init', err);
        }

        // try/catch for write operations
        try {
          // add to batch records
          records.push(record);

          // write and reset batch records
          if (records.length >= config.batchSize) {
            await writeToDB();
            records = [];
          }

          next();
        } catch (error) {
          if (dbConnection) await dbConnection.close();
          writable.emit('Error on data write', error);
        }
      }
    });

    writable.on('finish', async () => {
      try {
        if (records.length > 0) await writeToDB();
        if (dbConnection) await dbConnection.close();

        writable.emit('close');
      } catch(error) {
        if (dbConnection) await dbConnection.close();

        writable.emit('error', error);
      }
    });

    return writable;
  },
};
