/**
 * PWA Icon Generator
 * Generates PNG icons from SVG for PWA manifest
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputSvg = path.join(__dirname, '../public/icons/icon.svg');
const outputDir = path.join(__dirname, '../public/icons');

async function generateIcons() {
  console.log('Generating PWA icons...');

  // Zorg dat output directory bestaat
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);

    try {
      await sharp(inputSvg)
        .resize(size, size)
        .png()
        .toFile(outputPath);

      console.log(`✓ Generated: icon-${size}x${size}.png`);
    } catch (err) {
      console.error(`✗ Failed to generate ${size}x${size}:`, err.message);
    }
  }

  console.log('\nDone! Icons generated in public/icons/');
}

generateIcons().catch(console.error);
