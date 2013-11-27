var https = require('https');

// Options for connecting to Cloudant
var options = {
  hostname: process.env.CLOUDANT_URL,
  port: 443,
  path: process.env.CLOUDANT_PATH,
  method: 'HEAD',
  auth: process.env.CLOUDANT_AUTH
};

// Helper function for filtering by current hash
function pushedFile(element) {
  return element.indexOf(process.env.WERCKER_GIT_COMMIT) >= 0;
}

// Send a request updating Cloudant with our latest information
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
  update.css = [];
  update.js = [];
  update.other = [];
  for (i in update.files) {
    if ((update.files[i].indexOf('.js') + 3) == update.files[i].length) {
      update.js.push('http://' + process.env.CLOUDFILES_CONTAINER + update.files[i].replace(__dirname, ''));
    } else if ((update.files[i].indexOf('.css') + 4) == update.files[i].length) {
      update.css.push('http://' + process.env.CLOUDFILES_CONTAINER + update.files[i].replace(__dirname, ''));
    } else {
      update.other.push('http://' + process.env.CLOUDFILES_CONTAINER + update.files[i].replace(__dirname, ''));
    }
    update.files[i] = 'http://' + process.env.CLOUDFILES_CONTAINER + update.files[i].replace(__dirname, '')
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