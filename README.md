# Captured by Karmen portfolio pilot

This repository contains the public pilot for Captured by Karmen Photography, a Rogers Holdings Company.

The pilot is intentionally limited:

- Search indexing and crawling are blocked.
- Six watermarked portfolio positions remain empty pending quality and public-use permission review.
- Session questions use `cbk@rogersholdingsllc.com`; all messages and scheduling are parent-managed. The homepage collects no inquiry data and has no inquiry form or backend.
- The separate `/permission/` route is the existing Photo & Media Release flow, not a booking or inquiry form. It remains unchanged.
- The homepage has no analytics, tracking, payment, automated scheduling, advertising, or third-party runtime assets.

## Local review

```sh
npm test
python3 -m http.server 4173 --bind 127.0.0.1
```

Then open `http://127.0.0.1:4173/`.

## Deployment

GitHub Pages deploys the static source through `.github/workflows/pages.yml`. The live site is https://capturedbykarmen.rogersholdingsllc.com/.
