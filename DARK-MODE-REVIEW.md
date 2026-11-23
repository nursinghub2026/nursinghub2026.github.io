# Shared dark mode review

Review-only frontend change. No backend deployment, data updates, broadcasts or account changes.

## Changes

- Every HTML entry uses the same saved-theme initializer before the page body, including admin and the file-viewer shell.
- Shared semantic tokens separate text, surfaces, borders, accent text and button fills. Brand gradients no longer double as low-contrast text colors.
- Fixes attachments and download buttons, prayer lists and detail sheets, tips, progress, student cards, announcement editor and audience controls, chat, forms, admin panels and notification design controls.
- Admin has a theme switch on both login and dashboard. The existing student menu switch remains available. Theme changes persist and sync across tabs.
- Solid modal surfaces, readable placeholders and native select options, clear focus rings, new offline-cache revision.
- Media, notification canvases and lesson iframe documents are not inverted or forcibly recolored. Externally authored lesson HTML and third-party player interfaces need their own theme support. The file-viewer loading/error shell follows the site theme.

## Verification

- 24 automated tests pass, including saved-theme initialization, switching, cross-tab sync, unavailable storage, per-page includes, offline assets and semantic text-pair contrast.
- Local browser fixtures cover all 12 HTML pages and 36 rendered page/tab/modal states at390px in dark and light modes. No automated axe-core4.10.3 color-contrast violations, JavaScript errors or horizontal overflow in those runs.
- Same36 dark-mode states checked at320px and1280px.
- Attachment regression uses the existing Asepsis lecture metadata without changing it: filename, size and download label are readable at320/390/1280. No contrast violation in the attachment card. Approximate computed contrast: filename8.4:1, size6.3:1 and download label11.5:1 against the raised surface.
- Screenshots visually inspected for cards, files, tabs, video/flashcards, navigation, account and post modals, prayer content and admin.

Automated checks do not certify every pixel or all WCAG requirements. Gradients, text in images, third-party embeds and browser-native media controls can require manual review. No live student account or admin mutation was used. UI review used fictional local fixtures; the Asepsis screenshot uses read-only existing lecture metadata. Backend V2 capability gates are unchanged.

## Follow-up phone and picker review

Suggestions now uses shrinkable grid tracks and controls. Bounding rectangles, not only scroll width, checked at360/390/412 in both themes so RTL off-screen clipping is caught. Post targeting immediately shows the full active-account checkbox list, with optional search and selection count. Notification targeting immediately shows an account list too: push-registered accounts remain selectable, other registered accounts are shown disabled. No send eligibility or broadcast behavior changed.

## Interactive controls follow-up (review only)

- Explicit dark backgrounds and strong control edges for ghost buttons, icon buttons, inputs, flashcards, selects, navigation links and disabled controls. Added hover, active and keyboard-focus states, including the hidden suggestion radio tiles.
- Fixed previous/next lecture links, iOS install sheet, loading skeletons, completed badges, gold admin icons, post preview and suggestion reply surfaces.
- Logos use the owner's selected separate dim-pearl badges. Official JPEG artwork stays unchanged; no color inversion or rejected transparent/halo treatment.
- Phone file-provider bytes are read immediately on selection and reused when saving. Read failures preserve the draft and offer removal of only the newly selected file, allowing existing text/media edits to save. No backend change.
- V1 admin post hide action is labeled 'delete from display', with confirmation that its stored copy and attachments remain recoverable. Full trash/restore still requires separately approved V2 activation.
- 28 unit tests pass. Local browser regression confirms V1 text-only edits preserve old media without reupload, a new selected file is read only once, and a failed read causes no save/upload request before removal and successful text-only save.
- 42 dark and light page/tab/modal states at390px have zero automated text-contrast violations, runtime errors or horizontal overflow. The dark control-state inventory sampled393 controls across42 states in default/hover/active/focus/disabled modes (1965 computed-state samples), with no missing focus outline or neutral bright control surface flagged. These are bounded automated checks, not WCAG certification. Native controls, authored image text and external iframe content retain their own rendering.
