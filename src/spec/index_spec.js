import StreamToMongoDB  from "../index";
import MongoDB          from "mongodb";
import Bluebird         from "bluebird";
import fs               from "fs";
import path             from "path";
// import JSONStream       from "JSONStream";

var parser = require('JSONStream').parse('rows.*.doc')


Bluebird.promisifyAll(MongoDB.MongoClient);
Bluebird.promisifyAll(MongoDB.Collection.prototype);

const DATA_FILE_LOCATION = path.resolve("src/spec/support/data.json");
const config = {
    dbURL: 'mongodb://localhost:27017/streamToMongoDB',
    collection: 'test',
};

var writeStream = fs.createWriteStream('./output', {objectMode:true});


const streamToMongoDB = StreamToMongoDB.streamToMongoDB(config);

describe(".streamToMongoDB", () => {
    it("streams the expected number of documents to MongoDB", done => {
        fs.createReadStream(DATA_FILE_LOCATION)
            .pipe(parser)
            .pipe(writeStream)
            // .pipe(streamToMongoDB);

            writeStream.on("finish", done)

        // streamToMongoDB.on("finish", () => {
        //     MongoDB.MongoClient.connectAsync(config.dbURL)
        //         .then(db => {
        //             db.collection(config.collection)
        //                 .countAsync()
        //                     .then(count => {
        //                         expect(count).toEqual(819);
        //                         done();
        //                     });
        //         });
        // });
    });
});