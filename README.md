![Alt text](logo.png)
[![Build Status](https://travis-ci.org/AbdullahAli/stream-to-mongo-db.svg?branch=master)](https://travis-ci.org/AbdullahAli/stream-to-mongo-db) [![Code Climate](https://codeclimate.com/github/AbdullahAli/stream-to-mongo-db/badges/gpa.svg)](https://codeclimate.com/github/AbdullahAli/stream-to-mongo-db)


# Stream To Mongo DB

`stream-to-mongo-db` allows you to stream JSON directly into a MongoDB databases, using a read stream (an a S3 file, local file, a Web API or even another MongoDB database).  Here is a few examples of some of the most common use cases

## Example 1: Another MongoDB database

### Example 1.1: Using MongoDB Client
```
var MongoClient = require("mongodb").MongoClient;
var streamToMongoDB = require("stream-to-mongo-db");

// where the data will come from
var inputDBConfig = { dbURL : "mongodb://localhost:27017/stream-to-mongo-db", collection : "dev-test-input" };

// where the data will end up
var outputDBConfig = { dbURL : "mongodb://localhost:27017/stream-to-mongo-db", collection : "dev-test-output" }

MongoClient.connect(inputDBConfig.dbURL, function(error, db) => {
    if(error) { throw error; }

    // create the writable stream
    var writableStream = StreamToMongoDB(outputDBConfig);

    // stream
    db.collection(inputDBConfig.collection).find().stream().pipe(writableStream);
});

```

### Example 1.2: Using Mongoose
```
// setup mongoose
var mongoose = require("mongoose");

// where the data will come from
mongoose.connect("mongodb://localhost:27017/stream-to-mongo-db");
var MyModel  = mongoose.model('ModelName', mySchema);

// where the data will end up
var outputDBConfig = { dbURL : "mongodb://localhost:27017/stream-to-mongo-db", collection : "dev-test-output" }

// create the writable stream
var writableStream = StreamToMongoDB(outputDBConfig);

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

## Example 2: An S3 file using AWS-SDK
```
var AWS        = require("aws-sdk");
var JSONStream = require("JSONStream");

var s3         = new AWS.S3();
var params     = { Bucket: "myBucket", Key: "myJsonData.json" };

// where the data will end up
var outputDBConfig = { dbURL : "mongodb://localhost:27017/stream-to-mongo-db", collection : "dev-test-output" }

// create the writable stream
var writableStream = StreamToMongoDB(outputDBConfig);

// stream
s3.getObject(params).createReadStream().pipe(JSONStream.parse('*')).pipe(writableStream);
```

## Example 3: A Web API
```
var request    = require("request");
var JSONStream = require("JSONStream");

// where the data will end up
var outputDBConfig = { dbURL : "mongodb://localhost:27017/stream-to-mongo-db", collection : "dev-test-output" }

// create the writable stream
var writableStream = StreamToMongoDB(outputDBConfig);

// stream
request("www.pathToYourApi.com/endPoint")
    .pipe(JSONStream.parse('*'))
    .pipe(writableStream);
```

## Example 4: Local file
```
var JSONStream = require("JSONStream");

// where the data will end up
var outputDBConfig = { dbURL : "mongodb://localhost:27017/stream-to-mongo-db", collection : "dev-test-output" }

// create the writable stream
var writableStream = StreamToMongoDB(outputDBConfig);

// stream
fs.createReadStream("./myJsonData.json").pipe(JSONStream.parse('*')).pipe(writableStream);
```