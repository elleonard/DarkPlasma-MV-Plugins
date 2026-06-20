import path from 'path';
import { fileURLToPath } from 'url';
import { globSync } from 'glob';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import applyTemplate from './extensions/rollup/rollup-apply-template.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const targetJsList = (() => {
  const targetFile = (() => {
    const file = process.env.TARGET;
    const dir = process.argv.some((n) => n === '-e') ? 'excludes' : 'codes';
    return file ? globSync(path.join(__dirname, 'src', dir, file, 'DarkPlasma*.js')) : null;
  })();
  return targetFile
    ? [targetFile].flat()
    : [
        globSync(path.join(__dirname, 'src', 'codes', '*', 'DarkPlasma*.js')),
        globSync(path.join(__dirname, 'src', 'excludes', '*', 'DarkPlasma*.js')),
      ].flat();
})();

const config = targetJsList.map((input) => {
  const name = path.basename(input, '.js');
  const inputDirName = path.dirname(input).replace(/\\/g, "/");
  const dir = (() => {
    if (/\/src\/codes/.test(inputDirName)) {
      return "codes";
    }
    const match = /\/src\/excludes\/(.+?)\/(.+)(\/plugin)?/.exec(inputDirName);
    console.log(inputDirName);
    console.log(match);
    if (match) {
      return match[1];
    }
    return "excludes";
  })();
  return {
    input,
    output: {
      file: `_dist/${dir}/${name}.js`,
      format: 'iife',
    },
    plugins: [
      nodeResolve(),
      commonjs(),
      applyTemplate({
        template: path.resolve(__dirname, 'src', 'templates', 'plugin.ejs'),
      }),
    ],
    external: ['fs'],
  };
});

export default config;
