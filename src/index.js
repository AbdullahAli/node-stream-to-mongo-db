import { Writable    } from 'stream';
import Bluebird        from 'bluebird';
import MongoDB         from "mongodb";

Bluebird.promisifyAll(MongoDB.MongoClient);
Bluebird.promisifyAll(MongoDB.Collection.prototype);

let config = {};
let conn   = {};
let batch  = [];

let insertOptions = { w : 1};

function streamToMongoDB(options) {
    config = options;

    if(!config.batchSize) {
        config.batchSize = 1;
    }

    let writer = writableStream();

    return writer;
}

function connect() {
    return new Bluebird((resolve, reject) => {
        MongoDB.MongoClient.connectAsync(config.dbURL)
            .then(db => {
                conn.db = db;
                conn.collection = conn.db.collection(config.collection);
                resolve();
            })
            .catch(error => reject(error));
    });
}

function insertToMongo(records) {
    return new Bluebird((resolve, reject) => {
        conn.collection.insertAsync(records, insertOptions)
            .then(resolve)
            .catch(error => reject(error));
    });
}

function insert(record) {
    return new Bluebird(resolve => {
        batch.push(record.person);

        if(batch.length === config.batchSize) {
            insertToMongo(batch)
                .then(() => {
                    batch = [];
                    resolve();
                });
        } else {
            resolve();
        }
    });
}

function writableStream() {
    let writableStream = new Writable({
        objectMode: true,
        write: function(record, encoding, next) {
            if(conn.db) {
                insert(record).then(next);
            } else {
                connect().then(() => {
                    insert(record).then(next);
                });
            }
        }
    });

    writableStream.on('finish', () => {
        // insert remainder of the batch that did not fit into the batchSize
        insertToMongo(batch).then(() => {
            console.log("ready to close..");
            conn.db.close();
        });
    });

    return writableStream;
}

module.exports = {
    streamToMongoDB
};