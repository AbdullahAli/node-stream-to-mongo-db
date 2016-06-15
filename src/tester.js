import streamToMongoDB from "./index";
import { MongoClient } from "mongodb";

let config = {
    dbURL: 'mongodb://localhost:27017/match',
    collection: 'hmm',
    batchSize: 20000
};

let streamer = streamToMongoDB.streamToMongoDB(config);

MongoClient.connect(config.dbURL, function(err, db) {
    // console.log("Connected correctly to server");

    var col = db.collection('person_3_0_0');

    var cursor = col.find({}).stream();
    //
    // console.log("will pipe now...");
    cursor.pipe(streamer);

    cursor.once("finish", () => {
        console.log("camelcase");
        db.close();
    });

    cursor.once("end", () => {
        console.log("camelcase");
        db.close();
    });
});