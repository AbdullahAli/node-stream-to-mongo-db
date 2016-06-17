import StreamToMongoDB  from "../index";
import MongoDB          from "mongodb";
import Bluebird         from "bluebird";
import fs               from "fs";
import path             from "path";
import JSONStream       from "JSONStream";
import async            from "asyncawait/async";
import await            from "asyncawait/await";

Bluebird.promisifyAll(MongoDB.MongoClient);
Bluebird.promisifyAll(MongoDB.Collection.prototype);
Bluebird.promisifyAll(MongoDB.Db.prototype);

const DATA_FILE_LOCATION = path.resolve("src/spec/support/data.json");
const testDB = "streamToMongoDB";
const config = { dbURL: `mongodb://localhost:27017/${testDB}`, collection: "test"};

let expectedNumberOfRecords = null;

describe(".streamToMongoDB", () => {
    beforeAll(async (done => {
        expectedNumberOfRecords = await (countNumberOfRecords());
        done();
    }));

    beforeEach(done => {
        await (clearDB());
        done();
    });

    afterAll(done => {
        await (clearDB());
        done();
    });

    describe("with no given options", () => {
        it("it uses the default config to stream the expected number of documents to MongoDB", done => {
            const streamToMongoDB = StreamToMongoDB.streamToMongoDB(config);
            await (ensureAllDocumentsInserted(streamToMongoDB));
            done();
        });
    });

    describe("with given options", () => {
        describe("with batchSize same as the number of documents to be streamed", () => {
            it("it streams the expected number of documents to MongoDB", done => {
                let options = Object.assign(config, { batchSize : expectedNumberOfRecords});
                const streamToMongoDB = StreamToMongoDB.streamToMongoDB(options);
                await (ensureAllDocumentsInserted(streamToMongoDB));
                done();
            });
        });

        describe("with batchSize less than number of documents to be streamed", () => {
            it("it streams the expected number of documents to MongoDB", done => {
                let options = Object.assign(config, { batchSize : expectedNumberOfRecords - 3});
                const streamToMongoDB = StreamToMongoDB.streamToMongoDB(options);
                await (ensureAllDocumentsInserted(streamToMongoDB));
                done();
            });
        });

        describe("with batchSize more than the number of documents to be streamed", () => {
            it("it streams the expected number of documents to MongoDB", done => {
                let options = Object.assign(config, { batchSize : expectedNumberOfRecords * 100 });
                const streamToMongoDB = StreamToMongoDB.streamToMongoDB(options);
                await (ensureAllDocumentsInserted(streamToMongoDB));
                done();
            });
        });
    });
});

function ensureAllDocumentsInserted(writableStream) {
    return new Bluebird((resolve, reject) => {
        jsonDataStream().pipe(writableStream);

        writableStream.on("close", () => {
            try {
                const db = await (MongoDB.MongoClient.connectAsync(config.dbURL));
                const count = await (db.collection(config.collection).countAsync());
                expect(count).toEqual(expectedNumberOfRecords);
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    });
}

function jsonDataStream() {
    return fs.createReadStream(DATA_FILE_LOCATION).pipe(JSONStream.parse('*'));
}

function clearDB() {
    return new Bluebird((resolve, reject) => {
        try {
            const db = await (MongoDB.MongoClient.connectAsync(config.dbURL));
            db.collection(config.collection).drop(resolve);
        } catch (error) {
            reject(error);
        }
    });
}

function countNumberOfRecords() {
    return new Bluebird(resolve => {
        const dataStream = jsonDataStream();
        let numberOfRecords = 0;

        dataStream.on("data", () => {
            numberOfRecords += 1;
        });

        dataStream.on("end", () => {
            resolve(numberOfRecords);
        });
    });
}