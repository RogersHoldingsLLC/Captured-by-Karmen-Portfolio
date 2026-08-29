# Captured by Karmen portfolio pilot

This repository contains the public pilot for Captured by Karmen Photography, a Rogers Holdings Company.

The pilot is intentionally limited:

- Search indexing and crawling are blocked.
- Portfolio selections are withheld pending quality and public-use permission review.
- Inquiry availability is closed until an adult-controlled contact method is approved.
- No form, analytics, tracking, payment, scheduling, advertising, or third-party service is connected.

## Local review

```sh
npm test
python3 -m http.server 4173 --bind 127.0.0.1
```

Then open `http://127.0.0.1:4173/`.

## Deployment

GitHub Pages deploys the static source through `.github/workflows/pages.yml`. No custom domain is configured.
