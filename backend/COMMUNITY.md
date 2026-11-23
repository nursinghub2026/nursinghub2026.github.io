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
