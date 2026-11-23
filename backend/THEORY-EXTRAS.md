# Theory voice and flashcards, source only, NOT ACTIVATED

This PR adds two student tabs to theory lectures and an admin content block. Existing lecture/file lists, progress items and practical lectures are unchanged. Empty or unavailable backend responses show a non-blocking placeholder. Merging frontend files does not activate the backend.

## Separate activation, after review and explicit owner permission
1. Read and back up all current live Apps Script sources, properties and deployment version. Never copy secrets into GitHub.
2. Add the separate `TheoryExtras.gs` file. Inside the existing `doPost` lock, immediately after parsing `req` and before the existing admin-password gate, insert only:
   ```js
   var teResult = routeTheoryExtras_(req);
   if (teResult !== null) return json(teResult);
   ```
3. Keep every existing route, file and property. Do not run the old general `setup()` function, change column lists, or migrate existing sheets.
4. After approval, publish a new version on the existing deployment, preserving the prior version as the rollback target. No notification send is involved.
5. Public list requests read only published theory lecture IDs. Admin list/save/upload validate the existing admin password. New content creates only the new `TheoryExtrasV1` tab, lazily on first save. Rows are append-only revisions; hide and restore append a revision, never delete an earlier row or uploaded asset.
6. Test with mock data first. Any live write test needs separate permission and must use only the owner's account and designated test content. No broad student-account tests or broadcasts.

## Audio choice and limits
Use the existing Cloudinary free account, uploading signed server-side to `video/upload`, the documented resource type for audio. No billing or paid plan is added by this code. Existing account storage/bandwidth quotas still apply; a free plan is not unlimited, and a quota error stops the upload, not an automatic upgrade. Accepted files: MP3/M4A/OGG/WAV/WebM, maximum 8 MiB, extension plus file-header checks, 15 seconds between uploads, immutable unique asset IDs. Browser file selection and preview do not upload anything; the admin's Save action starts upload. Any audio on Cloudinary is accessible to anyone with its link. Do not upload private student information.

A direct existing Cloudinary audio link also works. A shared Drive file link opens in Drive in a new tab, rather than pretending its preview URL is a reliable audio stream. The admin must make that file viewable to intended students. A failed save after a successful upload retains the returned URL in the form for retry; it does not upload twice automatically. No delete-asset API is used.

## Rendering and safety
Student titles, descriptions, questions and answers use text nodes, never HTML. Questions are revealed with a keyboard-operable button and `aria-expanded`. Audio uses native controls and does not preload or autoplay. Public responses contain content only, no account records or credentials. New payloads are JSON strings in the new sheet, not formula-evaluated cells. Size and content lengths are checked again on the server. No notification is sent on save.

## Verification
`node --test tests/*.test.cjs` tests append-only revisions, hiding, admin authorization, public/draft boundaries, unchanged original lecture rows, URL validation and length rejection. Browser checks cover 320/390/1280, audio/card tabs, answer toggles, admin editors and an unactivated-server state using fake content. These checks do not upload a real file or write live sheets.

References:
- https://cloudinary.com/documentation/upload_parameters (audio uses resource_type=video)
- https://cloudinary.com/pricing (free plan, quota-limited)
