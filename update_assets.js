/*** Helper for uploading theme assets and informing resources of update ***/
var https = require('https');
var jsyaml = require('js-yaml');
var fs = require('fs');
var pkgcloud = require('pkgcloud');

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
  update.hash = process.env.WERCKER_GIT_COMMIT;
  update.domain = process.env.CLOUDFILES_CONTAINER;
  update._rev = rev.replace(/\"/g,'');
  console.log(update);
  
  // Connect to cloudfiles -- make this provider inspecific in the future.
  var cloudfiles = pkgcloud.storage.createClient({
    provider: 'rackspace',
    username: process.env.CLOUDFILES_USERNAME,
    apiKey: process.env.CLOUDFILES_APIKEY,
    region: 'ORD'
  });

  // Process each key in collection.yml
  for (var i in doc) {
    (function(key) {
      update.collection[key] = {};
      update.collection[key].js = '';
      update.collection[key].css = '';
      if (fs.existsSync(process.env.WERCKER_ROOT + '/' + process.env.WERCKER_GIT_COMMIT + '/' + key + '.js')) {
        cloudfiles.upload({
          container: process.env.CLOUDFILES_CONTAINER,
          remote: '/' + process.env.WERCKER_GIT_COMMIT + '/' + key + '.js',
          local: process.env.WERCKER_ROOT + '/' + process.env.WERCKER_GIT_COMMIT + '/' + key + '.js'
        }, function(err, result) {
          console.log(result);
        });
        update.collection[key].js = 'http://' + process.env.CLOUDFILES_CONTAINER + '/' + process.env.WERCKER_GIT_COMMIT + '/' + key + '.js';
      }
      if (fs.existsSync(process.env.WERCKER_ROOT + '/' + process.env.WERCKER_GIT_COMMIT + '/' + key + '.css')) {
        cloudfiles.upload({
          container: process.env.CLOUDFILES_CONTAINER,
          remote: '/' + process.env.WERCKER_GIT_COMMIT + '/' + key + '.css',
          local: process.env.WERCKER_ROOT + '/' + process.env.WERCKER_GIT_COMMIT + '/' + key + '.css'
        }, function(err, result) {
          console.log(result);
        });
        update.collection[key].css = 'http://' + process.env.CLOUDFILES_CONTAINER + '/' + process.env.WERCKER_GIT_COMMIT + '/' + key + '.css';
      }
    })(i);
  }

  var images = fs.readdirSync(process.env.WERCKER_ROOT + '/img/');

  for (var i=0;i<images.length;i++) {
    console.log(images[i]);
    // cloudfiles.upload({
    //   container: process.env.CLOUDFILES_CONTAINER,
    //   remote: '/' + process.env.WERCKER_GIT_COMMIT + '/' + key + '.css',
    //   local: process.env.WERCKER_ROOT + '/' + process.env.WERCKER_GIT_COMMIT + '/' + key + '.css'
    // }, function(err, result) {
    //   console.log(result);
    // });
  }

  // Tell cloudant about our new files
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