/* global beforeEach, afterAll, expect, it, describe */
import MongoDB from 'mongodb';
import fs from 'fs';
import path from 'path';
import JSONStream from 'JSONStream';
import StreamToMongoDB from '../index';

const DATA_FILE_LOCATION = path.resolve('src/spec/support/data.json');
const testDB = 'streamToMongoDB';
let config;

const expectedNumberOfRecords = require('./support/data.json').length;

describe('.streamToMongoDB', () => {
  beforeEach(async (done) => {
    config = { dbURL: `mongodb://localhost:27017/${testDB}`, collection: 'test' };
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

    describe('with caller provided connection', () => {
      it('it keeps the connection open', (done) => {
        config.batchSize = expectedNumberOfRecords * 100;
        connect().then(async (client) => {
          const dbConnection = await client.db();
          let closed = false;

          config.dbConnection = dbConnection;

          dbConnection.on('close', () => {
            closed = true;
          });
          runStreamTest(config, () => {
            expect(client.isConnected()).toBeTruthy();
            expect(closed).toEqual(false);
            client.close()
              .then(done)
              .catch(done.fail)
          });
        }).catch(done.fail);
      });
    });
  });
});

const connect = () => MongoDB.MongoClient.connect(config.dbURL, { useNewUrlParser: true });

const runStreamTest = (options, done) => {
  fs.createReadStream(DATA_FILE_LOCATION)
    .pipe(JSONStream.parse('*'))
    .pipe(StreamToMongoDB.streamToMongoDB(options))
    .on('error', (err) => {
      done.fail(err);
    })
    .on('close', () => {
      ensureAllDocumentsInserted(done);
    });
};

const ensureAllDocumentsInserted = async (done) => {
  const client = await connect();
  const db = await client.db();
  const count = await db.collection(config.collection).countDocuments();

  await client.close();

  expect(count).toEqual(expectedNumberOfRecords);
  done();
};

const clearDB = async () => {
  const client = await connect();
  const dbConnection = await client.db();

  await dbConnection.dropDatabase();
  await client.close();
};
