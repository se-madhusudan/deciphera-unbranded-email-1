const fs = require('fs');

function rmDir(dirPath) {
  try {
    var files = fs.readdirSync(dirPath);
  } catch (e) {
    return;
  }
  if (files.length > 0)
    for (var i = 0; i < files.length; i++) {
      var filePath = dirPath + '/' + files[i];
      if (fs.statSync(filePath).isFile()) fs.unlinkSync(filePath);
      else rmDir(filePath);
    }
  fs.rmdirSync(dirPath);
}

function minTwoDigits(n) {
  return (n < 10 ? '0' : '') + n;
}

module.exports.rmDir = rmDir;
module.exports.minTwoDigits = minTwoDigits;
