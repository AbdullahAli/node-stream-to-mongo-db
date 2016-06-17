import md5      from "md5";
import _        from "lodash";
import fs       from "fs";
import async    from "asyncawait/async";
import await    from "asyncawait/await";
import Bluebird from "bluebird";

const writeFileAsync = Bluebird.promisifyAll(fs.writeFile);

function generateData(count) {
    process.stdout.write("generating sample data ");
    let data = [];
    _.times(count, () => data.push({ secret : md5(_.random(0, 10)), total : _.random(0, 10) }));
    return data;
}

function writeDataFile(data, outputFileLocation) {
    return new Bluebird((resolve, reject) => {
        try {
            await (writeFileAsync(outputFileLocation, JSON.stringify(data)));
            console.log("-> DONE");
            resolve();
        } catch (error) {
            reject(error);
        }
    });
}

const insertSampleData = async (function insertSampleData(count, outputFileLocation) {
    const data = generateData(count);
    await (writeDataFile(data, outputFileLocation));
});

module.exports = {
    insertSampleData
};