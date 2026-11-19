const fs = require('fs');
const css = fs.readFileSync('/home/claude/duo-recomp/src/app/globals.css', 'utf8');

// Pull the token block for :root and for [data-theme='dark'].
function tokens(selector) {
  const i = css.indexOf(selector);
  const block = css.slice(i, css.indexOf('}', i));
  const out = {};
  for (const m of block.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) out['--' + m[1]] = m[2].trim();
  return out;
}
const light = tokens(':root {');
const dark = { ...light, ...tokens("[data-theme='dark'] {") };

const hex = (v) => {
  const m = /#([0-9a-f]{6}|[0-9a-f]{3})/i.exec(v);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

// Every pairing the interface actually renders.
const PAIRS = [
  ['--ink', '--bg', 'body text on page', 4.5],
  ['--ink', '--paper', 'body text on a card', 4.5],
  ['--ink-soft', '--paper', 'secondary text on a card', 4.5],
  ['--ink-faint', '--paper', 'tertiary text on a card', 3.0],
  ['--ink', '--paper-sunk', 'text in an input', 4.5],
  ['--ink-soft', '--bg', 'secondary text on page', 4.5],
  ['--coral', '--paper', 'fox accent on a card', 3.0],
  ['--rose', '--paper', 'rabbit accent on a card', 3.0],
  ['--danger', '--paper', 'error text', 4.5],
  ['--warning', '--butter', 'warning text on its notice', 4.5],
  ['--success', '--paper', 'success text', 4.5]
];

let fails = 0;
for (const [name, set] of [['LIGHT', light], ['DARK', dark]]) {
  console.log(`\n=== ${name} ===`);
  for (const [fg, bg, label, min] of PAIRS) {
    const a = hex(set[fg]), b = hex(set[bg]);
    if (!a || !b) { console.log(`  ?? ${label} — unresolved (${set[fg]} / ${set[bg]})`); continue; }
    const r = ratio(a, b);
    const ok = r >= min;
    if (!ok) fails++;
    console.log(`  ${ok ? 'pass' : 'FAIL'}  ${r.toFixed(2)}:1  (needs ${min})  ${label}`);
  }
}
console.log(`\n${fails} failing pair${fails === 1 ? '' : 's'}`);
