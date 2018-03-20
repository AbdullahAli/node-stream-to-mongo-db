/* global beforeAll, beforeEach, afterAll, expect, it, describe */
import MongoDB         from 'mongodb';
import fs              from 'fs';
import path            from 'path';
import JSONStream      from 'JSONStream';
import StreamToMongoDB from '../index';

const DATA_FILE_LOCATION = path.resolve('src/spec/support/data.json');
const testDB = 'streamToMongoDB';
const config = { dbURL: `mongodb://localhost:27017/${testDB}`, collection: 'test' };

const expectedNumberOfRecords = require('./support/data.json').length;

describe('.streamToMongoDB', () => {
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
      runStreamTest(config, done);
    });
  });

  describe('with given options', () => {
    describe('with batchSize same as the number of documents to be streamed', () => {
      it('it streams the expected number of documents to MongoDB', (done) => {
        config.batchSize = expectedNumberOfRecords;
        runStreamTest(config, done);
      });
    });

    describe('with batchSize less than number of documents to be streamed', () => {
      it('it streams the expected number of documents to MongoDB', (done) => {
        config.batchSize = expectedNumberOfRecords - 3;
        runStreamTest(config, done);
      });
    });

    describe('with batchSize more than the number of documents to be streamed', () => {
      it('it streams the expected number of documents to MongoDB', (done) => {
        config.batchSize = expectedNumberOfRecords * 100;
        runStreamTest(config, done);
      });
    });
  });
});

const connect = () => MongoDB.MongoClient.connect(config.dbURL);

const runStreamTest = (options, done) => {
  fs.createReadStream(DATA_FILE_LOCATION)
    .pipe(JSONStream.parse('*'))
    .pipe(StreamToMongoDB.streamToMongoDB(options))
    .on('error', (err) => {
      done();
    })
    .on('close', () => {
      ensureAllDocumentsInserted(done)
    })
};

const ensureAllDocumentsInserted = async (done) => {
  const db = await connect();
  const count = await db.collection(config.collection).count();
  await db.close();
  expect(expectedNumberOfRecords).toEqual(count);
  done();
};

const clearDB = async () => {
  const dbConnection = await connect();
  await dbConnection.dropDatabase();
  await dbConnection.close();
};
