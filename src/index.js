import { Writable } from 'stream';
import MongoDB      from 'mongodb';

let config       = {};
let batch        = [];
let dbConnection = null;
const defaultConfig = {
  batchSize: 1,
  insertOptions: { w: 1 }
};

const streamToMongoDB = (options) => {
  setupConfig(options);
  return writableStream();
};

const connect = () => MongoDB.MongoClient.connect(config.dbURL);

const insertToMongo = async (records) => {
  try {
    await dbConnection.collection(config.collection).insert(records, config.insertOptions);
    resetBatch();
  } catch (error) {
    console.log(error);
  }
};

const addToBatch = (record) => {
  return new Promise(async (resolve) => {
    try {
      batch.push(record);

      if(batch.length === config.batchSize) {
        await insertToMongo(batch);
        resolve();
      } else {
        resolve();
      }
    } catch (error) {
      console.log(error);
    }
  });
};

const writableStream = () => {
  const writable = new Writable({
    objectMode: true,
    write: async (record, encoding, next) => {
      try {
        if(dbConnection) {
          await addToBatch(record);
          next();
        } else {
          dbConnection = await connect();
          await addToBatch(record);
          next();
        }
      } catch (error) {
        console.log(error);
      }
    }
  });

  writable.on('finish', async () => {
    try {
      if(batch.length) {
        await insertToMongo(batch);
      }
      dbConnection.close();
      resetConn();
      writable.emit('close');
    } catch(error) {
      console.log(error);
    }
  });

  return writable;
};

const setupConfig = (options) => {
  config = options;
  // add required options if not exists
  Object.keys(defaultConfig).forEach((configKey) => {
    if(!config[configKey]) {
      config[configKey] = defaultConfig[configKey];
    }
  });
};

const resetConn = () => {
  dbConnection = null;
};

const resetBatch = () => {
  batch = [];
};

module.exports = { streamToMongoDB };
