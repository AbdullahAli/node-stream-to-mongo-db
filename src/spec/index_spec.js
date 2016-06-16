import StreamToMongoDB  from "../index";
import MongoDB          from "mongodb";
import Bluebird         from "bluebird";
import fs               from "fs";
import path             from "path";
import JSONStream       from "JSONStream";

Bluebird.promisifyAll(MongoDB.MongoClient);
Bluebird.promisifyAll(MongoDB.Collection.prototype);
Bluebird.promisifyAll(MongoDB.Db.prototype);


const DATA_FILE_LOCATION = path.resolve("src/spec/support/data.json");
const testDB = "streamToMongoDB";
const config = { dbURL: `mongodb://localhost:27017/${testDB}`, collection: "test" };

let expectedNumberOfRecords = null;

describe(".streamToMongoDB", () => {
    beforeAll(done => {
        countNumberOfRecords()
            .then(num => {
                expectedNumberOfRecords = num;
                done();
            });
    });

    beforeEach(done => {
        clearDB().then(done);
    });

    afterAll(done => {
        clearDB().then(done);
    });

    describe("with no given options", () => {
        it("it uses the default config to stream the expected number of documents to MongoDB", done => {
            const streamToMongoDB = StreamToMongoDB.streamToMongoDB(config);
            ensureAllDocumentsInserted(streamToMongoDB, done).then(done);
        });
    });

    describe("with given options", () => {


        describe("with batchSize same as the number of documents to be streamed", () => {
            it("it streams the expected number of documents to MongoDB", done => {
                let options = Object.assign(config, { batchSize : expectedNumberOfRecords });
                const streamToMongoDB = StreamToMongoDB.streamToMongoDB(options);
                ensureAllDocumentsInserted(streamToMongoDB).then(done);
            });
        });

        describe("with batchSize less than number of documents to be streamed", () => {
            it("it streams the expected number of documents to MongoDB", done => {
                let options = Object.assign(config, { batchSize : expectedNumberOfRecords - 3 });
                const streamToMongoDB = StreamToMongoDB.streamToMongoDB(options);
                ensureAllDocumentsInserted(streamToMongoDB).then(done);
            });
        });

        describe("with batchSize more than the number of documents to be streamed", () => {
            it("it streams the expected number of documents to MongoDB", done => {
                let options = Object.assign(config, { batchSize : expectedNumberOfRecords * 100 });
                const streamToMongoDB = StreamToMongoDB.streamToMongoDB(options);
                ensureAllDocumentsInserted(streamToMongoDB).then(done);
            });
        });
    });
});

function ensureAllDocumentsInserted(writableStream) {
    return new Bluebird((resolve, reject) => {
        jsonDataStream().pipe(writableStream);

        writableStream.on("close", () => {
            MongoDB.MongoClient.connectAsync(config.dbURL)
                .then(db => {
                    db.collection(config.collection).countAsync()
                        .then(count => {
                            expect(count).toEqual(expectedNumberOfRecords);
                        })
                        .then(resolve);
                })
                .catch(error => reject(error));
        });
    });
}

function jsonDataStream() {
    return fs.createReadStream(DATA_FILE_LOCATION).pipe(JSONStream.parse('*'));
}

function clearDB() {
    return new Bluebird((resolve, reject) => {
        MongoDB.MongoClient.connectAsync(config.dbURL)
            .then(db => db.collection(config.collection).drop(resolve))
            .catch(error => reject(error));
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