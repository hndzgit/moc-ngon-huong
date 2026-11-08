// scripts/generate-all-optimized-assets.mjs
// Mộc Ngôn Hương — Production Image Performance Optimization Pipeline (V16.1)
// Generates high-quality WebP & AVIF derivatives from original Figma assets without mutating originals.

import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sharp = require(process.env.MNH_TOOLS_ROOT || '/tmp/mnh-visual-tools/node_modules/sharp');

const OPTIMIZED_DIR = path.resolve('public/assets/optimized');
const EVIDENCE_DIR = path.resolve('docs/evidence/v16-1');

await fs.mkdir(OPTIMIZED_DIR, { recursive: true });
await fs.mkdir(EVIDENCE_DIR, { recursive: true });

function getHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

const TASKS = [
  // 1. Story Page Images
  {
    input: 'public/assets/figma/story-hero.png',
    outputs: [
      { file: 'story-hero-768.webp', width: 768, quality: 88 },
      { file: 'story-hero-1280.webp', width: 1280, quality: 88 },
      { file: 'story-hero-1920.webp', width: 1920, quality: 88 },
      { file: 'story-hero-768.avif', width: 768, quality: 82, format: 'avif' },
      { file: 'story-hero-1280.avif', width: 1280, quality: 82, format: 'avif' },
      { file: 'story-hero-1920.avif', width: 1920, quality: 82, format: 'avif' },
    ],
  },
  {
    input: 'public/assets/figma/originals/90128.png',
    outputs: [
      { file: 'story-hero-shade.webp', width: 1920, lossless: true },
    ],
  },
  {
    input: 'public/assets/figma/story-1.png',
    outputs: [
      { file: 'story-1-768.webp', width: 768, quality: 88 },
      { file: 'story-1-1280.webp', width: 1280, quality: 88 },
      { file: 'story-1-1920.webp', width: 1920, quality: 88 },
      { file: 'story-1-768.avif', width: 768, quality: 82, format: 'avif' },
      { file: 'story-1-1280.avif', width: 1280, quality: 82, format: 'avif' },
      { file: 'story-1-1920.avif', width: 1920, quality: 82, format: 'avif' },
    ],
  },
  {
    input: 'public/assets/figma/story-2.png',
    outputs: [
      { file: 'story-2-768.webp', width: 768, quality: 88 },
      { file: 'story-2-1280.webp', width: 1280, quality: 88 },
      { file: 'story-2-1920.webp', width: 1920, quality: 88 },
      { file: 'story-2-768.avif', width: 768, quality: 82, format: 'avif' },
      { file: 'story-2-1280.avif', width: 1280, quality: 82, format: 'avif' },
      { file: 'story-2-1920.avif', width: 1920, quality: 82, format: 'avif' },
    ],
  },

  // 2. Cart, Checkout & Order Receipt Thumbnails (FIGMA_ORDER_MEDIA)
  {
    input: 'public/assets/figma/originals/ae4e7.png',
    outputs: [
      { file: 'order-thumb-buoi-an.webp', width: 480, quality: 88 },
    ],
  },
  {
    input: 'public/assets/figma/originals/01c48.png',
    outputs: [
      { file: 'order-thumb-hop-qua-tam-y.webp', width: 480, quality: 88 },
    ],
  },
  {
    input: 'public/assets/figma/originals/2cf37.png',
    outputs: [
      { file: 'order-thumb-nhai-thuong.webp', width: 480, quality: 88 },
    ],
  },
  {
    input: 'public/assets/figma/originals/2f1ed.png',
    outputs: [
      { file: 'order-thumb-soi-cam.webp', width: 480, quality: 88 },
    ],
  },
  {
    input: 'public/assets/figma/originals/24130.png',
    outputs: [
      { file: 'order-thumb-com-nho.webp', width: 480, quality: 88 },
    ],
  },

  // 3. Product Listing Cards (FIGMA_LISTING_MEDIA & ProductCard)
  {
    input: 'public/assets/figma/an-outdoor.png',
    outputs: [
      { file: 'card-buoi-an-800.webp', width: 800, quality: 88 },
    ],
  },
  {
    input: 'public/assets/figma/thuong-outdoor.png',
    outputs: [
      { file: 'card-nhai-thuong-800.webp', width: 800, quality: 88 },
    ],
  },
  {
    input: 'public/assets/figma/cam-tray.png',
    outputs: [
      { file: 'card-soi-cam-800.webp', width: 1280, quality: 90 },
    ],
  },
  {
    input: 'public/assets/figma/nho-outdoor.jpg',
    outputs: [
      { file: 'card-com-nho-800.webp', width: 800, quality: 88 },
    ],
  },
  {
    input: 'public/assets/figma/combo-table.png',
    outputs: [
      { file: 'card-hop-qua-tam-y-800.webp', width: 800, quality: 88 },
    ],
  },

  // 4. Product Detail Galleries (ProductDetailPage & src/data/products.ts)
  // Buoi - An
  {
    input: 'public/assets/figma/originals/55312.png',
    outputs: [
      { file: 'detail-buoi-an-1.webp', width: 1280, quality: 88 },
      { file: 'detail-buoi-an-1-thumb.webp', width: 320, quality: 86 },
    ],
  },
  {
    input: 'public/assets/figma/an-tray.png',
    outputs: [
      { file: 'detail-buoi-an-2.webp', width: 1280, quality: 88 },
      { file: 'detail-buoi-an-2-thumb.webp', width: 320, quality: 86 },
    ],
  },
  {
    input: 'public/assets/figma/an-thumb-4.png',
    outputs: [
      { file: 'detail-buoi-an-4.webp', width: 800, quality: 88 },
      { file: 'detail-buoi-an-4-thumb.webp', width: 320, quality: 86 },
    ],
  },
  {
    input: 'public/assets/figma/originals/14960.png',
    outputs: [
      { file: 'detail-buoi-an-story.webp', width: 1280, quality: 88 },
    ],
  },

  // Nhai - Thuong
  {
    input: 'public/assets/figma/originals/2cf37.png',
    outputs: [
      { file: 'detail-nhai-thuong-1.webp', width: 1280, quality: 88 },
      { file: 'detail-nhai-thuong-1-thumb.webp', width: 320, quality: 86 },
      { file: 'detail-nhai-thuong-story.webp', width: 1280, quality: 88 },
    ],
  },
  {
    input: 'public/assets/figma/thuong-tray.png',
    outputs: [
      { file: 'detail-nhai-thuong-2.webp', width: 1280, quality: 88 },
      { file: 'detail-nhai-thuong-2-thumb.webp', width: 320, quality: 86 },
    ],
  },
  {
    input: 'public/assets/figma/thuong-thumb-4.png',
    outputs: [
      { file: 'detail-nhai-thuong-4.webp', width: 800, quality: 88 },
      { file: 'detail-nhai-thuong-4-thumb.webp', width: 320, quality: 86 },
    ],
  },

  // Soi - Cam
  {
    input: 'public/assets/figma/originals/2f1ed.png',
    outputs: [
      { file: 'detail-soi-cam-1.webp', width: 1280, quality: 88 },
      { file: 'detail-soi-cam-1-thumb.webp', width: 320, quality: 86 },
    ],
  },
  {
    input: 'public/assets/figma/cam-tray.png',
    outputs: [
      { file: 'detail-soi-cam-2.webp', width: 1280, quality: 88 },
      { file: 'detail-soi-cam-2-thumb.webp', width: 320, quality: 86 },
    ],
  },
  {
    input: 'public/assets/figma/cam-thumb-4.png',
    outputs: [
      { file: 'detail-soi-cam-4.webp', width: 800, quality: 88 },
      { file: 'detail-soi-cam-4-thumb.webp', width: 320, quality: 86 },
    ],
  },
  {
    input: 'public/assets/figma/originals/c6f60.png',
    outputs: [
      { file: 'detail-soi-cam-story.webp', width: 1280, quality: 88 },
    ],
  },

  // Com - Nho
  {
    input: 'public/assets/figma/originals/24130.png',
    outputs: [
      { file: 'detail-com-nho-1.webp', width: 1280, quality: 88 },
      { file: 'detail-com-nho-1-thumb.webp', width: 320, quality: 86 },
    ],
  },
  {
    input: 'public/assets/figma/nho-tray.png',
    outputs: [
      { file: 'detail-com-nho-2.webp', width: 1280, quality: 88 },
      { file: 'detail-com-nho-2-thumb.webp', width: 320, quality: 86 },
    ],
  },
  {
    input: 'public/assets/figma/nho-thumb-4.png',
    outputs: [
      { file: 'detail-com-nho-4.webp', width: 800, quality: 88 },
      { file: 'detail-com-nho-4-thumb.webp', width: 320, quality: 86 },
    ],
  },
  {
    input: 'public/assets/figma/originals/3735e.png',
    outputs: [
      { file: 'detail-com-nho-story.webp', width: 1280, quality: 88 },
    ],
  },

  // Hop Qua Tam Y
  {
    input: 'public/assets/figma/originals/7b167.png',
    outputs: [
      { file: 'detail-hop-qua-tam-y-1.webp', width: 1280, quality: 88 },
      { file: 'detail-hop-qua-tam-y-1-thumb.webp', width: 320, quality: 86 },
    ],
  },
  {
    input: 'public/assets/figma/combo-open-box.png',
    outputs: [
      { file: 'detail-hop-qua-tam-y-2.webp', width: 1280, quality: 88 },
      { file: 'detail-hop-qua-tam-y-2-thumb.webp', width: 320, quality: 86 },
    ],
  },
  {
    input: 'public/assets/figma/combo-outdoor-tea.png',
    outputs: [
      { file: 'detail-hop-qua-tam-y-3.webp', width: 1280, quality: 88 },
      { file: 'detail-hop-qua-tam-y-3-thumb.webp', width: 320, quality: 86 },
    ],
  },
  {
    input: 'public/assets/figma/combo-pouring.jpg',
    outputs: [
      { file: 'detail-hop-qua-tam-y-4.webp', width: 1280, quality: 88 },
      { file: 'detail-hop-qua-tam-y-4-thumb.webp', width: 320, quality: 86 },
    ],
  },
  {
    input: 'public/assets/figma/originals/7dc9e.png',
    outputs: [
      { file: 'detail-hop-qua-tam-y-story.webp', width: 1280, quality: 88 },
    ],
  },

  // Shared Detail Gallery Images (Figma 103:5875 and 103:6447)
  {
    input: 'public/assets/figma/originals/b5d74.png',
    outputs: [
      { file: 'detail-gallery-b5d74-1280.webp', width: 1280, quality: 88 },
      { file: 'detail-gallery-b5d74-thumb.webp', width: 480, quality: 86 },
    ],
  },
  {
    input: 'public/assets/figma/originals/191e7.png',
    outputs: [
      { file: 'detail-gallery-191e7-1280.webp', width: 1280, quality: 88 },
      { file: 'detail-gallery-191e7-thumb.webp', width: 480, quality: 86 },
    ],
  },

  // 5. Botanical, Artwork & Decorative Images
  {
    input: 'public/assets/figma/illus-hoasen.png',
    outputs: [
      { file: 'illus-hoasen.webp', width: 480, quality: 90 },
    ],
  },
  {
    input: 'public/assets/figma/an-hand.png',
    outputs: [
      { file: 'an-hand-800.webp', width: 800, quality: 88 },
    ],
  },
  {
    input: 'public/assets/figma/illus-lache-green.png',
    outputs: [
      { file: 'illus-lache-green.webp', width: 800, quality: 88 },
    ],
  },
  {
    input: 'public/assets/figma/illus-nui.png',
    outputs: [
      { file: 'illus-nui.webp', width: 800, quality: 88 },
    ],
  },
  {
    input: 'public/assets/figma/icons-gold-3.png',
    outputs: [
      { file: 'icons-gold-3.webp', width: 400, lossless: true },
    ],
  },
  {
    input: 'public/assets/figma/icons-steps-scroll-envelope.png',
    outputs: [
      { file: 'icons-steps-scroll-envelope.webp', width: 400, lossless: true },
    ],
  },
  {
    input: 'public/assets/figma/illus-hoabuoi.png',
    outputs: [
      { file: 'illus-hoabuoi.webp', width: 512, quality: 90 },
    ],
  },
  {
    input: 'public/assets/figma/illus-hoanhai.png',
    outputs: [
      { file: 'illus-hoanhai.webp', width: 512, quality: 90 },
    ],
  },
  {
    input: 'public/assets/figma/illus-hoasoi.png',
    outputs: [
      { file: 'illus-hoasoi.webp', width: 512, quality: 90 },
    ],
  },
  {
    input: 'public/assets/figma/illus-com.png',
    outputs: [
      { file: 'illus-com.webp', width: 512, quality: 90 },
    ],
  },
  {
    input: 'public/assets/figma/paper-texture.png',
    outputs: [
      { file: 'paper-texture.webp', width: 800, quality: 85 },
    ],
  },

  // 6. Auth Page Images
  {
    input: 'public/assets/figma/originals/c1a60.png',
    outputs: [
      { file: 'auth-tea-banner.webp', width: 1280, quality: 88 },
    ],
  },
  {
    input: 'public/assets/figma/originals/496fe.png',
    outputs: [
      { file: 'auth-order-an.webp', width: 320, quality: 88 },
      { file: 'auth-split-an.webp', width: 1280, quality: 88 },
    ],
  },
  {
    input: 'public/assets/figma/originals/e31ba.png',
    outputs: [
      { file: 'auth-order-thuong.webp', width: 320, quality: 88 },
      { file: 'auth-split-thuong.webp', width: 1280, quality: 88 },
    ],
  },
  {
    input: 'public/assets/figma/originals/7a0f7.png',
    outputs: [
      { file: 'auth-order-default.webp', width: 320, quality: 88 },
      { file: 'auth-split-default.webp', width: 1280, quality: 88 },
    ],
  },

  // 7. Craftmanship Section Images (in src/assets/)
  {
    input: 'src/assets/elem_16.png',
    outDir: 'src/assets',
    outputs: [
      { file: 'elem_16.webp', width: 800, quality: 88 },
    ],
  },
  {
    input: 'src/assets/elem_18.png',
    outDir: 'src/assets',
    outputs: [
      { file: 'elem_18.webp', width: 800, quality: 88 },
    ],
  },
  {
    input: 'src/assets/elem_14.png',
    outDir: 'src/assets',
    outputs: [
      { file: 'elem_14.webp', width: 800, quality: 88 },
    ],
  },
];

console.log(`Starting image optimization pipeline: ${TASKS.length} tasks...`);

const report = [];
let totalOriginalBytes = 0;
let totalOptimizedBytes = 0;

for (const task of TASKS) {
  let sourcePath = path.resolve(task.input);
  if (!fsSync.existsSync(sourcePath)) {
    const fallback = path.resolve(task.input.replace('public/assets/figma', 'source-assets/figma'));
    if (fsSync.existsSync(fallback)) {
      sourcePath = fallback;
    }
  }
  const sourceBuffer = await fs.readFile(sourcePath);
  const sourceStat = await fs.stat(sourcePath);
  const sourceMeta = await sharp(sourceBuffer).metadata();
  totalOriginalBytes += sourceStat.size;

  const targetDir = task.outDir ? path.resolve(task.outDir) : OPTIMIZED_DIR;

  for (const out of task.outputs) {
    const destPath = path.join(targetDir, out.file);
    let pipeline = sharp(sourceBuffer).resize({
      width: out.width,
      withoutEnlargement: true,
    });

    if (out.format === 'avif') {
      pipeline = pipeline.avif({ quality: out.quality || 80, effort: 5 });
    } else {
      if (out.lossless) {
        pipeline = pipeline.webp({ lossless: true, effort: 5 });
      } else {
        pipeline = pipeline.webp({ quality: out.quality || 88, effort: 5 });
      }
    }

    await pipeline.toFile(destPath);
    const destStat = await fs.stat(destPath);
    const destBuffer = await fs.readFile(destPath);
    const destMeta = await sharp(destBuffer).metadata();
    totalOptimizedBytes += destStat.size;

    const savingsPct = ((1 - destStat.size / sourceStat.size) * 100).toFixed(1);

    report.push({
      originalFile: task.input,
      originalDimensions: `${sourceMeta.width}x${sourceMeta.height}`,
      originalBytes: sourceStat.size,
      optimizedFile: path.relative(process.cwd(), destPath),
      optimizedDimensions: `${destMeta.width}x${destMeta.height}`,
      optimizedBytes: destStat.size,
      format: destMeta.format,
      savingsPct: `${savingsPct}%`,
    });

    console.log(`✓ ${out.file}: ${(sourceStat.size / 1024 / 1024).toFixed(2)}MB -> ${(destStat.size / 1024).toFixed(1)}KB (${savingsPct}% saved)`);
  }
}

const summary = {
  taskCount: TASKS.length,
  derivativesCount: report.length,
  totalOriginalMB: (totalOriginalBytes / 1024 / 1024).toFixed(2),
  totalOptimizedMB: (totalOptimizedBytes / 1024 / 1024).toFixed(2),
  overallSavingsPct: (((totalOriginalBytes - totalOptimizedBytes) / totalOriginalBytes) * 100).toFixed(2) + '%',
  generatedAt: new Date().toISOString(),
};

await fs.writeFile(
  path.join(EVIDENCE_DIR, 'image-optimization-audit.json'),
  JSON.stringify({ summary, report }, null, 2),
  'utf8'
);

console.log('\n======================================================');
console.log('OPTIMIZATION PIPELINE COMPLETE!');
console.log(`Original total size: ${summary.totalOriginalMB} MB`);
console.log(`Optimized total size: ${summary.totalOptimizedMB} MB`);
console.log(`Overall byte savings: ${summary.overallSavingsPct}`);
console.log(`Audit saved to: docs/evidence/v16-1/image-optimization-audit.json`);
console.log('======================================================');
