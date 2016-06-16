import streamToMongoDB from "./index";
import { MongoClient } from "mongodb";

let config = {
    dbURL: 'mongodb://localhost:27017/match',
    collection: 'hmm',
    batchSize: 20000
};

let streamer = streamToMongoDB.streamToMongoDB(config);

MongoClient.connect(config.dbURL, function(err, db) {
    var col = db.collection('person_3_0_0');

    var cursor = col.find({}).stream();
    cursor.pipe(streamer);

    cursor.once("finish", () => {
        db.close();
    });

    cursor.once("end", () => {
        db.close();
    });
});