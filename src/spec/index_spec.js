import StreamToMongoDB  from "../index";
import MongoDB          from "mongodb";
import Bluebird         from "bluebird";
import fs               from "fs";
import path             from "path";
import JSONStream       from "JSONStream";

Bluebird.promisifyAll(MongoDB.MongoClient);
Bluebird.promisifyAll(MongoDB.Collection.prototype);

const DATA_FILE_LOCATION = path.resolve("src/spec/support/data.json");
const config = { dbURL: 'mongodb://localhost:27017/streamToMongoDB', collection: 'test' };
const streamToMongoDB = StreamToMongoDB.streamToMongoDB(config);

let expectedNumberOfRecords = null;

describe(".streamToMongoDB", () => {
    beforeAll(done => {
        countNumberOfRecords()
            .then(num => {
                expectedNumberOfRecords = num;
            })
            .then(() => {
                clearDB()
                    .then(done);
            });
    });

    afterAll(done => {
        clearDB()
            .then(done);
    });

    describe("with no given options", () => {
        it("it uses the default config to stream the expected number of documents to MongoDB", done => {
            const dataStream = jsonDataStream();
            dataStream.pipe(streamToMongoDB);

            streamToMongoDB.on("finish", () => {
                MongoDB.MongoClient.connectAsync(config.dbURL)
                    .then(db => {
                        db.collection(config.collection).countAsync()
                            .then(count => {
                                expect(count).toEqual(expectedNumberOfRecords);
                                done();
                            });
                    });
            });
        });
    });
});

function jsonDataStream() {
    return fs.createReadStream(DATA_FILE_LOCATION).pipe(JSONStream.parse('*'));
}

function clearDB() {
    return new Bluebird((resolve, reject) => {
        MongoDB.MongoClient.connectAsync(config.dbURL)
            .then(db => {
                db.collection(config.collection).dropAsync()
                    .then(resolve)
                    .catch(error => {
                        if(error.message === "ns not found") {
                            resolve();
                        } else {
                            reject(error);
                        }
                    });
            });
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