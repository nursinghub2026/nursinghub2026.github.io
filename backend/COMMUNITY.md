# Community posts, source only, NOT ACTIVATED

New standalone page `community.html`, reachable from More. Admin dashboard includes a separate posts manager. No automatic push notification is connected. The page safely shows a pending-activation message when the server does not support these routes.

## Separate activation after explicit owner approval
- Read and back up every current live Apps Script source, properties and deployment/version first.
- Add `Community.gs` as a new file. Inside the existing `doPost` lock, after parsing `req` but before its old admin-password gate, add:
  ```js
  var communityResult = routeCommunity_(req);
  if (communityResult !== null) return json(communityResult);
  ```
- Keep all current handlers, properties and sheets. Do not run old setup/migration functions. The new module reads the existing Students sheet without modifying it and uses column names, not a token-column guess.
- New sheets, created only on first relevant save: `CommunityPostsV1`, `CommunityCommentsV1`, `CommunityReactionsV1`. All writes append immutable revisions. No row deletes, source-file changes or edits to lecture/file data.
- Publish a new version on the existing deployment only after permission. Keep the old version for rollback. This PR changes no live script or sheet by itself.

## Behavior and privacy
Admin writes and edits posts with six-digit hex background/text colors, three allowlisted font treatments and three text sizes (18/24/30). No arbitrary CSS, HTML, images, remote fonts or script. Avoid low-contrast colors, checked in preview before publishing. Maximum 4000 characters. Hiding appends a revision; it does not delete historical rows.

Posts and comments are readable by all page visitors, so the composer tells students their display name and comment are visible to visitors. Comment/reaction requires a valid active, unexpired server-verified session. Client-supplied student identity/name is ignored. Responses never contain usernames, tokens, password hashes, email, progress or other account fields. Reaction counts and the current student's own choice are returned, not a list of reacting students. Public display names are snapshotted when commenting.

Comments: maximum 600 characters, at least 15 seconds apart, maximum 60 per student per rolling 24 hours. Reactions: one active reaction per student/post, clicking it again removes it, a different emoji replaces it; at least 2 seconds between changes and maximum 300 changes per 24 hours. Limits are checked against persistent append-only logs under the existing script lock, not only browser timeouts. Five supported emoji. Up to 1000 posts and 1000 visible comments per post. The feed pages ten posts at a time and shows the latest 50 comments per post with a visible count; no hidden claim of showing every historical comment. Admin can remove comments from public view and restore them; originals remain in private append-only storage. Server control text never instructs the assistant or browser to execute anything.

Rate limits are basic protection, not a full spam or abuse service. At large scale, spreadsheet reads and Apps Script quotas become a limit; quota errors fail without upgrading anything. No paid service or billing change.

## Verification
`node --test tests/*.test.cjs` covers admin authorization, active session checks, persisted rate limits, append-only edits, safe style validation, moderation, reaction counts and private-field exclusion. Browser mock tests cover guest/signed-in rendering, no HTML execution, compose/reaction flows, admin editor/moderation, empty/unactivated states, and widths 320/390/1280. No real comments, notifications, student sessions or live-sheet writes are used.

## Coexistence with theory PR
This PR is based on current main, separate from theory-audio-flashcards. Both add stylesheet/script tags to admin.html and cache entries to sw.js. If Git reports a merge conflict, preserve both modules and all precache entries, and choose a fresh cache version. Do not replace one feature with the other.

## Social-post visual update
Posts now have a round FOUNDATIONS avatar, author/time/public visibility header, colored text body, optional image, reaction/comment totals, Like/Comment action row, selectable reaction tray, comment bubbles and composer. The Like action opens the reaction tray; no external Facebook connection, tracking, sharing or account access is involved. Existing navy/gold branding stays. Admin-only optional images accept existing direct HTTPS Cloudinary PNG/JPG/WebP URLs only; no upload or new paid service. SVG, arbitrary hosts and script URLs are rejected server-side and by the renderer. Images load only for published posts shown in the feed; external hosting still sees normal image requests. No image is added automatically or taken from a person's profile.

## Multiple media (source only)
Admin can add up to 8 extra attachments per post, in addition to the optional primary image. Each has a type, label, HTTPS URL and remove-from-draft control. Images are existing Cloudinary PNG/JPG/WebP links. Video accepts YouTube watch/short URLs, Drive file links and direct Cloudinary MP4/WebM. Files open shared Drive links separately. No arbitrary embed HTML, arbitrary file hosts, SVG, script URLs, local upload, media deletion or automatic account sharing is involved. The server validates the full list before append. Hide/restore preserves the attachments.

Video players do not autoplay. YouTube uses nocookie; YouTube/Drive frames connect only after a click. Cloudinary video uses native controls and no preload. Images load as normal external resources when their post appears. External services receive normal request information; do not attach private student content. Drive permissions and YouTube availability must be checked on the intended real content after activation. Unlisted is not private, and the UI does not change sharing permissions. File content/playback is not audited by accepting a URL.

This code adds no paid service and never upgrades a plan. Free Cloudinary storage/bandwidth quotas still apply; this version links existing media instead of uploading large files. Drive/YouTube can have access, storage, playback, quota or policy restrictions. No unlimited hosting or guaranteed ad-free playback is promised. Real media playback and private-file permissions have not been tested with an owner's asset yet.
