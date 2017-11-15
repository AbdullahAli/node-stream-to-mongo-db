import fs                  from 'fs';
import MongoDB             from 'mongodb';
import JSONStream          from 'JSONStream';
import { streamToMongoDB } from '../index';
import sampleDataGenerator from './sampleDataGenerator';

// feel free to change these
const numberOfDataItems     = 100;
const sampleDataOutputFile  = 'src/Dev/testDataDev.json';
const config = {
  dbURL: 'mongodb://localhost:27017/streamToMongoDB',
  collection: 'dev',
  batchSize: 1
};

const runTester = async () => {
  try {
    await clearDB();
    await sampleDataGenerator.insertSampleData(numberOfDataItems, sampleDataOutputFile);
    const inputDataStream = fs.createReadStream(sampleDataOutputFile).pipe(JSONStream.parse('*'));
    const streamer = await streamToMongoDB(config);

    console.log(`Streaming data to MongoDB [ count: ${numberOfDataItems} | batchSize : ${config.batchSize} ]`);
    inputDataStream.pipe(streamer);
    inputDataStream.on('end', () => console.log('-> DONE'));
  } catch (error) {
    console.log(error);
  }
};

const clearDB = async () => {
  try {
    const dbConnection = await MongoDB.MongoClient.connect(config.dbURL);
    await dbConnection.dropDatabase();
    await dbConnection.close();
  } catch (error) {
    console.log(error);
  }
};

runTester();
