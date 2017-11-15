import Jasmine from 'jasmine'; // eslint-disable-line

const jas = new Jasmine();
jas.loadConfigFile('src/spec/support/jasmine.json');
jas.execute();
