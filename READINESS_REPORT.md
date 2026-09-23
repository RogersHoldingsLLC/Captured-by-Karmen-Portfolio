# Captured by Karmen — premium readiness pass

Date: September 22, 2026. All work remained local.

## Repository and preservation

- Repository: Captured by Karmen Portfolio (dedicated website repository).
- Initial branch: `main`; initial HEAD: `5c3607d56880d73f33dd8b49fee672cdb7da9279`; initial Git status clean.
- Local tracking branch created from the existing remote-tracking ref `origin/copy/reduce-supervision-repetition`. Current branch: `copy/reduce-supervision-repetition`; HEAD: `24ddb0f33a1add8ac37b95ca324c99a054ba7d5c`.
- The approved preview is a detached worktree at that same HEAD. Its uncommitted work was preserved in place. The approved supervision copy was already in the branch commits; the remaining preview watermark and test changes were transferred after verifying the destination matched the preview base.
- New dark/light watermark files match the approved preview hashes and are both 2172 × 724. Retired 06/08 assets were removed locally as in the preview and have no runtime references.
- Approved hero portrait and brush mask, release submission logic, release legal paragraphs and electronic agreement, robots.txt, package.json, and hosting workflow remain unchanged. Existing noindex/nofollow controls and adult-managed safeguards remain.
- No commit, push, PR, merge, publication, deployment, new dependency, integration, or portfolio photograph.

## Findings and changes

| Area | Finding | Result |
| --- | --- | --- |
| Hierarchy and client flow | Repeated inquiry calls to action suggested an available contact flow, while inquiries are closed. | Header and hero now say Availability / Session Availability; a concise hero notice states inquiries are closed. The ribbon leads to the session explanation. |
| Portfolio copy | The main button implied a finished portfolio. Placeholder captions were very small. | Button says Preview the Portfolio; captions increased from 0.68rem to 0.78rem. Six clearly reserved positions remain. |
| Contrast and consistency | Small white text on the rose ribbon and pale accent text lacked contrast. | Deep warm text on the existing rose ribbon, a cocoa button matching the other primary buttons, and darker eyebrow/step-number colors. |
| Mobile navigation | Toggle always announced Open navigation; Escape moved focus even when closed. | Toggle label follows its state. Escape closes and returns focus only for an open menu. |
| Permission layout | Decorative camera was clipped by a negative mobile margin. Review-column dividers shifted after full-width rows. | Smaller, fully contained mobile motif; consistent review-column gutters without position-dependent vertical dividers. |
| Permission accessibility | Focus outlines were faint, sticky-header offset was too short, and partial permission selection had no visible mixed mark. | Stronger rose focus outlines, 7rem anchor clearance, focusable skip-link destination, and a CSS mixed-state dash. Selection/submission logic is unchanged. |

## Validation

- Approved reconciliation baseline: `npm test` — 33 passed, 0 failed.
- Final full suite after the reset fix: `npm test` — 34 passed, 0 failed. The new behavioral regression fails against the original script and passes with the fix.
- `git diff --check` — passed.
- Browser checks with agent-browser: both routes loaded; no page or console errors observed. Measured document and body widths matched viewports at 320 × 568, 768 × 1024, and 1440 × 1000. Additional 375 × 812 mobile screenshots inspected.
- Inspected desktop/mobile homepage, permission layout, and release review screenshots. Portrait and brand asset hashes pass the existing tests.
- Mobile navigation: open/close accessible label and Escape focus return verified.
- Release form: blank review produces errors and focuses the first field; a local fictional example produces the correct review summary; Edit Details hides the summary and focuses the signer name; extended scope exposes the required date with existing bounds; partial selection displays a mixed-state mark.
- The browser tool did not populate the native date input with its fill command; the local review check assigned a synthetic ISO date through the DOM. Native date-picker interaction across browsers is not covered by this pass.
- No Sign & Submit action was taken; live receiver, private PDF creation, and confirmation page were not exercised. Browser inspection is not a complete accessibility or cross-browser certification.

## Remaining approvals, content, and blockers

1. Brian/Karmen must select real original portfolio photographs and approve quality, public-use permissions, captions, and alt text. Empty positions still dominate the mobile portfolio and cannot establish photographic credibility.
2. Adult-controlled contact details, availability, session offerings, pricing, delivery expectations, and inquiry handling need approval before opening inquiries. The About section remains general; a personal biography requires supplied/approved facts.
3. Confirm where the permission route belongs in the client journey before adding a prominent public call to action. It currently remains a separate route, not a booking method.
4. Release reset issue resolved in the authorized follow-up: reset synchronization now runs in the next task, after the browser restores native control values. The expiration field returns to hidden, empty, and optional; permission selections, mixed state, validation errors, and the visible review return to their fresh-load state. A regression test executes the actual release script with both click-style and programmatic reset ordering, including repeated partial/all-selection resets. Desktop and mobile browser checks matched the fresh-load form state. Submission logic, receiver URL, version, release HTML/legal terms, choices, and privacy controls were unchanged by this fix; no live submission was performed.
5. Live release/PDF evidence needs an explicitly authorized end-to-end check before claiming full production verification.
6. Keep inquiries closed, search indexing blocked, and publication/deployment blocked pending approval. No real portfolio additions, direct contact path, or third-party service should be enabled by this pass.

## Exact files changed relative to branch HEAD

Modified:
- `index.html`
- `assets/css/site.css`
- `assets/js/site.js`
- `permission/index.html`
- `permission/permission.css`
- `permission/permission.js` (reset timing only, authorized follow-up)
- `tests/site.test.mjs`

Added:
- `assets/images/brand/09-Captured-by-Karmen-Dark-Watermark.png`
- `assets/images/brand/10-Captured-by-Karmen-Light-Watermark.png`
- `READINESS_REPORT.md`

Removed (approved retired assets):
- `assets/images/brand/06-Captured-by-Karmen-Signature-Floral-Watermark.png`
- `assets/images/brand/08-Captured-by-Karmen-Light-Wordmark-Watermark.png`
