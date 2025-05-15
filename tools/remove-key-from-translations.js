const fs   = require('fs');
const path = require('path');

/**
 * Removes a specific key from a flattened JSON object.
 * @param {Object} obj - The flattened JSON object.
 * @param {string} keyToRemove - The key to remove.
 * @returns {Object} - A new object without the specified key.
 */
function removeKey(obj, keyToRemove) {
  const {[keyToRemove]: _, ...remainingKeys} = obj;
  return remainingKeys;
}

/**
 * Processes all JSON translation files in the locales directory, removing a given key
 * from all files except the English translation.
 * @param {string} keyToRemove - The key to remove.
 */
function processTranslationFiles(keyToRemove) {
  const localesDir = path.join(__dirname, '../locales');

  fs.readdirSync(localesDir).forEach((locale) => {
    const localePath = path.join(localesDir, locale);

    if (fs.statSync(localePath).isDirectory() && locale !== 'en') {
      fs.readdirSync(localePath).forEach((file) => {
        const filePath = path.join(localePath, file);

        if (file.endsWith('.json')) {
          const content        = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          const updatedContent = removeKey(content, keyToRemove);

          fs.writeFileSync(filePath, JSON.stringify(updatedContent, null, 2), 'utf8');
          console.log(`Removed key '${keyToRemove}' from: ${filePath}`);
        }
      });
    }
  });
}

// Accept the key to remove as a command-line argument
const keyToRemove = process.argv[2];

if (!keyToRemove) {
  console.error('Please provide a key to remove as a command-line argument.');
  process.exit(1);
}

processTranslationFiles(keyToRemove);
