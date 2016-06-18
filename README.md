![Alt text](logo.png)
[![Build Status](https://travis-ci.org/AbdullahAli/stream-to-mongo-db.svg?branch=master)](https://travis-ci.org/AbdullahAli/stream-to-mongo-db) [![Code Climate](https://codeclimate.com/github/AbdullahAli/stream-to-mongo-db/badges/gpa.svg)](https://codeclimate.com/github/AbdullahAli/stream-to-mongo-db)


# Stream To Mongo DB

`stream-to-mongo-db` allows you to stream JSON directly into a MongoDB databases, using a read stream (an a S3 file, local file, a Web API or even another MongoDB database).  The best thing about this package is it allows you to control the size of the `batch` before issuing a write to mongo - see [CONFIG](#config)

# USAGE
```
npm i stream-to-mongo-db
```

# EXAMPLES
## Example 1: Stream from another MongoDB database

### Example 1.1: Using [MongoDB Client](https://docs.mongodb.com/getting-started/node/client/)
```
var MongoClient     = require("mongodb").MongoClient;
var streamToMongoDB = require("stream-to-mongo-db").streamToMongoDB;

// where the data will come from
var inputDBConfig  = { dbURL : "mongodb://localhost:27017/stream-to-mongo-db", collection : "dev-test-input"  };
// where the data will end up
var outputDBConfig = { dbURL : "mongodb://localhost:27017/stream-to-mongo-db", collection : "dev-test-output" };

MongoClient.connect(inputDBConfig.dbURL, function(error, db) => {
    if(error) { throw error; }

    // create the writable stream
    var writableStream = streamToMongoDB(outputDBConfig);

    // stream
    db.collection(inputDBConfig.collection).find().stream().pipe(writableStream);
});

```

### Example 1.2: Using [Mongoose](http://mongoosejs.com/)
```
var streamToMongoDB = require("stream-to-mongo-db").streamToMongoDB;
var mongoose        = require("mongoose");

// where the data will come from
mongoose.connect("mongodb://localhost:27017/stream-to-mongo-db");
var MyModel  = mongoose.model('ModelName', mySchema);

// where the data will end up
var outputDBConfig = { dbURL : "mongodb://localhost:27017/stream-to-mongo-db", collection : "dev-test-output" };

// create the writable stream
var writableStream = streamToMongoDB(outputDBConfig);

// stream
MyModel.find().lean().stream().pipe(writableStream);
```

This example gets even more powerful when you want to transform the input data before writing it to the writableStream:

```
[...]

// create the readable stream and transform the data before writing it
MyModel.find().lean().stream({
    transform : function(doc) {
        // do whatever you like to the doc
        doc.whoIsAwesome = "StreamToMongoDBIsAwesome";
    }
}).pipe(writableStream);
```

## Example 2: Stream from an S3 file using [AWS-SDK](https://aws.amazon.com/sdk-for-node-js/)
```
var streamToMongoDB = require("stream-to-mongo-db").streamToMongoDB;
var AWS             = require("aws-sdk");
var JSONStream      = require("JSONStream");

var s3              = new AWS.S3();
var params          = { Bucket: "myBucket", Key: "myJsonData.json" };

// where the data will end up
var outputDBConfig = { dbURL : "mongodb://localhost:27017/stream-to-mongo-db", collection : "dev-test-output" };

// create the writable stream
var writableStream = streamToMongoDB(outputDBConfig);

// stream
s3.getObject(params).createReadStream().pipe(JSONStream.parse('*')).pipe(writableStream);
```

## Example 3: Stream from a Web API
```
var streamToMongoDB = require("stream-to-mongo-db").streamToMongoDB;
var request         = require("request");
var JSONStream      = require("JSONStream");

// where the data will end up
var outputDBConfig = { dbURL : "mongodb://localhost:27017/stream-to-mongo-db", collection : "dev-test-output" };

// create the writable stream
var writableStream = streamToMongoDB(outputDBConfig);

// stream
request("www.pathToYourApi.com/endPoint")
    .pipe(JSONStream.parse('*'))
    .pipe(writableStream);
```

## Example 4: Stream from a local file
```
var streamToMongoDB = require("stream-to-mongo-db").streamToMongoDB;
var JSONStream      = require("JSONStream");
var fs              = require("fs");

// where the data will end up
var outputDBConfig = { dbURL : "mongodb://localhost:27017/stream-to-mongo-db", collection : "dev-test-output" };

// create the writable stream
var writableStream = streamToMongoDB(outputDBConfig);

// stream
fs.createReadStream("./myJsonData.json").pipe(JSONStream.parse('*')).pipe(writableStream);
```

# CONFIG
- `dbURL`        

    **[ REQUIRED - String ]**

    the url to your db (including the db name)

    eg: `mongodb://localhost:27017/stream-to-mongo-db`

- `collection`    

    **[ REQUIRED - String ]**

    the collection to stream to

    eg: `my-collection`

- `batchSize`    

    **[ OPTIONAL [ default : `1` ] - Integer ]**

    the number of documents consumed from the read stream before writing to mongodb

    this option defaults to `1`, i.e: stream to mongo as you consume the read stream

    eg: `100`

- `insertOptions`

    **[ OPTIONAL [ default : `{ w : 1 }` ] - Object ]**

    mongodb insert options

    this option defaults to `{ w : 1 }`, i.e: requests acknowledgement that the write operation has propagated to the standalone mongod or the primary in a replica set

    eg: [see mongo documentation for other options](https://docs.mongodb.com/manual/reference/write-concern/)

# CONTRIBUTION
Please feel free to fork, pull request, discuss, share your ideas and raise issues.  Any feedback is welcome!

# ACKNOWLEDGEMENTS
Insipred by [stream-to-mongo](https://www.npmjs.com/package/stream-to-mongo)

# LICENSE
[MIT](LICENSE)
