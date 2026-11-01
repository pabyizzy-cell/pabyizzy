// Add a TikTok Shop product to the link page.
//
//   node tools/add.mjs <tiktok share link> [--name "Short name"] [--blurb "One line"] [--tag "Gadgets"] [--push]
//   node tools/add.mjs --hide 3        (take #3 off the page, keeps its number reserved)
//   node tools/add.mjs --list
//
// Pulls the product title and photo from the share link, gives it the next number,
// saves the photo to img/<n>.jpg and writes products.json. --push commits and publishes.

import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'products.json');
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

const args = process.argv.slice(2);
const flag = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const data = JSON.parse(readFileSync(DATA, 'utf8'));
const save = () => writeFileSync(DATA, JSON.stringify(data, null, 2) + '\n');

function publish(msg) {
  execSync('git add -A && git commit -m ' + JSON.stringify(msg) + ' && git push', { cwd: ROOT, stdio: 'inherit' });
}

if (args.includes('--list')) {
  for (const p of [...data.products].sort((a, b) => a.n - b.n)) {
    console.log(`#${p.n}${p.hidden ? ' (hidden)' : ''}  ${p.name}  [${p.tag || '-'}]`);
  }
  process.exit(0);
}

if (flag('--hide')) {
  const p = data.products.find((x) => String(x.n) === flag('--hide'));
  if (!p) throw new Error('No product #' + flag('--hide'));
  p.hidden = true;
  save();
  console.log(`Hid #${p.n} ${p.name}`);
  if (args.includes('--push')) publish(`Hide #${p.n}`);
  process.exit(0);
}

const link = args.find((a) => /^https?:\/\//.test(a));
if (!link) {
  console.error('Usage: node tools/add.mjs <tiktok share link> [--name ..] [--blurb ..] [--tag ..] [--push]');
  process.exit(1);
}
if (data.products.some((p) => p.link === link)) {
  console.error('That link is already on the page.');
  process.exit(1);
}

const html = await fetch(link, { headers: { 'user-agent': UA }, redirect: 'follow' }).then((r) => r.text());
const meta = (prop) => {
  const m = html.match(new RegExp(`property="${prop}"\\s+content="([^"]*)"`)) ||
            html.match(new RegExp(`content="([^"]*)"\\s+property="${prop}"`));
  return m ? m[1].replace(/&amp;/g, '&') : '';
};
const title = decodeURIComponent(meta('og:title').replace(/\+/g, ' '));
const imageUrl = meta('og:image');
if (!title || !imageUrl) throw new Error('Could not read the product title/photo from that link. Is it a product share link?');

const n = Math.max(0, ...data.products.map((p) => p.n)) + 1;
const img = await fetch(imageUrl, { headers: { 'user-agent': UA } });
if (!img.ok) throw new Error('Photo download failed: ' + img.status);
writeFileSync(join(ROOT, 'img', `${n}.jpg`), Buffer.from(await img.arrayBuffer()));

// Listing titles are keyword soup; default to the part before the first " - " or comma.
const shortName = title.split(/ - |, /)[0].slice(0, 48).trim();

const product = {
  n,
  name: flag('--name') || shortName,
  blurb: flag('--blurb') || '',
  tag: flag('--tag') || '',
  image: `img/${n}.jpg`,
  link,
  added: new Date().toISOString().slice(0, 10),
};
data.products.push(product);
save();

console.log(`Added #${n}: ${product.name}`);
console.log(`Listing title: ${title}`);
if (args.includes('--push')) publish(`Add #${n} ${product.name}`);
