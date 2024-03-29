const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const mkdirp = require('mkdirp');
const { generateHeader } = require('./generateHeader');
const { generateParameterReader } = require('./generateParameterReader');
const { generateParameterType } = require('./generateParameterType');

async function generateFromConfig(file) {
  const config = loadConfig(file);
  const distDir = path.resolve(file, '..', '_build');
  mkdirp.sync(distDir);

  for (let key of Object.keys(config)) {
    const currentConfig = config[key];
    fs.writeFileSync(path.resolve(distDir, `${key}_header.js`), generateHeader(currentConfig));
    const parameterReader = await generateParameterReader(currentConfig);
    fs.writeFileSync(path.resolve(distDir, `${key}_parameters.js`), parameterReader);
    const parameterType = await generateParameterType(currentConfig, key.replace('DarkPlasma_', ''));
    fs.writeFileSync(path.resolve(distDir, `${key}_parameters.d.ts`), parameterType);
  }

  console.log(`build config: ${file}`);
  console.log('');
}

function loadConfig(configPath) {
  return YAML.parse(fs.readFileSync(configPath, 'UTF-8'), { merge: true });
}

module.exports = {
  generateFromConfig,
};
