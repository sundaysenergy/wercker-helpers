var https = require('https');

var options = {
  hostname: process.env.CLOUDANT_URL,
  port: 443,
  path: process.env.CLOUDANT_PATH,
  method: 'HEAD',
  auth: process.env.CLOUDANT_AUTH
};

function pushedFile(element) {
  console.log(process.env.WERCKER_GIT_COMMIT);
  var re = new RegExp("/.*" + process.env.WERCKER_GIT_COMMIT + ".*/", '');
  return element.match(re);
}

var req = https.request(options, function(res) {
  var rev = res.headers.etag;
  var path = process.env.CLOUDANT_PATH;
  if (res.statusCode != 404) {
    path = path + "?rev=" + rev.replace(/\"/g,'');
  }
  res.on('data', function(d) {
    process.stdout.write(d);
  });
  var files = require('findit2').sync(__dirname);
  var update = {};
  update.files = files.filter(pushedFile);
  for (i in update.files) {
    update.files[i] = update.files[i].replace(__dirname, '');
  }
  update.container = process.env.CLOUDFILES_CONTAINER;
  var updateoptions = {
    hostname: process.env.CLOUDANT_URL,
    port: 443,
    path: path,
    method: 'PUT',
    headers: { 
                'Content-Type':'application/json', 
                'Content-Length':JSON.stringify(update).length 
             },
    auth: process.env.CLOUDANT_AUTH
  }
  var updatereq = https.request(updateoptions, function(res) {
    res.on('data', function (chunk) {
      console.log('BODY: ' + chunk);
    });
  });
  updatereq.write(JSON.stringify(update));
  updatereq.end();
});
req.end();