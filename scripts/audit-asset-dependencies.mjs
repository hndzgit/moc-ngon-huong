// scripts/audit-asset-dependencies.mjs
// Mộc Ngôn Hương — Comprehensive Asset Dependency & Usage Audit Script

import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
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

// 1. Gather all codebase text files that might reference assets
const sourceFiles = [
  ...getAllFiles(SRC_DIR, ['.ts', '.tsx', '.css', '.json', '.html']),
  ...getAllFiles(API_DIR, ['.ts', '.js', '.html']),
  path.join(ROOT_DIR, 'index.html'),
  path.join(ROOT_DIR, 'preview-emails.html'),
].filter((p) => fs.existsSync(p));

console.log(`Auditing ${sourceFiles.length} source code files for asset references...`);

// Read all source file contents
const sourceFileContents = sourceFiles.map((file) => ({
  file: path.relative(ROOT_DIR, file),
  content: fs.readFileSync(file, 'utf-8'),
}));

// 2. Gather all assets in public/
const publicAssets = getAllFiles(PUBLIC_DIR).map((file) => {
  const relPath = path.relative(PUBLIC_DIR, file); // e.g. 'assets/figma/originals/01c48.png'
  const urlPath = '/' + relPath.replace(/\\/g, '/'); // e.g. '/assets/figma/originals/01c48.png'
  const basename = path.basename(file);
  const size = fs.statSync(file).size;
  return {
    fullPath: file,
    relPath,
    urlPath,
    basename,
    size,
  };
});

console.log(`Found ${publicAssets.length} total files in public/ (${(publicAssets.reduce((acc, a) => acc + a.size, 0) / (1024 * 1024)).toFixed(2)} MB)`);

// 3. Scan references for each public asset
const assetAnalysis = publicAssets.map((asset) => {
  const directMatches = [];
  const basenameMatches = [];

  for (const src of sourceFileContents) {
    // Check exact URL path: e.g. '/assets/figma/originals/01c48.png' or 'assets/figma/originals/01c48.png'
    if (src.content.includes(asset.urlPath) || src.content.includes(asset.relPath)) {
      directMatches.push(src.file);
    } else if (
      // For FigmaIcon and figmaImage: icons match by basename '5bc29.svg', '01c48.png'
      src.content.includes(`'${asset.basename}'`) ||
      src.content.includes(`"${asset.basename}"`) ||
      src.content.includes(`/${asset.basename}`)
    ) {
      basenameMatches.push(src.file);
    }
  }

  const isReferencedDirectly = directMatches.length > 0;
  const isReferencedByBasename = basenameMatches.length > 0;
  const isUsed = isReferencedDirectly || isReferencedByBasename;

  return {
    ...asset,
    isUsed,
    directMatches,
    basenameMatches,
  };
});

const usedAssets = assetAnalysis.filter((a) => a.isUsed);
const unusedAssets = assetAnalysis.filter((a) => !a.isUsed);

console.log(`\n--- SUMMARY OF ASSET REFERENCES ---`);
console.log(`Used assets in public/: ${usedAssets.length} (${(usedAssets.reduce((acc, a) => acc + a.size, 0) / (1024 * 1024)).toFixed(2)} MB)`);
console.log(`Unused assets in public/: ${unusedAssets.length} (${(unusedAssets.reduce((acc, a) => acc + a.size, 0) / (1024 * 1024)).toFixed(2)} MB)`);

console.log(`\nTop 20 Largest Unused Assets:`);
unusedAssets
  .sort((a, b) => b.size - a.size)
  .slice(0, 20)
  .forEach((a, i) => {
    console.log(`${i + 1}. ${(a.size / (1024 * 1024)).toFixed(2)} MB - ${a.relPath}`);
  });

console.log(`\nTop 20 Largest Used Assets:`);
usedAssets
  .sort((a, b) => b.size - a.size)
  .slice(0, 20)
  .forEach((a, i) => {
    console.log(`${i + 1}. ${(a.size / (1024 * 1024)).toFixed(2)} MB - ${a.relPath} (Matches: ${[...a.directMatches, ...a.basenameMatches].join(', ')})`);
  });
