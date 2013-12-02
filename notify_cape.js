/*** Wercker helper to notify cape that we should recompile the site ***/
var http = require('http');

var options = {
  hostname: 'v2.cape.io',
  path: '/' + process.env.CAPE_MAKEID + '/_view/_all/process.json',
  method: 'GET',
  headers: { 'User-Agent':'Cape is so good.' }
};

var req = http.request(options, function(res) {
  console.log("Notifying " + "http://v2.cape.io/" + process.env.CAPE_MAKEID + "/_view/_all/process.json" + ": " + res.statusCode);
  res.on('data', function(d) {
    process.stdout.write(d);
  });
});
req.end();