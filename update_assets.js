var https = require('https');
var jsyaml = require('js-yaml');

// Read the yaml configuration file
var doc = require(process.env.WERCKER_ROOT + '/collection.yml');

// Options for connecting to Cloudant
var options = {
  hostname: process.env.CLOUDANT_URL,
  port: 443,
  path: process.env.CLOUDANT_PATH,
  method: 'HEAD',
  auth: process.env.CLOUDANT_AUTH
};

function inCollection(element) {
  return element.indexOf(process.env.WERCKER_GIT_COMMIT + '/' + element) >= 0;
}

// Send a request updating Cloudant with our latest information
var req = https.request(options, function(res) {
  var rev = res.headers.etag;
  var path = process.env.CLOUDANT_PATH;
  // Add the revision if we didn't get a 404
  if (res.statusCode != 404) {
    path = path + "?rev=" + rev.replace(/\"/g,'');
  }
  res.on('data', function(d) {
    process.stdout.write(d);
  });

  var update = {};
  update.collection = {};
  // Process each key in collection.yml
  for (var i in doc) {
    (function(collection) {
      var files = require('findit2').sync(__dirname);
      files = files.filter(inCollection(collection));

      for (j in files) {
        update.collection[key] = { 'js':'', 'css':''};
        if ((files[j].indexOf('.js') + 3) == files[j].length) {
          update.collection[key].js = 'http://' + process.env.CLOUDFILES_CONTAINER + files[j].replace(__dirname, '');
        }
        if ((files[j].indexOf('.css') + 4) == files[j].length) {
          update.collection[key].css = 'http://' + process.env.CLOUDFILES_CONTAINER + files[j].replace(__dirname, '');
        }
      }
    })(i);
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