require('js-yaml');

try {
  var doc = require(process.env.WERCKER_ROOT + '/collection.yml');
  console.log(doc);
} catch (e) {
  console.log(e);
}