const fs = require('fs');
const path = require('path');
const sharp = require('/home/barath/Codes/web-monorepo/apps/shuchu/node_modules/sharp');

const outDir = path.resolve(__dirname, '../public');

// SVG Generator
// isMaskable = true scales content down to fit inside the inner 65% safe circle for Android Adaptive Icons
function createSvg({ isMaskable = false, rounded = false } = {}) {
  const scale = isMaskable ? 0.65 : 0.82;
  const rx = rounded ? 110 : 0; // standard rounded rect if requested, but 0 for full bleed

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient (Deep Velvet) -->
    <radialGradient id="bgGlow" cx="50%" cy="38%" r="62%">
      <stop offset="0%" stop-color="#26204E" />
      <stop offset="45%" stop-color="#14112E" />
      <stop offset="100%" stop-color="#090814" />
    </radialGradient>

    <!-- Vibrant Athletic Pulse Gradient (Emerald -> Mint -> Lavender -> Peach) -->
    <linearGradient id="pulseGrad" x1="0%" y1="30%" x2="100%" y2="70%">
      <stop offset="0%" stop-color="#00F5A0" />
      <stop offset="38%" stop-color="#A8E6CF" />
      <stop offset="70%" stop-color="#C8B6FF" />
      <stop offset="100%" stop-color="#FBD8B3" />
    </linearGradient>

    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#C8B6FF" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#00F5A0" stop-opacity="0.05" />
    </linearGradient>

    <!-- Subtle Plate Ring Border -->
    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.14" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.03" />
    </linearGradient>

    <!-- Glow Filter -->
    <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="14" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Full Background -->
  <rect width="512" height="512" rx="${rx}" fill="url(#bgGlow)" />

  ${rounded ? `<rect width="510" height="510" x="1" y="1" rx="${rx}" fill="none" stroke="url(#borderGrad)" stroke-width="2" />` : ''}

  <!-- Concentric barbell plate aesthetic concentric rings -->
  <circle cx="256" cy="256" r="${isMaskable ? 140 : 185}" fill="none" stroke="url(#ringGrad)" stroke-width="2" opacity="0.45" />
  <circle cx="256" cy="256" r="${isMaskable ? 105 : 142}" fill="none" stroke="url(#ringGrad)" stroke-width="1.5" stroke-dasharray="6 8" opacity="0.3" />

  <!-- Main Pulse EKG & Barbell Silhouette -->
  <g transform="translate(256 256) scale(${scale}) translate(-256 -256)">
    <!-- Ambient Neon Blur Layer -->
    <path
      d="M 68 256 L 142 256 L 186 160 L 244 356 L 290 200 L 324 286 L 358 256 L 444 256"
      fill="none"
      stroke="url(#pulseGrad)"
      stroke-width="28"
      stroke-linecap="round"
      stroke-linejoin="round"
      filter="url(#neonGlow)"
      opacity="0.85"
    />

    <!-- Sharp Vivid Primary Pulse Line -->
    <path
      d="M 68 256 L 142 256 L 186 160 L 244 356 L 290 200 L 324 286 L 358 256 L 444 256"
      fill="none"
      stroke="url(#pulseGrad)"
      stroke-width="22"
      stroke-linecap="round"
      stroke-linejoin="round"
    />

    <!-- Inner Highlight Core -->
    <path
      d="M 72 256 L 140 256 L 186 164 L 244 352 L 290 204 L 324 284 L 358 256 L 440 256"
      fill="none"
      stroke="#FFFFFF"
      stroke-width="8"
      stroke-linecap="round"
      stroke-linejoin="round"
      opacity="0.9"
    />

    <!-- Peak Energy Indicator Nodes -->
    <circle cx="186" cy="160" r="10" fill="#00F5A0" />
    <circle cx="186" cy="160" r="5" fill="#FFFFFF" />

    <circle cx="244" cy="356" r="11" fill="#C8B6FF" />
    <circle cx="244" cy="356" r="5" fill="#FFFFFF" />

    <circle cx="290" cy="200" r="9" fill="#FBD8B3" />
    <circle cx="290" cy="200" r="4" fill="#FFFFFF" />
  </g>
</svg>
  `.trim();
}

async function main() {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log('Generating Pulse App Icons & Assets...');

  const standardSvg = createSvg({ isMaskable: false, rounded: false });
  const maskableSvg = createSvg({ isMaskable: true, rounded: false });
  const standaloneSvg = createSvg({ isMaskable: false, rounded: true });

  // Save standalone vector favicon.svg
  fs.writeFileSync(path.join(outDir, 'favicon.svg'), standaloneSvg, 'utf8');
  console.log('✓ Saved favicon.svg');

  const standardBuffer = Buffer.from(standardSvg);
  const maskableBuffer = Buffer.from(maskableSvg);

  const targets = [
    // Favicons
    { name: 'favicon-16x16.png', size: 16, buf: standardBuffer },
    { name: 'favicon-32x32.png', size: 32, buf: standardBuffer },
    { name: 'favicon-48x48.png', size: 48, buf: standardBuffer },

    // Apple Touch Icons (Full bleed solid dark background, centered artwork, iOS squircle clips it)
    { name: 'apple-touch-icon.png', size: 180, buf: standardBuffer },
    { name: 'apple-touch-icon-180x180.png', size: 180, buf: standardBuffer },
    { name: 'apple-touch-icon-167x167.png', size: 167, buf: standardBuffer },
    { name: 'apple-touch-icon-152x152.png', size: 152, buf: standardBuffer },
    { name: 'apple-touch-icon-120x120.png', size: 120, buf: standardBuffer },

    // Android / PWA Standard Icons (purpose: any)
    { name: 'pwa-192x192.png', size: 192, buf: standardBuffer },
    { name: 'pwa-512x512.png', size: 512, buf: standardBuffer },

    // Android Adaptive Maskable Icons (purpose: maskable)
    { name: 'pwa-maskable-192x192.png', size: 192, buf: maskableBuffer },
    { name: 'pwa-maskable-512x512.png', size: 512, buf: maskableBuffer },
  ];

  for (const t of targets) {
    const dest = path.join(outDir, t.name);
    await sharp(t.buf)
      .resize(t.size, t.size)
      .png({ compressionLevel: 9 })
      .toFile(dest);
    console.log(`✓ Generated ${t.name} (${t.size}x${t.size})`);
  }

  // Generate multi-size favicon.ico from 32x32 and 16x16 pngs
  // Modern browsers accept 32x32 PNG renamed to .ico or we can output 32x32 directly
  const icoDest = path.join(outDir, 'favicon.ico');
  await sharp(standardBuffer)
    .resize(32, 32)
    .toFormat('png')
    .toFile(icoDest);
  console.log('✓ Generated favicon.ico');

  console.log('All icons generated successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
