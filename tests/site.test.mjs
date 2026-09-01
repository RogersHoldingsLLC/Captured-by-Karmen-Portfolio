import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(join(root, path), "utf8");
const html = read("index.html");
const css = read("assets/css/site.css");
const js = read("assets/js/site.js");
const manifest = JSON.parse(read("site.webmanifest"));
const liveBase = "https://capturedbykarmen.rogersholdingsllc.com/";
const sha256 = (path) => createHash("sha256")
  .update(readFileSync(join(root, path)))
  .digest("hex");

const lockedBrandAssets = new Map([
  ["assets/images/brand/03-Captured-by-Karmen-Seal-Avatar.png", {
    hash: "42ef8539c7d55ba1d7ed7c779e62288a511f8d04a60b0b6efba9b6d459fdf68d",
    dimensions: { width: 1254, height: 1254 }
  }],
  ["assets/images/brand/05-Captured-by-Karmen-Clean-Wordmark.png", {
    hash: "8bf0c109c44112568e3f419a0d294a0b6057aa76065064bc3bcc4fa6c7d8b7ba",
    dimensions: { width: 2172, height: 724 }
  }],
  ["assets/images/brand/06-Captured-by-Karmen-Signature-Floral-Watermark.png", {
    hash: "acba0658d0d7f79b25144cb893163274b2db9f3a4e1fa71c8fef270e53168853",
    dimensions: { width: 3000, height: 900 }
  }],
  ["assets/images/brand/07-Captured-by-Karmen-Premium-Camera-Floral-Motif.png", {
    hash: "068212887b2936656b6de3e23f5c9d31ad0162cc3761875d07bb3b2605aefe81",
    dimensions: { width: 570, height: 657 }
  }],
  ["assets/images/brand/08-Captured-by-Karmen-Light-Wordmark-Watermark.png", {
    hash: "7dd438fbb2f39cef8ca1911e6efaba7ab5ee789a2b57193fd5a032827d4c6ea3",
    dimensions: { width: 2172, height: 724 }
  }]
]);

const pngDimensions = (path) => {
  const image = readFileSync(join(root, path));
  assert.equal(image.subarray(1, 4).toString("ascii"), "PNG", `${path} is not a PNG`);
  return {
    width: image.readUInt32BE(16),
    height: image.readUInt32BE(20)
  };
};

const pngHasAlpha = (path) => {
  const image = readFileSync(join(root, path));
  const colorType = image[25];
  return colorType === 4 || colorType === 6 || image.includes(Buffer.from("tRNS"));
};

const requiredFiles = [
  "README.md",
  "package.json",
  "index.html",
  "assets/css/site.css",
  "assets/js/site.js",
  ...lockedBrandAssets.keys(),
  "assets/images/hero/karmen-exact-white-shirt.png",
  "assets/images/hero/portrait-brush-mask.png",
  "assets/images/portfolio",
  "robots.txt",
  "site.webmanifest",
  ".nojekyll",
  "tests/site.test.mjs",
  ".github/workflows/pages.yml"
];

test("required static files exist", () => {
  for (const file of requiredFiles) {
    assert.ok(existsSync(join(root, file)), `Missing required file: ${file}`);
  }
});

test("imported final locked brand assets match approved source hashes", () => {
  for (const [path, expected] of lockedBrandAssets) {
    assert.deepEqual(pngDimensions(path), expected.dimensions);
    assert.equal(pngHasAlpha(path), true, `${path} must preserve transparency`);
    assert.equal(sha256(path), expected.hash, `${path} differs from the approved source package`);
  }
});

test("all local HTML and CSS asset references resolve", () => {
  const htmlRefs = [];
  for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    htmlRefs.push(match[1]);
  }
  const cssRefs = [];
  for (const match of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
    cssRefs.push(match[1]);
  }

  for (const ref of htmlRefs) {
    if (ref.startsWith("#")) continue;
    assert.ok(!/^(?:https?:)?\/\//i.test(ref), `External reference found: ${ref}`);
    const clean = ref.split(/[?#]/)[0];
    const target = resolve(root, clean);
    assert.ok(existsSync(target), `Unresolved local reference: ${ref}`);
  }

  for (const ref of cssRefs) {
    assert.ok(!/^(?:https?:)?\/\//i.test(ref), `External CSS reference found: ${ref}`);
    const target = resolve(root, "assets/css", ref.split(/[?#]/)[0]);
    assert.ok(existsSync(target), `Unresolved local CSS reference: ${ref}`);
  }
});

test("no external runtime assets, fonts, trackers, or analytics are present", () => {
  const source = `${html.replaceAll(liveBase, "")}\n${css}\n${js}`;
  assert.doesNotMatch(source, /(?:https?:)?\/\//i);
  assert.doesNotMatch(source, /@import|google-analytics|googletagmanager|gtag\s*\(|analytics|pixel\b|tracker/i);
});

test("social metadata uses the locked seal/avatar asset", () => {
  const sharePath = "assets/images/brand/03-Captured-by-Karmen-Seal-Avatar.png";
  const shareUrl = `${liveBase}${sharePath}`;
  assert.deepEqual(pngDimensions(sharePath), { width: 1254, height: 1254 });
  assert.match(html, new RegExp(`<meta property="og:image" content="${shareUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}">`));
  assert.match(html, /<meta property="og:image:width" content="1254">/);
  assert.match(html, /<meta property="og:image:height" content="1254">/);
  assert.match(html, new RegExp(`<meta name="twitter:image" content="${shareUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}">`));
  assert.match(html, /<meta name="twitter:card" content="summary">/);
});

test("favicon and app manifest use the unchanged locked seal/avatar", () => {
  const iconPath = "assets/images/brand/03-Captured-by-Karmen-Seal-Avatar.png";
  assert.match(html, new RegExp(`<link rel="icon"[^>]+href="${iconPath.replaceAll("/", "\\/")}">`));
  assert.match(html, new RegExp(`<link rel="apple-touch-icon" href="${iconPath.replaceAll("/", "\\/")}">`));
  assert.deepEqual(manifest.icons, [{
    src: iconPath,
    sizes: "1254x1254",
    type: "image/png",
    purpose: "any"
  }]);
});

test("favicon uses the approved locked seal without a CK monogram", () => {
  assert.doesNotMatch(`${html}\n${JSON.stringify(manifest)}`, /assets\/images\/favicon|favicon\.ico|\bCK\b|CK monogram/i);
  assert.doesNotMatch(`${html}\n${JSON.stringify(manifest)}`, /\bCK\b|CK monogram/i);
});

test("search indexing and crawling are blocked", () => {
  assert.match(html, /name="robots" content="noindex, nofollow, noarchive"/i);
  assert.match(html, /name="googlebot" content="noindex, nofollow, noarchive"/i);
  assert.equal(read("robots.txt").trim(), "User-agent: *\nDisallow: /");
});

test("the approved portrait is referenced and byte-for-byte preserved", () => {
  const portraitPath = "assets/images/hero/karmen-exact-white-shirt.png";
  assert.match(html, new RegExp(portraitPath.replaceAll("/", "\\/")));
  assert.match(html, /width="1086"[\s\S]*height="1448"/);
  assert.match(css, /object-fit:\s*cover/);
  assert.equal(sha256(portraitPath), "6a4ee5c7a4fbbf3b31b48f1717db5546e4af3a2ad7f8769b25e494b0de7784d0");
});

test("approved brush mask is applied without image filters", () => {
  assert.match(css, /portrait-brush-mask\.png/);
  assert.doesNotMatch(css, /(^|[^-])filter\s*:/im);
  assert.match(css, /object-fit:\s*cover/);
});

test("desktop and mobile story copies use exclusive responsive visibility", () => {
  const desktop = html.match(/<div class="hero-story hero-story-desktop"[^>]*>([\s\S]*?)<\/div>/);
  const mobile = html.match(/<div class="hero-story-mobile"[^>]*>([\s\S]*?)<\/div>/);
  assert.ok(desktop, "Desktop story copy is missing");
  assert.ok(mobile, "Mobile story copy is missing");
  for (const copy of [desktop[1], mobile[1]]) {
    assert.match(copy, /for every/);
    assert.match(copy, /STAGE\.<br>SEASON\.<br>STORY\./);
  }
  assert.match(css, /\.hero-story-mobile\s*{\s*display:\s*none;/);
  assert.match(css, /@media \(max-width:\s*1040px\)[\s\S]*?\.hero-story-desktop\s*{\s*display:\s*none;/);
  assert.match(css, /@media \(max-width:\s*1040px\)[\s\S]*?\.hero-story-mobile\s*{\s*display:\s*grid;/);
});

test("mobile navigation remains usable without JavaScript or horizontal overflow", () => {
  assert.match(css, /@media \(max-width:\s*760px\)[\s\S]*?\.site-nav\s*{[\s\S]*?min-width:\s*0;/);
  assert.match(css, /html:not\(\.js\) \.site-nav\s*{[\s\S]*?display:\s*grid;[\s\S]*?grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);/);
  assert.match(css, /html:not\(\.js\) \.site-nav a\s*{[\s\S]*?min-width:\s*0;[\s\S]*?text-align:\s*center;/);
});

test("brand and supervision requirements are present", () => {
  assert.match(html, /Captured by Karmen/);
  assert.match(html, /Photography/);
  assert.match(html, /Capturing moments\. Preserving memories\. ♡/);
  assert.match(html, /A Rogers Holdings Company/);
  assert.match(html, /All inquiries, scheduling, locations, and client communication are reviewed and coordinated by a parent or guardian\./);
  assert.doesNotMatch(html, /\bCK\b|CK monogram/i);
});

test("header, About, and footer use the final locked brand family", () => {
  const header = html.match(/<header class="site-header"[\s\S]*?<\/header>/);
  const about = html.match(/<section class="section about-section"[\s\S]*?<\/section>/);
  const footer = html.match(/<footer class="site-footer">[\s\S]*?<\/footer>/);
  assert.ok(header, "Header is missing");
  assert.ok(about, "About section is missing");
  assert.ok(footer, "Footer is missing");
  assert.match(header[0], /src="assets\/images\/brand\/05-Captured-by-Karmen-Clean-Wordmark\.png"/);
  assert.match(header[0], /width="2172"[\s\S]*?height="724"/);
  assert.match(about[0], />About Karmen</);
  assert.match(about[0], />behind the camera</);
  assert.match(about[0], /Photos that feel personal, not forced\./);
  assert.match(about[0], /class="about-camera-mark" aria-hidden="true"[\s\S]*?src="assets\/images\/brand\/07-Captured-by-Karmen-Premium-Camera-Floral-Motif\.png"[\s\S]*?alt=""/);
  assert.doesNotMatch(about[0], /captured-by-karmen-floral-accent\.png/);
  assert.match(about[0], /src="assets\/images\/brand\/03-Captured-by-Karmen-Seal-Avatar\.png"/);
  assert.match(about[0], /class="about-seal" aria-hidden="true"[\s\S]*?alt=""/);
  assert.match(footer[0], /src="assets\/images\/brand\/08-Captured-by-Karmen-Light-Wordmark-Watermark\.png"/);
  assert.match(footer[0], /A Rogers Holdings Company/);
  assert.match(about[0], /class="value-list" role="list" aria-label="Photography values"/);
  assert.doesNotMatch(about[0], /captured-by-karmen-icon-512|about-flourish|karmen-exact-white-shirt|<picture\b|<form\b/i);
  assert.match(css, /\.about-brush-rose/);
  assert.match(css, /\.about-brush-sage/);
  assert.match(css, /\.about-camera-mark/);
  assert.match(css, /\.about-camera-mark img[\s\S]*?width: 100%;[\s\S]*?height: auto;/);
  assert.doesNotMatch(css, /\.about-floral-mark/);
  assert.doesNotMatch(css, /\.about-flourish/);
});

test("obsolete earlier-generation brand files and references are removed", () => {
  const obsolete = [
    "assets/images/brand/Captured-by-Karmen-Cute-Camera-Transparent.png",
    "assets/images/brand/captured-by-karmen-floral-accent.png",
    "assets/images/brand/captured-by-karmen-horizontal.png",
    "assets/images/brand/captured-by-karmen-primary.png",
    "assets/images/brand/captured-by-karmen-watermark.png",
    "assets/images/social/captured-by-karmen-share.png",
    "favicon.ico"
  ];
  const deployedSource = `${html}\n${css}\n${js}\n${JSON.stringify(manifest)}`;
  for (const path of obsolete) {
    assert.equal(existsSync(join(root, path)), false, `Obsolete file remains: ${path}`);
    assert.doesNotMatch(deployedSource, new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  }
});

test("hero CTA anchors and all internal anchors resolve", () => {
  assert.match(html, /href="#portfolio">View the Portfolio<\/a>/);
  assert.match(html, /href="#inquire">Inquire About a Session<\/a>/);
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
  for (const match of html.matchAll(/href="#([^"]+)"/g)) {
    assert.ok(ids.has(match[1]), `Anchor target missing: #${match[1]}`);
  }
});

test("no form, data transmission, or direct contact path exists", () => {
  const deployedSource = `${html}\n${js}`;
  assert.doesNotMatch(html, /<form\b|\baction\s*=/i);
  assert.doesNotMatch(deployedSource, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|mailto:|tel:/i);
  assert.doesNotMatch(html, /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  assert.doesNotMatch(html, /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/);
  assert.doesNotMatch(html, /\b\d{1,5}\s+[A-Za-z0-9.' -]+\s(?:Street|St|Road|Rd|Avenue|Ave|Lane|Ln|Drive|Dr|Boulevard|Blvd)\b/i);
  assert.doesNotMatch(html, /\b(?:elementary|middle school|high school|academy)\b/i);
});

test("portfolio contains exactly six watermarked reserved slots and no photographs", () => {
  const signatureWatermark = "assets/images/brand/06-Captured-by-Karmen-Signature-Floral-Watermark.png";
  const lightWatermark = "assets/images/brand/08-Captured-by-Karmen-Light-Wordmark-Watermark.png";

  const slots = [...html.matchAll(/<figure class="portfolio-slot [^"]+" data-portfolio-slot="(\d{2})">([\s\S]*?)<\/figure>/g)];
  assert.equal(slots.length, 6);
  assert.deepEqual(slots.map((slot) => slot[1]), ["01", "02", "03", "04", "05", "06"]);
  for (const [number, markup] of slots.map((slot) => [slot[1], slot[2]])) {
    const expected = number === "05" ? lightWatermark : signatureWatermark;
    assert.match(markup, new RegExp(`src="${expected.replaceAll("/", "\\/")}"`));
    assert.match(markup, new RegExp(`Reserved portfolio image ${number}`));
    assert.match(markup, /Reserved for an approved original photograph/);
  }
  assert.equal(slots.filter((slot) => slot[2].includes(signatureWatermark)).length, 5);
  assert.equal(slots.filter((slot) => slot[2].includes(lightWatermark)).length, 1);

  const files = readdirSync(join(root, "assets/images/portfolio"))
    .filter((name) => name !== ".gitkeep");
  assert.deepEqual(files, []);
  assert.match(html, /Original photographs are being selected and reviewed for quality and public-use permission before publication\./);
});

test("no custom domain configuration is present", () => {
  assert.equal(existsSync(join(root, "CNAME")), false);
});

test("repository contains no unexpected executable files", () => {
  const executableExtensions = /\.(?:exe|dll|dylib|so|app|command|bat|cmd|com|msi|pkg|dmg|sh|bash|zsh|fish|ps1|jar|class|pyc)$/i;
  const walk = (directory) => {
    for (const name of readdirSync(directory)) {
      if (name === ".git") continue;
      const path = join(directory, name);
      if (statSync(path).isDirectory()) walk(path);
      else assert.doesNotMatch(name, executableExtensions);
    }
  };
  walk(root);
});
