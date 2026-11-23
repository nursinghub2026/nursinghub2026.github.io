# Social controls and display-name editing, review only

No live script, property, deployment, student account or post is changed by this branch. Frontend capabilities stay disabled until the reviewed backend reports support.

## Proposed activation, requires separate approval

1. Back up the current Apps Script source, properties and deployment/version and all Community and Students data. Inspect the current handlers, not an old local copy.
2. Review the updated Community.gs and add the new StudentProfile.gs module. Keep every existing handler, sheet and property. Do not run old setup/migration functions.
3. Inside the existing doPost write lock, dispatch `routeStudentProfile_(req)` before Community dispatch and before the legacy stuSetName handler. Return a non-null result. This ordering is mandatory: it prevents older clients from bypassing the new name-change limit through stuSetName. Community dispatch must likewise remain inside that lock.
4. Name override is read through cpStudent_ for new comments and the new profile endpoint. Existing Students rows and legacy login records stay unchanged. auth.js refreshes the display name through the new endpoint on account open and login sync. Existing comment names remain snapshots, not retroactively rewritten. Other legacy admin screens may continue showing the original registration name; the audience selector uses the current display name.
5. Publish a version on the existing deployment only after explicit approval, preserving the previous version for rollback. Rolling the backend back removes the audience protection, so do not revert to a pre-V2 backend while targeted posts exist. First withdraw targeted posts with an audited append-only revision, or keep the V2 reader. A frontend rollback alone is safe: old save calls preserve an existing audience.
6. Test only with the owner's own authenticated account and owner-created test posts, never other real students or broadcasts. Local tests use fictional records, not live identities. No live tests have been run for these new controls.

## Audience and deletion

- Default audience is everyone, including logged-out visitors, preserving old posts.
- Admin can choose 1 to 100 active student usernames through a searchable name/account selector. A multi-selection is an explicit audience, not a persistent academic group. No phone-to-account guessing. Membership is tied to the immutable account username, not its editable display name.
- Server checks audience before feed paging, totals, direct-link results, comments or reactions. Nonmembers receive no post, comments, media URL, reaction counts or member list. Admin alone receives audience usernames. Guest/expired/blocked sessions cannot view a targeted post. Student status and token expiry are rechecked for each write/read.
- Targeted posts are text-only. Existing Cloudinary/Drive/YouTube URLs are not private. The server rejects image/media attachments on a targeted save; it does not claim to secure a copied URL. Links pasted inside text may independently be accessible outside the site. Persistent groups and access-controlled private media are out of scope until separately designed and approved.
- Delete means move to trash, append-only. The post and its comments/reactions disappear from student reads/writes; admin can restore the same post with its audience unchanged. No historical row or hosted asset is deleted. Existing hide/unhide, edit text/media, comment hide/restore, replies and attributed edits remain.
- Targeted names and student directory never go to guest/student responses. A shared targeted-post link does not grant permission.

## Name edit permission

- New StudentDisplayNamesV1 sheet contains only username, display name and timestamp. Each accepted change appends one row; Students remains read-only.
- Requires an active, unexpired server-verified session. Client cannot choose the account to change. Only action/token/name fields accepted. No username, password, role, status, progress or other permission is changed.
- Name is NFC-normalized, trimmed, repeated spaces collapsed, 3 to 60 characters. Unicode letters/marks, spaces, apostrophes and hyphens only; no links, markup, numbers, control or bidi-format characters. This is syntax validation, not identity verification or an offensive-name classifier.
- One changed name per rolling 24 hours, checked from persistent history under the existing write lock. Saving the same name is a no-op. Both the new endpoint and legacy stuSetName use the same rules after activation.
- UI updates local session name only after server success. The displayed account name is HTML-escaped. Name changes are not broadcasts and do not send notifications.

## User-visible layout and reliability

Normal Facebook-like layout is the default: author, audience/time, text above photo, reaction counts, reaction/comment/share buttons. Optional overlay requires V2 support. It is not a claim to duplicate every Facebook feature or every device's pixels.

Reactions update locally immediately, serialize changes per post, show pending state, restore on explicit rejection and reconcile uncertain network results by reading rather than toggling twice. A network or quota failure cannot be promised never to happen. After an uncertain write, the user may need Check status before another reaction. Large-scale Apps Script performance needs separate capacity work; no paid plan is enabled.

Upload then save remains one Publish press, with failure preserving the draft. Uploads use existing public hosting and no paid upgrade. Closing the draft can leave an unused public asset; nothing auto-deletes it.

## Verification

21 automated tests currently cover existing functionality plus audience exclusion from feeds, totals, direct links, comments and reactions; legacy-client audience preservation; trash/restore; no private member list in student responses; rejection of targeted media; own-name-only updates, old-route limit, invalid/expired sessions, validation, no-op and immutable history. Browser fixtures and screenshots cover mobile layout and capability gating. Source-only tests do not establish live activation.
