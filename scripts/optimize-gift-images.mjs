// Run from the repository root. Delivery derivatives only; Figma originals are immutable.
// Sharp is QA tooling, intentionally not an application dependency.
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';

const sharp = createRequire(import.meta.url)(`${process.env.MNH_TOOLS_ROOT || '/tmp/mnh-visual-tools'}/node_modules/sharp`);
const sources = [
  { node: '96:2989', path: 'public/assets/figma/combo-slide-1.png', sha256: '0f8d70b0250a9e83660c4222961dfbba67661db6e201fc6906d350cf4e96bba8' },
  { node: '96:3129', path: 'public/assets/figma/originals/gift-96-3129.jpg', sha256: '9aa5b9432f24c2adce7417f812ee54f1830b3b1efca7ab8064054e0d182c72b5' },
  { node: '96:3091', path: 'public/assets/figma/originals/gift-96-3091.jpg', sha256: '2ca067be7f2284a35fc5e6d019af01c4cd6e9322cef3a892eba9593475b70bfd' },
  { node: '96:3111', path: 'public/assets/figma/originals/gift-96-3111.jpg', sha256: 'a1738ac4c047d3e0669af7697da849d3bf53d196bd034387b55b1fc9ee786bf7' },
];
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const originals = [];

// Validate every input before writing any output, so a mistaken asset mapping fails closed.
for (const source of sources) {
  const bytes = await fs.readFile(source.path);
  if (hash(bytes) !== source.sha256) throw new Error(`Original hash mismatch: ${source.path}`);
  originals.push(bytes);
}

await fs.mkdir('public/assets/optimized', { recursive: true });
const images = [];
for (let index = 0; index < sources.length; index++) {
  const source = sources[index], bytes = originals[index];
  const metadata = await sharp(bytes).metadata();
  const variants = [];
  for (const { kind, width, quality } of [
    { kind: 'thumb', width: 180, quality: 82 },
    { kind: 'view', width: 1920, quality: 88 },
  ]) {
    const path = `public/assets/optimized/gift-${kind}-${index + 1}.webp`;
    const output = await sharp(bytes).resize({ width, withoutEnlargement: true })
      .webp({ quality, effort: 6 }).toBuffer();
    await fs.writeFile(path, output);
    const info = await sharp(output).metadata();
    const variant = { path, bytes: output.length, width: info.width, height: info.height, quality, sha256: hash(output) };

    if (kind === 'view') {
      // Compare against the same resized original, not its larger native pixel grid.
      const reference = await sharp(bytes).resize({ width, withoutEnlargement: true }).removeAlpha().raw().toBuffer();
      const actual = await sharp(output).removeAlpha().raw().toBuffer();
      if (reference.length !== actual.length) throw new Error(`Pixel dimensions differ: ${path}`);
      let absolute = 0, squared = 0;
      for (let pixel = 0; pixel < reference.length; pixel++) {
        const difference = reference[pixel] - actual[pixel];
        absolute += Math.abs(difference);
        squared += difference * difference;
      }
      variant.maeByte = absolute / reference.length;
      variant.psnrDB = 10 * Math.log10(255 * 255 / (squared / reference.length));
    }
    variants.push(variant);
  }
  images.push({ node: source.node, source: source.path, bytes: bytes.length,
    width: metadata.width, height: metadata.height, sha256: hash(bytes), variants });
}

const totals = {
  originalBytes: images.reduce((sum, row) => sum + row.bytes, 0),
  viewBytes: images.reduce((sum, row) => sum + row.variants.find(variant => variant.width === 1920).bytes, 0),
  thumbBytes: images.reduce((sum, row) => sum + row.variants.find(variant => variant.width === 180).bytes, 0),
};
await fs.mkdir('docs/evidence/v10', { recursive: true });
await fs.writeFile('docs/evidence/v10/gift-thumbnails.json', JSON.stringify({
  method: 'Sharp resize preserving original full image aspect ratio, no crop or content edits. Original files retained unchanged.',
  images, totals,
}, null, 2));
console.log({ generated: images.length * 2, ...totals });
