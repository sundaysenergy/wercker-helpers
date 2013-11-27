var jsyaml = require('js-yaml');
var less = require('less');
var fs = require('fs');

fs.mkdir(process.env.WERCKER_GIT_COMMIT);
var doc = require(process.env.WERCKER_ROOT + '/collection.yml');
var defaultcss = [];
for (k in doc.default.css) {
  defaultcss.push(fs.readFileSync(process.env.WERCKER_ROOT + '/' + doc.default.css[k]).toString());
}
for (i in doc.pages) {
  var parser = new(less.Parser)({
    paths: [process.env.WERCKER_ROOT]
  });
  var files = [];
  for (j in doc.pages[i].css) {
    files.push(fs.readFileSync(process.env.WERCKER_ROOT + '/' + doc.pages[i].css[j]).toString());
  }
  parser.parse(defaultcss.join(" ") + files.join(" "), function (e, tree) {
    var css = tree.toCSS({ compress: true });
    fs.writeFile(process.env.WERCKER_ROOT + '/' + process.env.WERCKER_GIT_COMMIT + '/' + i + '.css', css, function (err) {
      if (err) throw err;
    });
  });
}