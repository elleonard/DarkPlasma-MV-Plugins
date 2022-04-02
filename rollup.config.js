import path from 'path';
import glob from 'glob';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import applyTemplate from './extensions/rollup/rollup-apply-template';

const targetJsList = (() => {
  const targetFile = (() => {
    const file = process.env.TARGET;
    const dir = process.argv.some((n) => n === '-e') ? 'excludes' : 'codes';
    return file ? glob.sync(path.join(__dirname, 'src', dir, file, 'DarkPlasma*.js')) : null;
  })();
  return targetFile
    ? [targetFile].flat()
    : [
        glob.sync(path.join(__dirname, 'src', 'codes', '*', 'DarkPlasma*.js')),
        glob.sync(path.join(__dirname, 'src', 'excludes', '*', 'DarkPlasma*.js')),
      ].flat();
})();

const config = targetJsList.map((input) => {
  const name = path.basename(input, '.js');
  const dir = path.dirname(input).split('/').slice(-2)[0];
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
