import md5 from "md5";
import _   from "lodash";

function generateData() {
    let data = [];

    _.times(819, () => data.push({ secret : md5(_.random(0, 819)), total : _.random(0, 819) }));

    return data;
}

console.log(JSON.stringify(generateData()));