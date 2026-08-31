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
const liveBase = "https://rogersholdingsllc.github.io/Captured-by-Karmen-Portfolio/";

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

const icoDimensions = (path) => {
  const icon = readFileSync(join(root, path));
  assert.equal(icon.readUInt16LE(0), 0, `${path} has an invalid ICO header`);
  assert.equal(icon.readUInt16LE(2), 1, `${path} is not an icon`);
  const count = icon.readUInt16LE(4);
  return Array.from({ length: count }, (_, index) => {
    const offset = 6 + index * 16;
    return {
      width: icon[offset] || 256,
      height: icon[offset + 1] || 256
    };
  });
};

const requiredFiles = [
  "README.md",
  "package.json",
  "index.html",
  "assets/css/site.css",
  "assets/js/site.js",
  "assets/images/brand/captured-by-karmen-horizontal.png",
  "assets/images/brand/captured-by-karmen-primary.png",
  "assets/images/brand/captured-by-karmen-watermark.png",
  "assets/images/brand/captured-by-karmen-floral-accent.png",
  "assets/images/brand/Captured-by-Karmen-Cute-Camera-Transparent.png",
  "assets/images/hero/karmen-exact-white-shirt.png",
  "assets/images/hero/portrait-brush-mask.png",
  "assets/images/portfolio",
  "assets/images/social/captured-by-karmen-share.png",
  "favicon.ico",
  "assets/images/favicon/icon-192.png",
  "assets/images/favicon/icon-512.png",
  "assets/images/favicon/favicon-16x16.png",
  "assets/images/favicon/favicon-32x32.png",
  "assets/images/favicon/apple-touch-icon.png",
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

test("social share image exists, is correctly sized, and is referenced by metadata", () => {
  const sharePath = "assets/images/social/captured-by-karmen-share.png";
  const shareUrl = `${liveBase}${sharePath}`;
  assert.deepEqual(pngDimensions(sharePath), { width: 1200, height: 630 });
  assert.match(html, new RegExp(`<meta property="og:image" content="${shareUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}">`));
  assert.match(html, /<meta property="og:image:width" content="1200">/);
  assert.match(html, /<meta property="og:image:height" content="630">/);
  assert.match(html, new RegExp(`<meta name="twitter:image" content="${shareUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}">`));
  assert.match(html, /<meta name="twitter:card" content="summary_large_image">/);
});

test("favicon references resolve and include legible small-size variants", () => {
  const expectedIcons = new Map([
    ["assets/images/favicon/favicon-16x16.png", { width: 16, height: 16 }],
    ["assets/images/favicon/favicon-32x32.png", { width: 32, height: 32 }],
    ["assets/images/favicon/apple-touch-icon.png", { width: 180, height: 180 }],
    ["assets/images/favicon/icon-192.png", { width: 192, height: 192 }],
    ["assets/images/favicon/icon-512.png", { width: 512, height: 512 }]
  ]);

  for (const [path, dimensions] of expectedIcons) {
    assert.ok(existsSync(join(root, path)), `Missing favicon asset: ${path}`);
    assert.deepEqual(pngDimensions(path), dimensions);
    assert.equal(pngHasAlpha(path), true, `${path} must preserve transparency`);
  }

  for (const path of [...expectedIcons.keys()].slice(0, 3)) {
    assert.match(html, new RegExp(`href="${path.replaceAll("/", "\\/")}"`));
  }
  assert.match(html, /href="favicon\.ico" sizes="16x16 32x32"/);
  assert.deepEqual(icoDimensions("favicon.ico"), [
    { width: 16, height: 16 },
    { width: 32, height: 32 }
  ]);

  for (const icon of manifest.icons) {
    assert.ok(expectedIcons.has(icon.src), `Unexpected manifest icon: ${icon.src}`);
    assert.ok(existsSync(join(root, icon.src)), `Unresolved manifest icon: ${icon.src}`);
  }
});

test("favicon uses approved text-free floral artwork without a CK monogram", () => {
  assert.doesNotMatch(html, /captured-by-karmen-icon|favicon-48x48|favicon\.svg/i);
  assert.equal(existsSync(join(root, "assets/images/favicon/captured-by-karmen-icon.svg")), false);
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
  const hash = createHash("sha256")
    .update(readFileSync(join(root, portraitPath)))
    .digest("hex");
  assert.equal(hash, "6a4ee5c7a4fbbf3b31b48f1717db5546e4af3a2ad7f8769b25e494b0de7784d0");
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

test("brand and supervision requirements are present", () => {
  assert.match(html, /Captured by Karmen/);
  assert.match(html, />Photography</);
  assert.match(html, /Capturing moments\. Preserving memories\. ♡/);
  assert.match(html, /A Rogers Holdings Company/);
  assert.match(html, /All inquiries, scheduling, locations, and client communication are reviewed and coordinated by a parent or guardian\./);
  assert.doesNotMatch(html, /\bCK\b|CK monogram/i);
});

test("about section uses the approved cute camera brand asset and accessible decorative treatment", () => {
  const about = html.match(/<section class="section about-section"[\s\S]*?<\/section>/);
  assert.ok(about, "About section is missing");
  assert.match(about[0], />About Karmen</);
  assert.match(about[0], />behind the camera</);
  assert.match(about[0], /Photos that feel personal, not forced\./);
  assert.match(about[0], /class="about-camera-mark" aria-hidden="true"[\s\S]*?src="assets\/images\/brand\/Captured-by-Karmen-Cute-Camera-Transparent\.png"[\s\S]*?alt=""/);
  assert.deepEqual(pngDimensions("assets/images/brand/Captured-by-Karmen-Cute-Camera-Transparent.png"), { width: 637, height: 480 });
  assert.equal(pngHasAlpha("assets/images/brand/Captured-by-Karmen-Cute-Camera-Transparent.png"), true);
  assert.equal(
    createHash("sha256")
      .update(readFileSync(join(root, "assets/images/brand/Captured-by-Karmen-Cute-Camera-Transparent.png")))
      .digest("hex"),
    "8d344bdec8b07d625c8c70000d486fa0d1b99c14e8869aa3128881234dfe9a82"
  );
  assert.doesNotMatch(about[0], /captured-by-karmen-floral-accent\.png/);
  assert.match(about[0], /src="assets\/images\/brand\/captured-by-karmen-primary\.png"/);
  assert.match(about[0], /class="about-seal" aria-hidden="true"[\s\S]*?alt=""/);
  assert.match(about[0], /class="value-list" role="list" aria-label="Photography values"/);
  assert.doesNotMatch(about[0], /captured-by-karmen-icon-512|about-flourish|karmen-exact-white-shirt|<picture\b|<form\b/i);
  assert.match(css, /\.about-brush-rose/);
  assert.match(css, /\.about-brush-sage/);
  assert.match(css, /\.about-camera-mark/);
  assert.match(css, /\.about-camera-mark img[\s\S]*?width: 100%;[\s\S]*?height: auto;/);
  assert.doesNotMatch(css, /\.about-floral-mark/);
  assert.doesNotMatch(css, /\.about-flourish/);
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
  const watermarkPath = "assets/images/brand/captured-by-karmen-watermark.png";
  const watermarkHash = createHash("sha256")
    .update(readFileSync(join(root, watermarkPath)))
    .digest("hex");
  assert.equal(watermarkHash, "b3ee36874b1425bfdfcb872bd43ce7510b7b099b6a3f4d3bba9925d895784051");

  const slots = [...html.matchAll(/<figure class="portfolio-slot [^"]+" data-portfolio-slot="(\d{2})">([\s\S]*?)<\/figure>/g)];
  assert.equal(slots.length, 6);
  assert.deepEqual(slots.map((slot) => slot[1]), ["01", "02", "03", "04", "05", "06"]);
  for (const [number, markup] of slots.map((slot) => [slot[1], slot[2]])) {
    assert.match(markup, /src="assets\/images\/brand\/captured-by-karmen-watermark\.png"/);
    assert.match(markup, new RegExp(`Reserved portfolio image ${number}`));
    assert.match(markup, /Reserved for an approved original photograph/);
  }
  assert.equal(slots.filter((slot) => /src="assets\/images\/brand\/captured-by-karmen-watermark\.png"/.test(slot[2])).length, 6);

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
