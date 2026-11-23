// One-time migration helper: downloads the church's photos from the old Wix site,
// resizes them (Wix serves a resized copy; the PNG originals are ~28 MB each),
// and writes data/images.json with dimensions + blur placeholders.
//
// Run:  node scripts/fetch-images.mjs
// Re-runnable: files that already exist are skipped (delete a file to refetch it).
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const PUB = path.join(ROOT, "public", "images");
const MEDIA = "https://static.wixstatic.com/media/";

const SITE = {
  "hero-church": "f0da2d_af95956cdb3748a4b8f2957db23b6e9f~mv2.jpg",
  "new-church-1": "f0da2d_c2bd0ea7464b46ca8343c9a7ffa2c349~mv2.jpg",
  "new-church-2": "f0da2d_b67bd7143d3f4159b1b04dc117ee1f86~mv2.jpg",
  "new-church-3": "f0da2d_6184da00ead04f98918854b9b4aebf49~mv2.jpg",
  "bishop-peter": "f0da2d_8711eb8dc77d4183bfb0707515442894~mv2.jpg",
  "donate-banner": "1cd9eba76a294db7befc9b890490d7f6.jpg",
};

// The circular diocesan crest (header, footer, apple-touch-icon) and the church's existing
// favicon (a Coptic cross, kept as the browser tab icon for continuity).
const LOGO = "f0da2d_f61c2da4ae3b4bd287e77138c2a9eb87~mv2.jpg";
const FAVICON = "f0da2d_e6c6c51b4713464dae1e19669ec03fb7~mv2_d_2000_2000_s_2.png";

// Album order and photo order match the live Gallery page (52 photos).
const GALLERY = JSON.parse(
  await fs.readFile(path.join(import.meta.dirname, "gallery-source.json"), "utf8"),
);

async function download(id, dest, { width = 1800, ext = "jpg" } = {}) {
  try {
    await fs.access(dest);
    return false;
  } catch {
    /* not downloaded yet */
  }
  const url = `${MEDIA}${encodeURIComponent(id)}/v1/fit/w_${width},h_${width},q_82/photo.${ext}`;
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(url);
    if (res.ok) {
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()));
      return true;
    }
    if (attempt === 4) throw new Error(`${res.status} ${url}`);
    await new Promise((r) => setTimeout(r, 500 * attempt));
  }
}

async function describe(file) {
  const img = sharp(file);
  const { width, height } = await img.metadata();
  const blur = await img.resize(10).jpeg({ quality: 40 }).toBuffer();
  return {
    width,
    height,
    blurDataURL: `data:image/jpeg;base64,${blur.toString("base64")}`,
  };
}

async function pool(items, size, fn) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (queue.length) await fn(queue.shift());
    }),
  );
}

const manifest = { site: {}, gallery: [] };

// Site photos
await pool(Object.entries(SITE), 4, async ([key, id]) => {
  const rel = `site/${key}.jpg`;
  const file = path.join(PUB, rel);
  await download(id, file, { width: key === "hero-church" ? 1200 : 1800 });
  manifest.site[key] = { src: `/images/${rel}`, ...(await describe(file)) };
});

// Crest: trim the logo's white margin, square it, and mask it to a clean circle with a
// transparent background so it sits on any colour.
async function original(id) {
  const res = await fetch(`${MEDIA}${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`${res.status} ${id}`);
  return Buffer.from(await res.arrayBuffer());
}
const logo = await original(LOGO);
const trimmed = await sharp(logo).trim({ threshold: 14 }).toBuffer({ resolveWithObject: true });
const side = Math.min(trimmed.info.width, trimmed.info.height);
const square = await sharp(trimmed.data)
  .extract({
    left: Math.floor((trimmed.info.width - side) / 2),
    top: Math.floor((trimmed.info.height - side) / 2),
    width: side,
    height: side,
  })
  .resize(512, 512)
  .toBuffer();
const circle = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><circle cx="256" cy="256" r="254"/></svg>');
const crestPng = await sharp(square).ensureAlpha().composite([{ input: circle, blend: "dest-in" }]).png({ compressionLevel: 9 }).toBuffer();
await fs.mkdir(PUB, { recursive: true });
await fs.writeFile(path.join(PUB, "crest-seal.png"), crestPng);
manifest.site.crest = { src: "/images/crest-seal.png", width: 512, height: 512, blurDataURL: "" };

// App icons: keep the church's original cross favicon for tabs; crest on vellum for home screens.
await sharp(await original(FAVICON)).resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(path.join(ROOT, "app", "icon.png"));
await sharp({ create: { width: 180, height: 180, channels: 4, background: { r: 246, g: 238, b: 219, alpha: 1 } } })
  .composite([{ input: await sharp(crestPng).resize(150, 150).toBuffer(), gravity: "center" }])
  .png()
  .toFile(path.join(ROOT, "app", "apple-icon.png"));

// Gallery
const jobs = [];
GALLERY.forEach((album, a) =>
  album.photos.forEach((id, i) => jobs.push({ a, i, id, album })),
);
const results = new Map();
await pool(jobs, 6, async ({ a, i, id }) => {
  const rel = `gallery/a${a + 1}-${String(i + 1).padStart(2, "0")}.jpg`;
  const file = path.join(PUB, rel);
  await download(id, file, { width: 1800 });
  results.set(`${a}:${i}`, { src: `/images/${rel}`, ...(await describe(file)) });
});
manifest.gallery = GALLERY.map((album, a) => ({
  slug: album.slug,
  title: album.title,
  dateLabel: album.dateLabel,
  photos: album.photos.map((_, i) => results.get(`${a}:${i}`)),
}));

await fs.mkdir(path.join(ROOT, "data"), { recursive: true });
await fs.writeFile(path.join(ROOT, "data", "images.json"), JSON.stringify(manifest, null, 1) + "\n");
const total = manifest.gallery.reduce((n, g) => n + g.photos.length, 0);
console.log(`site images: ${Object.keys(manifest.site).length}, gallery photos: ${total}`);
