// BugBaas brand: writes the vector sources to assets/v2/brand/*.svg and renders the app assets.
// Own work, no fonts: the wordmark letters are hand-drawn centre-line strokes.
// Usage: node scripts/render-brand.mjs            (writes SVGs + renders assets)
//        node scripts/render-brand.mjs --svg-only (only rewrites the SVG sources)
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const brandDir = path.join(root, 'assets/v2/brand');
const uiDir = path.join(root, 'assets/v2/ui');
const BG = '#12382e'; // app.json backgroundColor / adaptive background
const INK = '#0A2A1F'; // outline colour

// ---------- shared definitions ----------
const defs = `
  <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#FFF7B0"/><stop offset=".38" stop-color="#FFD83A"/>
    <stop offset=".78" stop-color="#FFAE1A"/><stop offset="1" stop-color="#F28400"/>
  </linearGradient>
  <radialGradient id="goldBall" cx=".35" cy=".3" r=".8">
    <stop offset="0" stop-color="#FFFBD0"/><stop offset=".45" stop-color="#FFD23A"/><stop offset="1" stop-color="#E88A00"/>
  </radialGradient>
  <radialGradient id="shell" cx=".36" cy=".34" r=".78">
    <stop offset="0" stop-color="#D4FF72"/><stop offset=".32" stop-color="#7EE03E"/>
    <stop offset=".72" stop-color="#22A64A"/><stop offset="1" stop-color="#0E6A3A"/>
  </radialGradient>
  <linearGradient id="head" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#2F6470"/><stop offset="1" stop-color="#123039"/>
  </linearGradient>
  <radialGradient id="jewel" cx=".38" cy=".32" r=".75">
    <stop offset="0" stop-color="#FFC2E4"/><stop offset=".4" stop-color="#FF3FA4"/><stop offset="1" stop-color="#B0106A"/>
  </radialGradient>
  <radialGradient id="lime" cx=".35" cy=".3" r=".8">
    <stop offset="0" stop-color="#F4FFB8"/><stop offset=".5" stop-color="#A8F046"/><stop offset="1" stop-color="#3FA83A"/>
  </radialGradient>`;

// Outer rim + soft drop shadow for any group (alpha based, so it follows the whole silhouette).
const stickerFilter = (id, rim, shadowDy, blur, rimColor = '#FFF4CF') => `
  <filter id="${id}" x="-15%" y="-15%" width="130%" height="140%" color-interpolation-filters="sRGB">
    <feGaussianBlur in="SourceAlpha" stdDeviation="${(rim / 1.45).toFixed(2)}"/>
    <feComponentTransfer result="d"><feFuncA type="linear" slope="20" intercept="-1"/></feComponentTransfer>
    <feFlood flood-color="${rimColor}"/><feComposite in2="d" operator="in" result="rim"/>
    <feGaussianBlur in="d" stdDeviation="${blur}"/><feOffset dy="${shadowDy}" result="b"/>
    <feFlood flood-color="#021510" flood-opacity=".6"/><feComposite in2="b" operator="in" result="shadow"/>
    <feMerge><feMergeNode in="shadow"/><feMergeNode in="rim"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>`;

// ---------- mascot (512 x 512 design box) ----------
const legsLeft = `
  <path d="M128,286 Q84,270 66,236" /><path d="M114,334 Q70,340 50,322" /><path d="M130,388 Q92,414 86,446" />`;
const mascot = `
<g id="mascot" stroke-linecap="round" stroke-linejoin="round">
  <g fill="none" stroke="${INK}" stroke-width="30">${legsLeft}<g transform="translate(512,0) scale(-1,1)">${legsLeft}</g></g>
  <g fill="none" stroke="#2F7356" stroke-width="13">${legsLeft}<g transform="translate(512,0) scale(-1,1)">${legsLeft}</g></g>
  <circle cx="256" cy="318" r="152" fill="url(#shell)" stroke="${INK}" stroke-width="14"/>
  <path d="M256,190 V466" stroke="${INK}" stroke-width="11" fill="none"/>
  <g stroke="${INK}" stroke-width="8" fill="url(#goldBall)">
    <circle cx="186" cy="334" r="28"/><circle cx="326" cy="334" r="28"/>
    <circle cx="212" cy="414" r="19"/><circle cx="300" cy="414" r="19"/>
  </g>
  <path d="M136,380 A128,128 0 0 1 146,262" fill="none" stroke="#FFFFFF" stroke-opacity=".55" stroke-width="13"/>
  <circle cx="150" cy="410" r="7" fill="#FFFFFF" fill-opacity=".55"/>
  <path d="M396,300 A142,142 0 0 1 330,444" fill="none" stroke="#0A4F2E" stroke-opacity=".35" stroke-width="16"/>
  <g fill="none" stroke="${INK}" stroke-width="13">
    <path d="M204,130 Q186,76 142,62"/><path d="M308,130 Q326,76 370,62"/>
  </g>
  <g stroke="${INK}" stroke-width="7" fill="url(#lime)"><circle cx="138" cy="60" r="18"/><circle cx="374" cy="60" r="18"/></g>
  <ellipse cx="256" cy="200" rx="118" ry="90" fill="url(#head)" stroke="${INK}" stroke-width="14"/>
  <ellipse cx="226" cy="146" rx="52" ry="15" fill="#FFFFFF" fill-opacity=".16" transform="rotate(-8 226 146)"/>
  <ellipse cx="210" cy="204" rx="37" ry="43" fill="#FFFFFF"/><ellipse cx="302" cy="204" rx="37" ry="43" fill="#FFFFFF"/>
  <circle cx="218" cy="212" r="24" fill="#0B1C22"/><circle cx="294" cy="212" r="24" fill="#0B1C22"/>
  <circle cx="227" cy="200" r="9.5" fill="#FFFFFF"/><circle cx="303" cy="200" r="9.5" fill="#FFFFFF"/>
  <circle cx="210" cy="224" r="4" fill="#FFFFFF"/><circle cx="286" cy="224" r="4" fill="#FFFFFF"/>
  <ellipse cx="164" cy="246" rx="15" ry="9" fill="#FF7FAE" fill-opacity=".85"/><ellipse cx="348" cy="246" rx="15" ry="9" fill="#FF7FAE" fill-opacity=".85"/>
  <path d="M232,244 Q256,282 280,244 Q256,252 232,244 Z" fill="#FF6B8E" stroke="${INK}" stroke-width="6"/>
  <path d="M246,262 Q256,270 266,262" fill="none" stroke="#FFB3C6" stroke-width="5"/>
  <g transform="rotate(-7 256 110)">
    <path d="M194,134 L182,66 L224,98 L256,50 L288,98 L330,66 L318,134 Q256,148 194,134 Z" fill="url(#gold)" stroke="${INK}" stroke-width="10"/>
    <path d="M200,122 Q256,134 312,122" fill="none" stroke="#C86A00" stroke-opacity=".55" stroke-width="5"/>
    <path d="M204,112 L198,84" fill="none" stroke="#FFFFFF" stroke-opacity=".7" stroke-width="6"/>
    <g stroke="${INK}" stroke-width="6" fill="url(#goldBall)"><circle cx="182" cy="64" r="11"/><circle cx="256" cy="47" r="12"/><circle cx="330" cy="64" r="11"/></g>
    <ellipse cx="256" cy="112" rx="14" ry="16" fill="url(#jewel)" stroke="${INK}" stroke-width="5"/>
    <circle cx="251" cy="106" r="4" fill="#FFFFFF" fill-opacity=".9"/>
  </g>
</g>`;

// ---------- wordmark letters (centre lines; cap 0..240, x-height 86..240) ----------
const W = 50; // letter stroke
const OL = 9; // dark outline per side
const B = 'M0,0 V240 M0,0 H50 A58,58 0 0 1 50,116 H0 M0,116 H60 A62,62 0 0 1 60,240 H0';
const BOWL = 'M0,163 A71,72 0 1 0 142,163 A71,72 0 1 0 0,163';
const letters = [
  {w: 122, d: B},
  {w: 140, d: 'M0,86 V170 A70,70 0 0 0 140,170 M140,86 V240'},
  {w: 142, d: `${BOWL} M142,86 V262 C142,336 36,340 8,296`},
  {w: 122, d: B},
  {w: 142, d: `${BOWL} M142,86 V240`},
  {w: 142, d: `${BOWL} M142,86 V240`},
  {w: 122, d: 'M116,110 C106,90 84,86 62,86 C24,86 6,114 26,138 C42,156 82,160 100,174 C130,198 114,240 64,240 C36,240 12,232 2,212'},
];
const GAP = W + 2 * OL - 4;
let x = 0;
const placed = letters.map(l => {const p = {...l, x}; x += l.w + GAP; return p;});
const textW = x - GAP; // centre-line width
const lettersPath = placed.map(l => `<path transform="translate(${l.x} 0)" d="${l.d}"/>`).join('');

const sparkle = (cx, cy, r, fill = '#FFFBE0') => `<path d="M${cx},${cy - r} Q${cx + r * .16},${cy - r * .16} ${cx + r},${cy} Q${cx + r * .16},${cy + r * .16} ${cx},${cy + r} Q${cx - r * .16},${cy + r * .16} ${cx - r},${cy} Q${cx - r * .16},${cy - r * .16} ${cx},${cy - r} Z" fill="${fill}"/>`;
const wordmarkText = (tx, ty, s, rot) => `
<g transform="translate(${tx} ${ty}) rotate(${rot}) scale(${s})" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <mask id="lettersMask" maskUnits="userSpaceOnUse" x="-100" y="-100" width="${textW + 200}" height="500">
    <g fill="none" stroke="#FFFFFF" stroke-width="${W - 4}" stroke-linecap="round" stroke-linejoin="round">${lettersPath}</g>
  </mask>
  <g stroke="${INK}" stroke-width="${W + 2 * OL}" transform="translate(0 13)">${lettersPath}</g>
  <g stroke="#B85A00" stroke-width="${W}" transform="translate(0 9)">${lettersPath}</g>
  <g stroke="${INK}" stroke-width="${W + 2 * OL}">${lettersPath}</g>
  <g stroke="url(#textGold)" stroke-width="${W}">${lettersPath}</g>
  <rect x="-60" y="-40" width="${textW + 120}" height="96" fill="url(#gloss)" mask="url(#lettersMask)"/>
  <rect x="-60" y="58" width="${textW + 120}" height="70" fill="url(#gloss)" mask="url(#lettersMask)"/>
  ${sparkle(placed[3].x - 4, 6, 30, '#FFFFFF')}${sparkle(placed[6].x + 104, 100, 20, '#FFFFFF')}${sparkle(placed[1].x + 2, 92, 16, '#FFFFFF')}
</g>`;
const textDefs = `
  <linearGradient id="textGold" gradientUnits="userSpaceOnUse" x1="0" y1="-30" x2="0" y2="270">
    <stop offset="0" stop-color="#FFF8B8"/><stop offset=".3" stop-color="#FFE04A"/>
    <stop offset=".72" stop-color="#FFB31C"/><stop offset="1" stop-color="#F07A00"/>
  </linearGradient>
  <linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#FFFFFF" stop-opacity=".75"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
  </linearGradient>`;


// ---------- documents ----------
const WM_W = 2000, WM_H = 690;
function wordmarkSvg() {
  const tx = 604, ty = 236;
  const s = +((WM_W - tx - 40) / (textW + W + 2 * OL + 40)).toFixed(4); // fit text to the right of the mascot
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WM_W} ${WM_H}" width="${WM_W}" height="${WM_H}">
<defs>${defs}${textDefs}${stickerFilter('stickerM', 12, 14, 9)}${stickerFilter('stickerT', 12, 14, 9)}</defs>
<g filter="url(#stickerT)">
  ${wordmarkText(tx, ty, s, -4)}
</g>
<g filter="url(#stickerM)" transform="translate(14 22) scale(1.19)">${mascot}</g>
</svg>`;
}
// Square mascot-only symbol; `scale` sizes the 512 box inside a 1024 canvas.
function symbolSvg({scale, background}) {
  const off = (1024 - 512 * scale) / 2;
  const bg = background ? `
  <radialGradient id="bgGlow" cx=".5" cy=".46" r=".62">
    <stop offset="0" stop-color="#3F9A5A"/><stop offset=".55" stop-color="#1E5A40"/><stop offset="1" stop-color="${BG}"/>
  </radialGradient>` : '';
  const bgShapes = background ? `
<rect width="1024" height="1024" fill="url(#bgGlow)"/>
<g fill="#FFE98A" fill-opacity=".07">${Array.from({length: 12}, (_, i) => `<path d="M512,470 L${512 + 900 * Math.cos((i * 30 - 4) * Math.PI / 180)},${470 + 900 * Math.sin((i * 30 - 4) * Math.PI / 180)} L${512 + 900 * Math.cos((i * 30 + 8) * Math.PI / 180)},${470 + 900 * Math.sin((i * 30 + 8) * Math.PI / 180)} Z"/>`).join('')}</g>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
<defs>${defs}${bg}${stickerFilter('stickerS', 10, 12, 10)}</defs>${bgShapes}
<g filter="url(#stickerS)" transform="translate(${off} ${off + 6 * scale}) scale(${scale})">${mascot}</g>
</svg>`;
}

const sources = {
  'wordmark.svg': wordmarkSvg(),
  'app-icon.svg': symbolSvg({scale: 1.58, background: true}),
  'app-icon-foreground.svg': symbolSvg({scale: 1.04, background: false}),
};

fs.mkdirSync(brandDir, {recursive: true});
for (const [name, svg] of Object.entries(sources)) fs.writeFileSync(path.join(brandDir, name), svg);
if (process.argv.includes('--svg-only')) process.exit(0);

const render = (name, density = 72) => sharp(Buffer.from(sources[name]), {density});

// Wordmark: trim to content, pad to the 2.9:1 box BrandMark reserves, 2x density for crisp HD.
{
  const trimmed = await render('wordmark.svg', 144).png().toBuffer().then(b => sharp(b).trim({threshold: 1}).toBuffer({resolveWithObject: true}));
  const {width, height} = trimmed.info;
  const targetH = Math.max(height + 24, Math.ceil((width + 24) / 2.9));
  const targetW = Math.round(targetH * 2.9);
  const padded = await sharp(trimmed.data).extend({
    top: Math.floor((targetH - height) / 2), bottom: Math.ceil((targetH - height) / 2),
    left: Math.floor((targetW - width) / 2), right: Math.ceil((targetW - width) / 2),
    background: {r: 0, g: 0, b: 0, alpha: 0},
  }).png().toBuffer();
  // 1600 px wide = 5x the largest use (LoadingScreenV2, 320 px) -> crisp on 3x screens, small bundle.
  const out = sharp(padded).resize({width: 1600, kernel: 'lanczos3'});
  await out.clone().webp({quality: 92, alphaQuality: 100, effort: 6}).toFile(path.join(uiDir, 'wordmark.webp'));
  await out.clone().png({compressionLevel: 9}).toFile(path.join(uiDir, 'wordmark.png'));
}
await render('app-icon.svg').flatten({background: BG}).png({compressionLevel: 9}).toFile(path.join(uiDir, 'app-icon-v2.png'));
await render('app-icon-foreground.svg').png({compressionLevel: 9}).toFile(path.join(uiDir, 'app-icon-foreground-v2.png'));

// Safe-zone check: Android keeps a 66dp circle of the 108dp foreground (r = 0.3056 * 1024 = 313 px).
{
  const {data, info} = await sharp(path.join(uiDir, 'app-icon-foreground-v2.png')).raw().toBuffer({resolveWithObject: true});
  let max = 0;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    if (data[(y * info.width + x) * 4 + 3] > 24) max = Math.max(max, Math.hypot(x - 511.5, y - 511.5));
  }
  console.log(`foreground: max content radius ${max.toFixed(0)} px (safe circle 313 px)${max > 313 ? '  <-- OUTSIDE SAFE ZONE' : ''}`);
}
console.log('brand assets rendered');
