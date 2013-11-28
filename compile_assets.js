var jsyaml = require('js-yaml');
var less = require('less');
var fs = require('fs');

// Make a directory based on the commit hash
fs.mkdir(process.env.WERCKER_GIT_COMMIT);

// Process the yaml file telling us about our collections.
var doc = require(process.env.WERCKER_ROOT + '/collection.yml');

// Process each key
for (var i in doc) {
  (function(current_page) {
    var parser = new(less.Parser)({
      paths: [process.env.WERCKER_ROOT]
    });
    var files = [];
    // Push each file into an array as a string
    for (j in doc[current_page].css) {
      files.push(fs.readFileSync(process.env.WERCKER_ROOT + '/' + doc[current_page].css[j]).toString());
    }
    // Parse the less and write a css file
    parser.parse(files.join(" "), function (e, tree) {
      var css = tree.toCSS({ compress: true });
      fs.writeFileSync(process.env.WERCKER_ROOT + '/' + process.env.WERCKER_GIT_COMMIT + '/' + current_page + '.css', css);
    });
  })(i);
}