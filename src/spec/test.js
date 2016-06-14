/*jshint camelcase: false */
"use strict";

import Jasmine from "jasmine";
import program from "commander";
import path    from "path";

program.version("1.0.0").
    option("-s --spec <spec>", "Spec file to run").
    parse(process.argv);

const j = new Jasmine();


if(!program.spec) {
    j.loadConfigFile("src/spec/support/jasmine.json");
} else {
    let config = require(path.resolve("src/spec/support/jasmine.json"));
    config.spec_dir = "";
    config.spec_files = [program.spec];

    j.loadConfig(config);
}

j.execute();