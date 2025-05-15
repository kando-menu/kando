const fs   = require('fs');
const path = require('path');

/**
 * Recursively flattens a nested object into a single-level object with dot-separated
 * keys.
 * @param {Object} obj - The object to flatten.
 * @param {string} [prefix] - The prefix for the keys (used for recursion).
 * @returns {Object} - The flattened object.
 */
function flattenObject(obj, prefix = '') {
  return Object.keys(obj).reduce((acc, key) => {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      Object.assign(acc, flattenObject(obj[key], newKey));
    } else {
      acc[newKey] = obj[key];
    }
    return acc;
  }, {});
}

/**
 * Processes all JSON translation files in the locales directory, flattening their
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
          const content          = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          const flattenedContent = flattenObject(content);

          fs.writeFileSync(filePath, JSON.stringify(flattenedContent, null, 2), 'utf8');
          console.log(`Flattened: ${filePath}`);
        }
      });
    }
  });
}

processTranslationFiles();