const fs = require('fs');
const path = require('path');

/** Load a JSON test-data file from /data (keeps data out of the spec files). */
function loadData(file) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'data', file), 'utf8'));
}

module.exports = { loadData };
