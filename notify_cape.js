/*** Wercker helper to notify cape that we should recompile the site ***/
var http = require('http');

http.get("http://v2.cape.io/" + process.env.CAPE_MAKEID + "/_view/*/process.json", function(res) {
  console.log("Got response: " + res.statusCode);
}).on('error', function(e) {
  console.log("Got error: " + e.message);
});