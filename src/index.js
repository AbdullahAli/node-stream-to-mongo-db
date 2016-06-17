import Bluebird     from "bluebird";
import MongoDB      from "mongodb";
import async        from "asyncawait/async";
import await        from "asyncawait/await";
import { Writable } from "stream";

Bluebird.promisifyAll(MongoDB.MongoClient);
Bluebird.promisifyAll(MongoDB.Collection.prototype);

let config = {};
let conn   = {};
let batch  = [];

function streamToMongoDB(options) {
    setupConfig(options);
    return writableStream();
}

const connect = async (function connect() {
    return new Bluebird((resolve, reject) => {
        try {
            let db = await (MongoDB.MongoClient.connectAsync(config.dbURL));
            conn.db = db;
            conn.collection = conn.db.collection(config.collection);
            resolve();
        } catch (error) {
            reject(error);
        }
    });
});

const insertToMongo = async (function insertToMongo(records) {
    return new Bluebird((resolve, reject) => {
        try {
            if(batch.length) {
                await (conn.collection.insertAsync(records, config.insertOptions));
                resetBatch();
                resolve();
            } else {
                resolve();
            }
        } catch (error) {
            reject(error);
        }
    });
});

const addToBatch = async (function addToBatch(record) {
    return new Bluebird((resolve, reject) => {
        try {
            batch.push(record);

            if(batch.length === config.batchSize) {
                await (insertToMongo(batch));
                resolve();
            } else {
                resolve();
            }
        } catch (error) {
            reject(error);
        }
    });
});

function writableStream() {
    const writableStream = new Writable({
        objectMode: true,
        write: async (function(record, encoding, next) {
            if(conn.db) {
                await (addToBatch(record));
                next();
            } else {
                await (connect());
                await (addToBatch(record));
                next();
            }
        })
    });

    writableStream.on("finish", async (() => {
        await (insertToMongo(batch));
        conn.db.close();
        resetConn();
        writableStream.emit("close");
    }));

    return writableStream;
}

function setupConfig(options){
    config = options;
    const defaultConfiguration = defaultConfig();

    // add required options if not exists
    Object.keys(defaultConfiguration).map(configKey => {
        if(!config[configKey]) {
            config[configKey] = defaultConfiguration[configKey];
        }
    });
}

function defaultConfig() {
    return {
        batchSize : 1,
        insertOptions : { w : 1 }
    };
}

function resetConn() {
    conn = {};
}

function resetBatch() {
    batch = [];
}

module.exports = {
    streamToMongoDB
};