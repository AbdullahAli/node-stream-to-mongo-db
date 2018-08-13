![Alt text](logo.png)
[![Build Status](https://travis-ci.org/AbdullahAli/node-stream-to-mongo-db.svg?branch=master)](https://travis-ci.org/AbdullahAli/node-stream-to-mongo-db) [![Code Climate](https://codeclimate.com/github/AbdullahAli/node-stream-to-mongo-db/badges/gpa.svg)](https://codeclimate.com/github/AbdullahAli/node-stream-to-mongo-db)


# Support this package
Please support this package by ***[starring it on Github](https://github.com/AbdullahAli/stream-to-mongo-db)***


# Stream To Mongo DB

`stream-to-mongo-db` allows you to stream objects directly into a MongoDB databases, using a read stream (an a S3 file, local file, a Web API or even another MongoDB database).  The best thing about this package is it allows you to control the size of the `batch` before issuing a write to mongo - see [CONFIG](#config)

# SUPPORTED NODE VERSIONS

This package supports Node.js versions `8+`.  If you require another version to be supported, please raise an issue.

# USAGE

```javascript
npm i stream-to-mongo-db
```

# EXAMPLES
## Example 1: Stream from another MongoDB database

### Example 1.1: Using [MongoDB Client](https://docs.mongodb.com/getting-started/node/client/)

```javascript
const MongoClient     = require('mongodb').MongoClient;
const streamToMongoDB = require('stream-to-mongo-db').streamToMongoDB;

// where the data will come from
const inputDBConfig  = { dbURL : 'mongodb://localhost:27017/yourInputDBHere', collection : 'yourCollectionHere'  };
// where the data will end up
const outputDBConfig = { dbURL : 'mongodb://localhost:27017/streamToMongoDB', collection : 'devTestOutput' };

MongoClient.connect(inputDBConfig.dbURL, (error, db) => {
    if(error) { throw error; }

    // create the writable stream
    const writableStream = streamToMongoDB(outputDBConfig);

    // create readable stream and consume it
    const stream = db.collection(inputDBConfig.collection).find().stream();

    stream.pipe(writableStream);

    stream.on('end', () => {
        console.log('done!');
        db.close();
    });
});
```

### Example 1.2: Using [Mongoose](http://mongoosejs.com/)

```javascript
const streamToMongoDB = require('stream-to-mongo-db').streamToMongoDB;
const mongoose        = require('mongoose');

// where the data will come from
const connection = mongoose.connect('mongodb://localhost:27017/streamToMongoDB');
const MyModel    = mongoose.model('ModelName', mySchema);

// where the data will end up
const outputDBConfig = { dbURL : 'mongodb://localhost:27017/streamToMongoDB', collection : 'devTestOutput' };

// create the writable stream
const writableStream = streamToMongoDB(outputDBConfig);

// create readable stream and consume it
const stream = MyModel.find().lean().stream();

stream.pipe(writableStream);

stream.on('end', () => {
    console.log('done!');
    connection.close();
});
```

This example gets even more powerful when you want to transform the input data before writing it to the writableStream:

```javascript
[...]

// create the readable stream and transform the data before writing it
const stream = MyModel.find().lean().stream({
    transform: (doc) => {
        // do whatever you like to the doc
        doc.whoIsAwesome = 'StreamToMongoDBIsAwesome';
    }
});

stream.pipe(writableStream);

stream.on('end', () => {
    console.log('done!');
    connection.close();
});
```

## Example 2: Stream from an S3 file using [AWS-SDK](https://aws.amazon.com/sdk-for-node-js/)

```javascript
const streamToMongoDB = require('stream-to-mongo-db').streamToMongoDB;
const AWS             = require('aws-sdk');
const JSONStream      = require('JSONStream');

const s3              = new AWS.S3();
const params          = { Bucket: 'myBucket', Key: 'myJsonData.json' };

// where the data will end up
const outputDBConfig = { dbURL : 'mongodb://localhost:27017/streamToMongoDB', collection : 'devTestOutput' };

// create the writable stream
const writableStream = streamToMongoDB(outputDBConfig);

// create readable stream and consume it
s3.getObject(params).createReadStream()
    .pipe(JSONStream.parse('*'))
    .pipe(writableStream);
```

## Example 3: Stream from a Web API

```javascript
const streamToMongoDB = require('stream-to-mongo-db').streamToMongoDB;
const request         = require('request');
const JSONStream      = require('JSONStream');

// where the data will end up
const outputDBConfig = { dbURL : 'mongodb://localhost:27017/streamToMongoDB', collection : 'devTestOutput' };

// create the writable stream
const writableStream = streamToMongoDB(outputDBConfig);

// create readable stream and consume it
request('www.pathToYourApi.com/endPoint')
    .pipe(JSONStream.parse('*'))
    .pipe(writableStream);
```

## Example 4: Stream from a local file

```javascript
const streamToMongoDB = require('stream-to-mongo-db').streamToMongoDB;
const JSONStream      = require('JSONStream');
const fs              = require('fs');

// where the data will end up
const outputDBConfig = { dbURL: 'mongodb://localhost:27017/streamToMongoDB', collection: 'devTestOutput' };

// create the writable stream
const writableStream = streamToMongoDB(outputDBConfig);

// create readable stream and consume it
fs.createReadStream('./myJsonData.json')
    .pipe(JSONStream.parse('*'))
    .pipe(writableStream);
```

# CONFIG
- `dbURL`        

    **[ REQUIRED - String ]**

    The url to your db (including the db name)

    eg: `mongodb://localhost:27017/streamToMongoDB`

- `dbConnection`

    **[ OPTIONAL - Object ]**

    An optional connection to mongodb (By default, stream-to-mongo-db will open a new mongo connection). When provided, dbUrl will be ignored.

- `collection`    

    **[ REQUIRED - String ]**

    The collection to stream to

    eg: `myCollection`

- `batchSize`    

    **[ OPTIONAL [ default : `1` ] - Integer ]**

    The number of documents consumed from the read stream before writing to mongodb

    This option defaults to `1`, i.e: write every object individually to mongoDB as it is
    received. This default is ideal if want to ensure every object is written as soon as
    possible without the possibility of losing any objects if the MongoDB connection is
    interrupted.

    However, in most cases, this is unnecessary, since writing every object individually will
    incur an additional I/O cost.  You can change this option to, say `100`, which will batch
    these writes in 100's; allowing you to consume the stream must faster.

    eg: `100`

- `insertOptions`

    **[ OPTIONAL [ default : `{ w : 1 }` ] - Object ]**

    MongoDB insert options

    This option defaults to `{ w : 1 }`, i.e: requests acknowledgement that the write operation has propagated to the standalone mongod or the primary in a replica set

    eg: [see mongo documentation for other options](https://docs.mongodb.com/manual/reference/write-concern/)

# CONTRIBUTION
Please feel free to fork, pull request, discuss, share your ideas and raise issues.  Any feedback is welcome!

# ACKNOWLEDGEMENTS
Insipred by [stream-to-mongo](https://www.npmjs.com/package/stream-to-mongo)

# LICENSE
[MIT](LICENSE)
