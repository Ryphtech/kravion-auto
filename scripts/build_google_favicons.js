const fs = require('fs');
const path = require('path');
const React = require('react');
const { ImageResponse } = require('next/dist/compiled/@vercel/og');

async function main() {
  console.log('Generating Google-compliant favicons, icons, and structured data assets...');

  // 1. Read the white logo SVG
  const logoWhiteSvg = fs.readFileSync('public/logo-white.svg', 'utf8');
  
  // Extract inner elements of logo-white.svg (defs + group/paths)
  // Strip outer <svg ...> and </svg>
  const innerSvg = logoWhiteSvg
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>[\s\S]*$/, '');

  // 2. Build 1:1 Square Vector Icon SVG
  // Original viewBox: "158 196 1250 628"
  // Target square canvas: 1024 x 1024
  // Center logo horizontally and vertically with generous padding so it fits inside Google's circular crop
  const squareSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <rect width="1024" height="1024" rx="220" fill="#0F172A"/>
  <svg x="102" y="248" width="820" height="528" viewBox="158 196 1250 628">
    ${innerSvg}
  </svg>
</svg>`;

  fs.writeFileSync('public/icon.svg', squareSvg, 'utf8');
  fs.writeFileSync('public/favicon.svg', squareSvg, 'utf8');
  console.log('✓ Created public/icon.svg and public/favicon.svg (1:1 square vector with luxury slate badge)');

  // Base64 data URI of squareSvg for ImageResponse rendering
  const base64SquareSvg = Buffer.from(squareSvg).toString('base64');
  const squareDataUri = `data:image/svg+xml;base64,${base64SquareSvg}`;

  // Helper to render PNG of specific size
  async function renderPng(size) {
    const element = React.createElement('div', {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }
    }, React.createElement('img', {
      src: squareDataUri,
      width: size,
      height: size,
      style: { objectFit: 'contain' }
    }));

    const res = new ImageResponse(element, { width: size, height: size });
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
  }

  // 3. Render required Google & Apple sizes
  const sizes = [
    { name: 'public/icon-16x16.png', size: 16 },
    { name: 'public/icon-32x32.png', size: 32 },
    { name: 'public/icon-48x48.png', size: 48 },    // Exact 1x multiple of 48 for Google
    { name: 'public/icon-96x96.png', size: 96 },    // Exact 2x multiple of 48 for Google
    { name: 'public/apple-touch-icon.png', size: 180 }, // iOS Safari
    { name: 'public/icon-192x192.png', size: 192 }, // 4x multiple of 48 & Android PWA
    { name: 'public/icon-512x512.png', size: 512 }, // High-Res PWA
    { name: 'public/logo.png', size: 512 },         // Google Schema.org AutoPartsStore logo
  ];

  const pngBuffers = {};
  for (const { name, size } of sizes) {
    const buf = await renderPng(size);
    fs.writeFileSync(name, buf);
    pngBuffers[size] = buf;
    console.log(`✓ Rendered ${name} (${size}x${size}, ${buf.length} bytes)`);
  }

  // 4. Build Multi-resolution ICO (16x16, 32x32, 48x48, 96x96)
  // All modern browsers and Googlebot support PNG-compressed entries inside .ico
  const icoSizes = [16, 32, 48, 96];
  const numImages = icoSizes.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const dirTotalSize = numImages * dirEntrySize;
  let currentOffset = headerSize + dirTotalSize;

  const dirEntries = [];
  const imageDataBuffers = [];

  for (const s of icoSizes) {
    const png = pngBuffers[s];
    const entry = Buffer.alloc(16);
    entry.writeUInt8(s === 256 ? 0 : s, 0); // width
    entry.writeUInt8(s === 256 ? 0 : s, 1); // height
    entry.writeUInt8(0, 2);                 // colors
    entry.writeUInt8(0, 3);                 // reserved
    entry.writeUInt16LE(1, 4);              // color planes
    entry.writeUInt16LE(32, 6);             // bpp
    entry.writeUInt32LE(png.length, 8);     // data size
    entry.writeUInt32LE(currentOffset, 12); // offset
    dirEntries.push(entry);
    imageDataBuffers.push(png);
    currentOffset += png.length;
  }

  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // reserved
  icoHeader.writeUInt16LE(1, 2); // type 1 (ICO)
  icoHeader.writeUInt16LE(numImages, 4); // count

  const icoBuffer = Buffer.concat([icoHeader, ...dirEntries, ...imageDataBuffers]);
  fs.writeFileSync('public/favicon.ico', icoBuffer);
  console.log(`✓ Created multi-resolution public/favicon.ico (${icoBuffer.length} bytes containing 16x16, 32x32, 48x48, 96x96)`);

  console.log('Done generating all assets!');
}

main().catch(err => {
  console.error('Error generating favicons:', err);
  process.exit(1);
});
