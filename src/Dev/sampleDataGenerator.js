import fs            from 'fs';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);

const generateSampleData = (count) => {
  console.log('Generation sample data...');
  return Array(count).fill({ someKey: Math.random().toString(2) });
};

const writeDataFile = async (data, outputFileLocation) => {
  try {
    await writeFile(outputFileLocation, JSON.stringify(data));
    console.log('-> DONE');
  } catch (error) {
    console.log(error);
  }
};

const insertSampleData = async (count, outputFileLocation) => {
  try {
    await writeDataFile(generateSampleData(count), outputFileLocation);
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  insertSampleData
};
