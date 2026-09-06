// Overlay only our changed files onto a fixed upstream runtime checkout.
import { cp, mkdir, readdir, readFile, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const here = path.dirname(fileURLToPath(import.meta.url));
const upstream = path.resolve(process.argv[2] || '');
if (!process.argv[2]) throw new Error('Usage: node build.mjs <fixed-upstream-directory>');
const work = path.join(upstream, '..', 'companion-build');
await mkdir(work, { recursive: true });
for (const name of ['src', 'public', 'package.json', 'package-lock.json', 'tsconfig.json', 'index.html'])
  await cp(path.join(upstream, name), path.join(work, name), { recursive: true });
await cp(path.join(here, 'src'), path.join(work, 'src'), { recursive: true });
await writeFile(path.join(work, 'index.html'), '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>青团 · 会回应的三维果冻伙伴</title><link rel="icon" href="data:,"></head><body><div id="app"></div><script type="module" src="/src/main.ts"></script></body></html>');
for (const args of [['ci'], ['run', 'build', '--', '--base', './']]) {
  const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', args, { cwd: work, stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) process.exit(result.status || 1);
}
const dest = path.resolve(here, '../../../docs/demos/002-jelly-baby/companion');
await mkdir(path.join(dest, 'assets'), { recursive: true });
const currentAssets = await readdir(path.join(work, 'dist', 'assets'));
for (const old of await readdir(path.join(dest, 'assets')))
  if (/\.(js|css)$/.test(old) && !currentAssets.includes(old)) await unlink(path.join(dest, 'assets', old));
await cp(path.join(work, 'dist', 'index.html'), path.join(dest, 'index.html'));
for (const file of await readdir(path.join(work, 'dist', 'assets')))
  if (/\.(js|css)$/.test(file)) await cp(path.join(work, 'dist', 'assets', file), path.join(dest, 'assets', file));
// Reuse byte-identical original models/environment assets instead of duplicating them.
const original = path.join(dest, '..', 'original', 'assets');
const shared = await readdir(original);
for (const filename of await readdir(path.join(dest, 'assets'))) {
  if (!filename.endsWith('.js')) continue;
  const file = path.join(dest, 'assets', filename);
  let content = await readFile(file, 'utf8');
  for (const asset of shared.filter(n => /\.(bin|exr|jpg|png)$/.test(n)))
    content = content.replaceAll(asset, '../../original/assets/' + asset);
  await writeFile(file, content);
}
console.log('Companion built:', dest);
