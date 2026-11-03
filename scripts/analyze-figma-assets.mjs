// scripts/analyze-figma-assets.mjs
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const FIGMA_DIR = path.join(ROOT_DIR, 'public/assets/figma');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const API_DIR = path.join(ROOT_DIR, 'api');

function getAllFiles(dir, exts = null) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const dirent of list) {
    const fullPath = path.join(dir, dirent.name);
    if (dirent.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, exts));
    } else if (dirent.isFile()) {
      if (!exts || exts.some((ext) => dirent.name.endsWith(ext))) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

const sourceFiles = [
  ...getAllFiles(SRC_DIR, ['.ts', '.tsx', '.css', '.json', '.html']),
  ...getAllFiles(API_DIR, ['.ts', '.js', '.html']),
  path.join(ROOT_DIR, 'index.html'),
  path.join(ROOT_DIR, 'preview-emails.html'),
];

const sourceContents = sourceFiles.map((f) => ({
  file: path.relative(ROOT_DIR, f),
  content: fs.readFileSync(f, 'utf-8'),
}));

const figmaFiles = getAllFiles(FIGMA_DIR);
console.log(`Analyzing ${figmaFiles.length} files in public/assets/figma...`);

const results = [];

for (const file of figmaFiles) {
  const relToPublic = path.relative(path.join(ROOT_DIR, 'public'), file).replace(/\\/g, '/'); // e.g. assets/figma/foo.png
  const urlPath = '/' + relToPublic;
  const basename = path.basename(file);
  const size = fs.statSync(file).size;
  const isSvg = basename.endsWith('.svg');

  const matches = [];

  for (const src of sourceContents) {
    if (src.content.includes(urlPath) || src.content.includes(relToPublic)) {
      matches.push({ file: src.file, type: 'url' });
    } else if (
      src.content.includes(`'${basename}'`) ||
      src.content.includes(`"${basename}"`) ||
      src.content.includes(`/${basename}`)
    ) {
      matches.push({ file: src.file, type: 'basename' });
    }
  }

  results.push({
    file,
    relToPublic,
    basename,
    size,
    isSvg,
    matches,
    isReferenced: matches.length > 0,
  });
}

const referenced = results.filter((r) => r.isReferenced);
const unreferenced = results.filter((r) => !r.isReferenced);

const refSize = referenced.reduce((sum, r) => sum + r.size, 0);
const unrefSize = unreferenced.reduce((sum, r) => sum + r.size, 0);

console.log(`\n=== RESULTS ===`);
console.log(`Total files: ${results.length} (${((refSize + unrefSize) / (1024 * 1024)).toFixed(2)} MB)`);
console.log(`Referenced files: ${referenced.length} (${(refSize / (1024 * 1024)).toFixed(2)} MB)`);
console.log(`Unreferenced files: ${unreferenced.length} (${(unrefSize / (1024 * 1024)).toFixed(2)} MB)`);

console.log(`\n--- ALL REFERENCED FILES (total ${referenced.length}) ---`);
referenced.sort((a, b) => b.size - a.size).forEach((r) => {
  console.log(`${(r.size / 1024).toFixed(1)} KB - ${r.relToPublic} -> [${r.matches.map((m) => m.file).join(', ')}]`);
});
