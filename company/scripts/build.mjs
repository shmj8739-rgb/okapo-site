import { cp, mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(root, 'dist');
await mkdir(output, { recursive: true });
for (const path of ['index.html', 'style.css', 'logo.svg', 'js', 'vendor', 'assets']) {
  await cp(resolve(root, path), resolve(output, path), { recursive: true });
}
// Catch incomplete offline dependency downloads before any deployment.
for (const path of ['vendor/three.module.min.js', 'vendor/three.core.min.js']) {
  const data = await readFile(resolve(output, path), 'utf8');
  if (data.length < 10000 || data.trimStart().startsWith('<')) throw new Error(`Invalid Three.js module: ${path}`);
}
console.log('Static build ready: dist/ (HTML, CSS, JavaScript, local Three.js)');
