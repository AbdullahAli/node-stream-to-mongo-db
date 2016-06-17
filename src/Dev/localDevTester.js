import streamToMongoDB     from "../index";
import sampleDataGenerator from "./sampleDataGenerator";
import async               from "asyncawait/async";
import await               from "asyncawait/await";
import fs                  from "fs";
import MongoDB             from "mongodb";
import Bluebird            from "bluebird";
import JSONStream          from "JSONStream";

Bluebird.promisifyAll(MongoDB.MongoClient);

// feel free to change these
const NUMBER_OF_SAMPLE_DATA_TO_GENERATE = 100;
const SAMPLE_DATA_OUTPUT_PATH  = "src/Dev/testDataDev.json";

let config = {
    dbURL: "mongodb://localhost:27017/streamToMongoDB",
    collection: "dev",
    batchSize: 1
};

let streamer = streamToMongoDB.streamToMongoDB(config);

const runTester = async (function runTester() {
    try {
        await (clearDB());
        await (sampleDataGenerator.insertSampleData(NUMBER_OF_SAMPLE_DATA_TO_GENERATE, SAMPLE_DATA_OUTPUT_PATH));
        const inputDataStream = fs.createReadStream(SAMPLE_DATA_OUTPUT_PATH).pipe(JSONStream.parse('*'));

        process.stdout.write(`streaming data to MongoDB [ count: ${ NUMBER_OF_SAMPLE_DATA_TO_GENERATE } | batchSize : ${ config.batchSize } ] `);
        inputDataStream.pipe(streamer);

        inputDataStream.on("end", () => {
            console.log("-> DONE");
        });
    } catch (error) {
        console.log(error);
    }
});

function clearDB() {
    return new Bluebird((resolve, reject) => {
        try {
            const db = await (MongoDB.MongoClient.connectAsync(config.dbURL));
            db.collection(config.collection).drop(() => {
                db.close();
                resolve();
            });
        } catch (error) {
            reject(error);
        }
    });
}

runTester();