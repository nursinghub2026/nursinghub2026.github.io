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
