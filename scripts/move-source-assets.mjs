// scripts/move-source-assets.mjs
// Mộc Ngôn Hương — Safe Migration of Figma Source Originals to source-assets/
// Uses `git mv` to preserve full Git history.

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT_DIR = process.cwd();
const PUBLIC_FIGMA_DIR = path.join(ROOT_DIR, 'public/assets/figma');
const SOURCE_FIGMA_DIR = path.join(ROOT_DIR, 'source-assets/figma');

// Exact list of files that MUST remain in public/assets/figma
const KEEP_IN_PUBLIC_ROOT = new Set([
  'logo-header.png',
  'reviewer-avatar.png',
  'icon-step-envelope.png',
  'icon-step-scroll.png',
  'qr-code.png',
  'an-thumb-3.png',
  'cam-thumb-3.png',
  'nho-thumb-3.png',
  'thuong-thumb-3.png',
  'icon-cart.svg',
  'icon-chat.svg',
  'icon-chevron-down.svg',
  'icon-search.svg',
  'icon-user.svg',
]);

const KEEP_IN_PUBLIC_ORIGINALS = new Set([
  '4ce5c.png',
  '3ee72.png',
]);

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

ensureDir(SOURCE_FIGMA_DIR);
ensureDir(path.join(SOURCE_FIGMA_DIR, 'originals'));

// 1. Gather all files in public/assets/figma (root)
const rootFiles = fs.readdirSync(PUBLIC_FIGMA_DIR, { withFileTypes: true })
  .filter(d => d.isFile())
  .map(d => d.name);

// 2. Gather all files in public/assets/figma/originals
const originalsDir = path.join(PUBLIC_FIGMA_DIR, 'originals');
const originalFiles = fs.existsSync(originalsDir)
  ? fs.readdirSync(originalsDir, { withFileTypes: true })
      .filter(d => d.isFile())
      .map(d => d.name)
  : [];

console.log(`Found ${rootFiles.length} files in public/assets/figma/`);
console.log(`Found ${originalFiles.length} files in public/assets/figma/originals/`);

const toMove = [];
const toKeep = [];

// Categorize root files
for (const file of rootFiles) {
  const fullPath = path.join(PUBLIC_FIGMA_DIR, file);
  const targetPath = path.join(SOURCE_FIGMA_DIR, file);
  const size = fs.statSync(fullPath).size;

  if (KEEP_IN_PUBLIC_ROOT.has(file)) {
    toKeep.push({ file: `assets/figma/${file}`, size, reason: 'Runtime required' });
  } else {
    toMove.push({
      file: `assets/figma/${file}`,
      src: fullPath,
      dest: targetPath,
      size,
    });
  }
}

// Categorize originals
for (const file of originalFiles) {
  const fullPath = path.join(originalsDir, file);
  const targetPath = path.join(SOURCE_FIGMA_DIR, 'originals', file);
  const size = fs.statSync(fullPath).size;

  // Keep all SVGs in originals (used by FigmaIcon.tsx)
  if (file.endsWith('.svg') || KEEP_IN_PUBLIC_ORIGINALS.has(file)) {
    toKeep.push({ file: `assets/figma/originals/${file}`, size, reason: file.endsWith('.svg') ? 'FigmaIcon SVG' : 'Hero overlay' });
  } else {
    toMove.push({
      file: `assets/figma/originals/${file}`,
      src: fullPath,
      dest: targetPath,
      size,
    });
  }
}

const moveSize = toMove.reduce((sum, item) => sum + item.size, 0);
const keepSize = toKeep.reduce((sum, item) => sum + item.size, 0);

console.log(`\n=== PROPOSED PLAN ===`);
console.log(`Files to keep in public: ${toKeep.length} (${(keepSize / (1024 * 1024)).toFixed(2)} MB)`);
console.log(`Files to move to source-assets: ${toMove.length} (${(moveSize / (1024 * 1024)).toFixed(2)} MB)`);

const isDryRun = process.argv.includes('--dry-run');
if (isDryRun) {
  console.log('\nDry run complete. No files were moved.');
  process.exit(0);
}

console.log('\nExecuting moves via git mv...');
let movedCount = 0;
for (const item of toMove) {
  try {
    // Try git mv first to preserve history
    const relSrc = path.relative(ROOT_DIR, item.src);
    const relDest = path.relative(ROOT_DIR, item.dest);
    execSync(`git mv "${relSrc}" "${relDest}"`, { stdio: 'pipe' });
    movedCount++;
  } catch (err) {
    // If not tracked by git, use fs.renameSync
    fs.renameSync(item.src, item.dest);
    movedCount++;
  }
}

console.log(`Successfully moved ${movedCount} files to source-assets/figma!`);
console.log(`Storage freed from public/: ${(moveSize / (1024 * 1024)).toFixed(2)} MB`);
