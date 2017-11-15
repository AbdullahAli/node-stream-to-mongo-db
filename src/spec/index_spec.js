/* global beforeAll, beforeEach, afterAll, expect, it, describe */
import MongoDB         from 'mongodb';
import fs              from 'fs';
import path            from 'path';
import JSONStream      from 'JSONStream';
import StreamToMongoDB from '../index';

const DATA_FILE_LOCATION = path.resolve('src/spec/support/data.json');
const testDB = 'streamToMongoDB';
const config = { dbURL: `mongodb://localhost:27017/${testDB}`, collection: 'test' };

let expectedNumberOfRecords = null;

describe('.streamToMongoDB', () => {
  beforeAll(async (done) => {
    expectedNumberOfRecords = await countNumberOfRecords();
    done();
  });

  beforeEach(async (done) => {
    await clearDB();
    done();
  });

  afterAll(async (done) => {
    await clearDB();
    done();
  });

  describe('with no given options', () => {
    it('it uses the default config to stream the expected number of documents to MongoDB', async (done) => {
      const streamToMongoDB = await StreamToMongoDB.streamToMongoDB(config);
      await ensureAllDocumentsInserted(streamToMongoDB);
      done();
    });
  });

  describe('with given options', () => {
    describe('with batchSize same as the number of documents to be streamed', () => {
      it('it streams the expected number of documents to MongoDB', async (done) => {
        config.batchSize = expectedNumberOfRecords;
        runStreamTest(config, done);
      });
    });

    describe('with batchSize less than number of documents to be streamed', () => {
      it('it streams the expected number of documents to MongoDB', async (done) => {
        config.batchSize = expectedNumberOfRecords - 3;
        runStreamTest(config, done);
      });
    });

    describe('with batchSize more than the number of documents to be streamed', () => {
      it('it streams the expected number of documents to MongoDB', async (done) => {
        config.batchSize = expectedNumberOfRecords * 100;
        runStreamTest(config, done);
      });
    });
  });
});

const runStreamTest = async (options, done) => {
  try {
    const streamToMongoDB = await StreamToMongoDB.streamToMongoDB(options);
    await ensureAllDocumentsInserted(streamToMongoDB);
    done();
  } catch (error) {
    done();
    console.log(error);
  }
};

const ensureAllDocumentsInserted = async (writableStream) => {
  jsonDataStream().pipe(writableStream);

  writableStream.on('close', async () => {
    try {
      const db = await connect();
      const count = await db.collection(config.collection).count();
      expect(count).toEqual(expectedNumberOfRecords);
    } catch (error) {
      console.log(error);
    }
  });
};

const clearDB = async () => {
  try {
    const dbConnection = await connect();
    await dbConnection.dropDatabase();
  } catch (error) {
    console.log(error);
  }
};

const jsonDataStream = () => fs.createReadStream(DATA_FILE_LOCATION).pipe(JSONStream.parse('*'));
const connect = async () => MongoDB.MongoClient.connect(config.dbURL);

const countNumberOfRecords = async () => {
  const dataStream = jsonDataStream();
  let numberOfRecords = 0;

  dataStream.on('data', () => {
    numberOfRecords += 1;
  });

  dataStream.on('end', () => {
    Promise.resolve(numberOfRecords);
  });
};
