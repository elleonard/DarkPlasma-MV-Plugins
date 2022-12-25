await $`git fetch origin release`;

/**
 * releaseブランチの最新コミットのコメントから、最後にビルドされたmasterのコミットIDを取得する
 */
const lastBuildCommit = await $`git log --first-parent origin/release --pretty=oneline -n 1`;

/**
 * 差分検出
 */
const diffFiles = await $`git --no-pager diff ${lastBuildCommit.stdout.trim().split(" ")[1]} HEAD --name-only`;

/**
 * ひとまず、インクリメンタルビルドはcodesのみ対象とする
 */
const codePath = path.resolve(__dirname, '..', '..', 'src', 'codes').replaceAll('\\', '/');
const buildTargets = [...new Set(diffFiles.stdout.split('\n')
  .filter(path => path.startsWith("src/codes"))
  .map(path => /^src\/codes\/(.+)\/.*/.exec(path)[1]))];

for (let target of buildTargets) {
  const targetPath = `${codePath}/${target}`;
  if (fs.existsSync(`${targetPath}/DarkPlasma_${target}.ts`)) {
    fs.copyFileSync('./tsconfig_template.json', `${targetPath}/tsconfig.json`);
    await $([`yarn tsc -b`, ` ${targetPath}`], '');
    await $([`yarn prettier`, ` ${targetPath}/DarkPlasma_${target}.js`], '');
  }
  await $`yarn rollup -c  --environment TARGET:${target} ${argv.exclude ? "-e" : ""}`;
  await $`yarn build:format`;
  await $`yarn build:copy`;
};
