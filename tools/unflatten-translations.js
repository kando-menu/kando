const fs   = require('fs');
const path = require('path');

/**
 * Unflattens a flattened object with dot-separated keys into a nested object.
 * @param {Object} obj - The flattened object to unflatten.
 * @returns {Object} - The unflattened object.
 */
function unflattenObject(obj) {
  const result = {};

  Object.keys(obj).forEach((key) => {
    const keys    = key.split('.');
    let   current = result;

    keys.forEach((part, index) => {
      if (!current[part]) {
        current[part] = index === keys.length - 1 ? obj[key] : {};
      }
      current = current[part];
    });
  });

  return result;
}

/**
 * Processes all JSON translation files in the locales directory, unflattening their
 * structure.
 */
function processTranslationFiles() {
  const localesDir = path.join(__dirname, '../locales');

  fs.readdirSync(localesDir).forEach((locale) => {
    const localePath = path.join(localesDir, locale);

    if (fs.statSync(localePath).isDirectory()) {
      fs.readdirSync(localePath).forEach((file) => {
        const filePath = path.join(localePath, file);

        if (file.endsWith('.json')) {
          const content            = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          const unflattenedContent = unflattenObject(content);

          fs.writeFileSync(filePath, JSON.stringify(unflattenedContent, null, 2), 'utf8');
          console.log(`Unflattened: ${filePath}`);
        }
      });
    }
  });
}

processTranslationFiles();