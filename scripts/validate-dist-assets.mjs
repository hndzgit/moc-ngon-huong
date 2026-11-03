// scripts/validate-dist-assets.mjs
// Mộc Ngôn Hương — Production Asset Reference & 404 Validation

import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const DIST_DIR = path.join(ROOT_DIR, 'dist');

if (!fs.existsSync(DIST_DIR)) {
  console.error('Error: dist/ does not exist. Run npm run build first.');
  process.exit(1);
}

function getAllFiles(dir, exts = null) {
  let results = [];
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

const distFiles = getAllFiles(DIST_DIR, ['.html', '.js', '.css']);
console.log(`Scanning ${distFiles.length} generated production bundles for asset references...`);

const assetPathRegex = /\/assets\/(?:figma|optimized)\/[a-zA-Z0-9_\-\.\/]+(?:\.png|\.jpg|\.jpeg|\.webp|\.avif|\.svg)/g;

const foundReferences = new Set();
for (const file of distFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  const matches = content.match(assetPathRegex) || [];
  for (const match of matches) {
    // Strip trailing quotes or slashes if any
    const clean = match.replace(/['",)]+$/, '');
    foundReferences.add(clean);
  }
}

console.log(`Found ${foundReferences.size} unique /assets/... references in production bundles.`);

let missingCount = 0;
const validAssets = [];
const missingAssets = [];

for (const ref of Array.from(foundReferences).sort()) {
  // Check if file exists in dist
  const distPath = path.join(DIST_DIR, ref.slice(1));
  if (fs.existsSync(distPath)) {
    validAssets.push({ ref, size: fs.statSync(distPath).size });
  } else {
    missingAssets.push(ref);
    missingCount++;
  }
}

console.log(`\n=== ASSET VALIDATION RESULTS ===`);
console.log(`✅ Valid existing assets in dist/: ${validAssets.length}`);
if (missingCount > 0) {
  console.error(`❌ MISSING ASSETS (${missingCount}):`);
  for (const missing of missingAssets) {
    console.error(`  - ${missing}`);
  }
  process.exit(1);
} else {
  console.log(`🎉 100% of asset references exist in dist/! ZERO missing images.`);
}
