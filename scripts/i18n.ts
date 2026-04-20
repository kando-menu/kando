// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: CC0-1.0

import { spawnSync } from 'node:child_process';
import { existsSync, globSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
type JsonObject = Record<string, JsonValue>;

const primaryLanguage = 'en';
const localesDir = 'locales';

const require = createRequire(import.meta.url);
const i18nextCliEntry = require.resolve('i18next-cli');
const i18nextCliPath = path.join(path.dirname(i18nextCliEntry), 'cli.js');

const args = process.argv.slice(2);
const cliArgs: string[] = [];
let baselineRef: string | undefined;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  if (arg === '--baseline') {
    baselineRef = args[++i];
    continue;
  }

  if (arg.startsWith('--baseline=')) {
    baselineRef = arg.slice('--baseline='.length);
    continue;
  }

  cliArgs.push(arg);
}

const isDryRun = cliArgs.includes('--dry-run');

const localeFiles = globSync('*/translation.json', { cwd: localesDir }).sort((a, b) =>
  a.localeCompare(b)
);

const secondaryLocaleFiles = localeFiles.filter(
  (file) => path.dirname(file) !== primaryLanguage
);

const baselineTranslations = new Map<string, JsonObject>();

for (const file of secondaryLocaleFiles) {
  baselineTranslations.set(file, readBaselineTranslations(file));
}

const extractResult = spawnSync(
  process.execPath,
  [i18nextCliPath, 'extract', '--quiet', ...cliArgs],
  {
    stdio: 'inherit',
  }
);

if (extractResult.error) {
  throw extractResult.error;
}

if (extractResult.status !== 0) {
  process.exit(extractResult.status ?? 1);
}

if (isDryRun) {
  process.exit(0);
}

let removedCount = 0;

for (const file of secondaryLocaleFiles) {
  const absolutePath = path.join(localesDir, file);
  const translations = readJsonFile(absolutePath);
  const baseline = baselineTranslations.get(file) ?? {};

  removedCount += removeNewEmptyStrings(translations, baseline);

  const content = `${JSON.stringify(translations, null, 2)}\n`;

  if (content !== readFileSync(absolutePath, 'utf8')) {
    writeFileSync(absolutePath, content);
  }
}

if (removedCount > 0) {
  console.log(`Removed ${removedCount} newly added empty translation placeholders.`);
}

function readBaselineTranslations(file: string) {
  const currentPath = path.join(localesDir, file);

  if (!baselineRef) {
    return readJsonFile(currentPath);
  }

  const result = spawnSync('git', ['show', `${baselineRef}:${currentPath}`], {
    encoding: 'utf8',
  });

  if (result.status === 0) {
    return JSON.parse(result.stdout) as JsonObject;
  }

  return existsSync(currentPath) ? readJsonFile(currentPath) : {};
}

function readJsonFile(file: string) {
  return JSON.parse(readFileSync(file, 'utf8')) as JsonObject;
}

function removeNewEmptyStrings(translations: JsonObject, baseline: JsonObject) {
  let removed = 0;

  for (const [key, value] of Object.entries(translations)) {
    const baselineHasKey = Object.hasOwn(baseline, key);
    const baselineValue = baseline[key];

    if (isJsonObject(value)) {
      removed += removeNewEmptyStrings(
        value,
        isJsonObject(baselineValue) ? baselineValue : {}
      );

      if (Object.keys(value).length === 0 && !isJsonObject(baselineValue)) {
        delete translations[key];
      }

      continue;
    }

    if (value === '' && !baselineHasKey) {
      delete translations[key];
      removed++;
    }
  }

  return removed;
}

function isJsonObject(value: JsonValue | undefined): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
