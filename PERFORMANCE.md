# Performance – AccessPath

Lighthouse audit done for session 22 (Performance & Testing).

## How we measured

- Production build, not the dev server: `npm run build && npm run preview` in `client/`, then `http://localhost:4173/`
- Chrome incognito window, no extensions
- DevTools → Lighthouse → Mode: Navigation, Device: Mobile, Categories: Performance + Accessibility
- Page audited: the home page of a `user` account (search form + map + list of places), logged in

## Before

| | Run 1 | Run 2 (same code) |
|---|---|---|
| Performance | 99 | **95** |
| Accessibility | 100 | 100 |
| First Contentful Paint | 1.5 s | 1.5 s |
| Largest Contentful Paint | 2.1 s | 2.1 s |
| Total Blocking Time | 0 ms | 0 ms |
| Cumulative Layout Shift | 0 | **0.115** |
| Speed Index | 1.5 s | 1.5 s |

The score was not stable: the same code gave 99 once and 95 another time. Opening the
Insights explained why.

**1. Layout shift culprits: `main.main`, 0.115.**
After a refresh the app only has the token from localStorage. The menu in the header
(Places, AccessFix, My requests, Log out) is only drawn when `/api/auth/me` answers.
On a phone the menu takes two lines, so when it shows up it pushes the whole page down.
How much it counts depends on how fast the API answers, which is why the CLS changed
from one run to another.

**2. Improve image delivery: 96 KiB could be saved.**
The images listed were not our photos but the map tiles from MapTiler, sent as PNG
(266 KiB for the tiles on screen). Lighthouse suggested a modern format like WebP.

## Fixes

1. **Keep the user next to the token** (`client/src/auth/AuthContext.jsx`).
   On login and signup the `user` object is saved in localStorage, and removed on logout.
   After a refresh the header is drawn complete from the first paint, so nothing moves.
   The role stored there only decides which menu to show; the server still checks the
   token and the role on every request.

2. **Map tiles in WebP** (`client/src/components/PlacesMap.jsx`).
   The tile URL ends in `.webp` instead of `.png`. MapTiler supports png, jpg and webp
   for raster tiles, the map looks the same.

3. **Place photos at the right size** (`client/src/api/upload.js`, `PlacesPage.jsx`, `PlacePage.jsx`).
   The cards were loading the original photo from Cloudinary (often several MB) to show it
   400 px wide. `sizedPhoto()` adds `w_…,f_auto,q_auto` to the Cloudinary URL so we get a
   resized WebP. The cards also have `width`/`height` and `loading="lazy"` because they are
   below the search form. The gallery at the top of a place page is not lazy, since it is
   the first thing you see.

## After

| | Before (run 2) | After |
|---|---|---|
| Performance | 95 | **99** |
| Accessibility | 100 | 100 |
| First Contentful Paint | 1.5 s | 1.5 s |
| Largest Contentful Paint | 2.1 s | 2.1 s |
| Total Blocking Time | 0 ms | 0 ms |
| Cumulative Layout Shift | 0.115 | **0** |

The number that moved is the CLS: the page no longer jumps when it loads, and the score
stays at 99 instead of going up and down.

## What we tried and dropped

Before reading the Insights we tried **code splitting** from the slides
(`lazy(() => import(...))` + `<Suspense>` on every route). The build changed as expected:
the main JS file went from 438 kB to 267 kB, with one small file per page.
But on this page the score went down to 97 (LCP 2.1 s → 2.3 s). The browser now had to
download `index.js`, then the page file, then the map file, one after the other, and the
screen showed "Loading…" before the page. We also tried keeping the home page eager and
only lazy-loading the map: still 97.

For a small app like ours, one bundle is faster on the page people open first, so we
went back to it. Lesson: measure first, read what Lighthouse actually points at, then fix that.
