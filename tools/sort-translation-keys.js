const fs   = require('fs');
const path = require('path');

/**
 * Sorts the keys of a flattened JSON object alphabetically.
 * @param {Object} obj - The flattened JSON object.
 * @returns {Object} - A new object with sorted keys.
 */
function sortKeys(obj) {
  return Object.keys(obj).sort().reduce((sortedObj, key) => {
    sortedObj[key] = obj[key];
    return sortedObj;
  }, {});
}

/**
 * Processes all JSON translation files in the locales directory, sorting their keys
 * alphabetically.
 */
function processTranslationFiles() {
  const localesDir = path.join(__dirname, '../locales');

  fs.readdirSync(localesDir).forEach((locale) => {
    const localePath = path.join(localesDir, locale);

    if (fs.statSync(localePath).isDirectory()) {
      fs.readdirSync(localePath).forEach((file) => {
        const filePath = path.join(localePath, file);

        if (file.endsWith('.json')) {
          const content       = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          const sortedContent = sortKeys(content);

          fs.writeFileSync(filePath, JSON.stringify(sortedContent, null, 2), 'utf8');
          console.log(`Sorted keys in: ${filePath}`);
        }
      });
    }
  });
}

processTranslationFiles();
