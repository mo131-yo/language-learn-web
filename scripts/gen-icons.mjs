import { readFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const svgPath = join(root, "public", "favicon.svg");
const outDir = join(root, "public", "icons");

const BRAND_BG = "#16a34a";

async function main() {
  await mkdir(outDir, { recursive: true });
  const svg = await readFile(svgPath);

  await sharp(svg, { density: 384 })
    .resize(192, 192)
    .png()
    .toFile(join(outDir, "icon-192.png"));

  await sharp(svg, { density: 384 })
    .resize(512, 512)
    .png()
    .toFile(join(outDir, "icon-512.png"));

  await sharp(svg, { density: 384 })
    .resize(180, 180)
    .png()
    .toFile(join(outDir, "apple-touch-icon.png"));

  const safeSize = Math.round(512 * 0.8);
  const inset = Math.round((512 - safeSize) / 2);
  const scaledIcon = await sharp(svg, { density: 384 })
    .resize(safeSize, safeSize)
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: BRAND_BG
    }
  })
    .composite([{ input: scaledIcon, left: inset, top: inset }])
    .png()
    .toFile(join(outDir, "icon-maskable-512.png"));

  console.log("Icons generated in", outDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
