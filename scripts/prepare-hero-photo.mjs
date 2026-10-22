// Prepares the hero photo from the original download (source and license in CREDITS.md).
//   node scripts/prepare-hero-photo.mjs <original.jpg>
// Writes two desaturated crops to src/assets/hero/ (the brand orange must stay the
// brightest colour on the page): a wide one for tablets and desktops and a tall one
// for phones, so phones only download the part of the photo they show.
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const [input] = process.argv.slice(2);
if (!input) {
  console.error('Usage: node scripts/prepare-hero-photo.mjs <original.jpg>');
  process.exit(1);
}

const outDir = fileURLToPath(new URL('../src/assets/hero/', import.meta.url));
await mkdir(outDir, { recursive: true });

const { width, height } = await sharp(input).metadata();
const look = (image) => image.modulate({ saturation: 0.55 }).jpeg({ quality: 82, mozjpeg: true });

// Wide: the whole frame.
await look(sharp(input).resize({ width: 2560 })).toFile(`${outDir}cranes-dusk-wide.jpg`);

// Tall (3:5): centred just right of the middle, on the sunset, the middle cranes and the building.
const cropWidth = Math.round((height * 3) / 5);
const left = Math.min(width - cropWidth, Math.max(0, Math.round(width * 0.54 - cropWidth / 2)));
await look(sharp(input).extract({ left, top: 0, width: cropWidth, height }).resize({ width: 960 })).toFile(
  `${outDir}cranes-dusk-tall.jpg`,
);

console.log(`Wrote cranes-dusk-wide.jpg and cranes-dusk-tall.jpg to ${outDir}`);
