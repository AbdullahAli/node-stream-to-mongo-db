/*jshint camelcase: false */
import Jasmine from "jasmine";

let jas = new Jasmine();
jas.loadConfigFile("src/spec/support/jasmine.json");
jas.execute();