# SRI PVT LTD — Mobile Performance Update

This build is optimized around the Lighthouse mobile findings supplied for the site.

## Changes
- Removed Google Fonts as a render-time dependency; the site now uses fast system font stacks.
- Kept the hero asset as the high-priority above-the-fold image and added intrinsic dimensions.
- Deferred Firebase/Firestore network work until the browser is idle so remote content does not compete with the first paint.
- Kept Firebase content cached locally for repeat visits.
- Added `content-visibility:auto` and intrinsic sizes to below-the-fold sections to reduce initial rendering work.
- Added responsive mobile hero sizing and tighter mobile layout rules.
- Added intrinsic dimensions/aspect-ratio behavior to reduce layout shifts.
- Preserved lazy loading for below-the-fold images and the map.
- Added reduced-motion handling.

## Important
The Firebase configuration is retained from the supplied site. Update `config.js` with production contact details before deployment.

## Validation
Run Lighthouse in Chrome on the production URL using the same Moto G Power / Slow 4G profile. Compare FCP, LCP, CLS and Speed Index against the original report.
