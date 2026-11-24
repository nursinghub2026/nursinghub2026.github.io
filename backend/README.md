# Push backend

## PrayerReminders.gs (prayer-time reminders), activation note

Adds admin-controlled prayer reminders for Port Said (Dar Al-Ifta Egypt GetPrayer endpoint as primary source, refreshed daily, with automatic fallback to the Aladhan free API using the Egyptian General Authority of Survey method; cached daily). Activation after approval, backup first: add `PrayerReminders.gs` to the live project, add three lines to the route map in the live Students.gs (`adminPrayerGet`, `adminPrayerSet`, `adminPrayerTest` mapped to their `_` functions with the same typeof guard as `adminPushSend`), publish a new version, then run `prayerInstallTrigger_()` once from the editor to create the 5-minute time trigger. Safe by default: enabled=false and testMode=true, so nothing reaches students until the admin turns the master switch on AND turns test mode off; every test send goes to the admin account constant in the file, never to a client-chosen user. Duplicate sends are prevented per prayer per day in Script Properties.

## adminPushLog (read-only delivery log), activation note

This copy of `Push.gs` adds `adminPushLog_`, which returns the 20 newest PushLog rows for the admin composer history card. It reads only; it never writes or deletes. Activation after approval: back up the live files, add the same function to the live Push.gs, add one line to the route map in the live Students.gs (`adminPushLog: (typeof adminPushLog_ === 'function') ? adminPushLog_ : null,` next to `adminPushSend`), and publish a new version on the existing deployment. Until then the admin history card hides itself and the composer keeps working exactly as before.

`Push.gs` is a backup of the notification-only Apps Script file, with the system notification appearance settings for this PR. No lecture or sheet data is changed.

## Deployment notes, not deployment authorization

The badge image must be live first. Back up the current Push.gs, apply the `webpush.notification` options from this file, and publish a new Apps Script version on the existing deployment. Keep the existing FCM_SA property private. Do not put its value in this repository.

Check the current live version and the owner's instructions before any deployment. This repository is a source copy, not proof of live state or approval. Custom image hosting is not configured by this PR; see [CUSTOM-IMAGES.md](CUSTOM-IMAGES.md).

## System notification appearance

- 512 px navy/gold F icon, separate monochrome F badge.
- Clear Arabic title and body, RTL and Arabic language.
- Short double vibration where supported.
- Unique tags by default; a supplied data.tag groups related updates with renotify.
- Same-origin destination carried in notification data and FCM fcm_options.link.
- Four 2:1 navy/gold Arabic banner images, selected by type: lecture, quiz, reply, motivation.
- FOUNDATIONS is automatically prefixed to the system title. The body remains readable without the image.
- Notification payloads are displayed by Firebase once; the worker only displays data-only messages itself.

Android/browser control the final system layout, font, colors, image size and vibration settings. The site cannot make an OS notification look like its in-page card.

## Admin controls
The admin writes the notification title and body and chooses lecture, quiz, reply, motivation, or no image. Selection never overwrites typed words. A live approximate preview shows the result. Ready-made banner art contains a fixed category heading. The custom image studio adds editable in-image text and an optional local background. Custom sends require server-side image hosting setup and remain blocked until available. The server accepts a validated PNG, never an arbitrary image URL.

## Optional new-publication notices
New lecture and new content forms have an unchecked-by-default notice option. If enabled, editable title/body/banner are sent only after successful save, using adminPushSend. Draft lectures cannot send. Existing edit forms do not send. A push failure never repeats or rolls back the save, and a manual retry warns about possible duplicate delivery.

The notification destination is allowlisted to index.html, Lectures.html, or Lecture.html with an encoded ID. Apply the small Push.gs destination change after backing up the current file and publish a new backend version. Until that publication, notices still open the homepage. Tests use mocked saves and push responses, never real lecture/file/sheet data.

## Notifications inbox (feat/notification-inbox)

Adds an in-site notifications inbox: a gold bell in the side navigation of every nav page opens a navy/gold panel that lists everything the admin posts through the notification composer (PR #31), newest first, with an unread badge and per-student read state. Pairs with the composer: every send is also stored in the inbox sheet, so a student who missed or dismissed the system notification can still read it in the site.

Student side is `notification-inbox.js` + `notification-inbox.css` (self-mounting bell + panel, script tag wired into the 10 nav pages). Backend is `backend/NotificationInbox.gs`, with a guarded append call added to the composer send path in `backend/Push.gs`. All storage is additive: two new sheets, `InboxNotifications` (one row per sent notification) and `InboxReads` (one row per student per notification when read). No existing sheet, file, or route is changed.

### Activation, after approval

1. Back up the live Apps Script files.
2. Add `NotificationInbox.gs` to the Apps Script project as a new file, unchanged.
3. In the live `Push.gs`, inside the composer send function, after the push log append, add the guarded inbox append (exact diff in this branch's `backend/Push.gs`).
4. In the live `Students.gs` route map inside `routeStudents_`, add two typeof-guarded lines next to the existing student routes:
   - `stuInboxList: (typeof stuInboxList_ === 'function') ? stuInboxList_ : null,`
   - `stuInboxRead: (typeof stuInboxRead_ === 'function') ? stuInboxRead_ : null,`
5. Publish a new version on the existing deployment.

Until activation, the bell still appears for signed-in students and the panel shows its empty state; reads and history start working once the routes are live. `stuInboxList_` returns the 30 newest notifications with per-student read flags; `stuInboxRead_` marks one or all as read. Nothing is ever broadcast by this PR itself: only notifications the owner sends through the composer create inbox rows.

## Per-prayer and per-category notification images (feat/notification-prayer-images)

Nine hosted banners under `notification-images/`: one per prayer (`prayer-fajr/dhuhr/asr/maghrib/isha.png`) and one per composer library category (`salawat.png`, `hadith.png`, `dua.png`, `encouragement.png`). All 1200x600 PNG, navy/gold, drawn for this project (no stock, no people, no copyrighted assets). Cairo font from Google Fonts (OFL) used at generation time only.

- `PrayerReminders.gs`: `prayerSend_` takes an optional image key; the tick and the admin test pass the prayer name, so each prayer notification carries its own image. Falls back to the motivation banner when no key is given.
- `Push.gs`: the banner whitelists (send validation + kind resolution) accept `salawat`, `hadith`, `dua`, `encouragement`. Resolution stays `notification-images/<kind>.png`.
- `admin.html`: the composer image select offers the four new kinds; picking a library preset selects its category image automatically (the admin can still change it before sending).

Activation after approval: back up the live files, apply the `PrayerReminders.gs` and `Push.gs` changes from this branch, publish a new version on the existing deployment. Until then, prayer notifications keep the motivation banner and composer sends of the new kinds fall back safely (unknown kinds resolve to `lecture` on the old whitelist, so no breakage, just the wrong image — apply the backend before using the new kinds).

## Scheduled daily reminders: adhkar, salawat, hadith, du'a, encouragement (feat/auto-adhkar)

`backend/AutoAdhkar.gs` adds admin-configurable automatic reminders from the site's own sourced content library. Six categories (morning adhkar, evening adhkar, salawat, hadith, du'a, encouragement), each with its own toggle and per-day count (1-5). Sends only between Fajr and Isha using the day's stored prayer times (fixed fallback window if missing); morning adhkar only before Dhuhr, evening adhkar only after Asr. A persisted per-category pointer rotates through the content without repeats until the whole category is used. Minimum 90 minutes between sends of the same category. Every automatic send also lands in the bell inbox as a guaranteed fallback.

Safety defaults: `enabled=false`, `testMode=true` (sends only to the admin account `abdelrhman.wae1`). The time-driven trigger (every 30 minutes) is installed when the admin enables the feature from the new admin card and deleted when disabled. Nothing reaches students until the admin turns test mode off himself after testing on his own account.

Admin card in `admin.html` (التذكيرات التلقائية): master enable, test-mode toggle, per-category toggle + daily count + an instant test send that always goes to the admin account only.

### Activation, after approval

1. Back up the live Apps Script files.
2. Add `AutoAdhkar.gs` to the Apps Script project as a new file, unchanged.
3. In the live `Students.gs` route map inside `routeStudents_`, add five typeof-guarded lines next to the existing admin routes:
   - `adminAutoGet: (typeof adminAutoGet_ === 'function') ? adminAutoGet_ : null,`
   - `adminAutoSet: (typeof adminAutoSet_ === 'function') ? adminAutoSet_ : null,`
   - `adminAutoTest: (typeof adminAutoTest_ === 'function') ? adminAutoTest_ : null,`
   - `adminAutoContent: (typeof adminAutoContent_ === 'function') ? adminAutoContent_ : null,`
   - `adminAutoImage: (typeof adminAutoImage_ === 'function') ? adminAutoImage_ : null,`
4. For the prayer card's per-prayer image controls, update the live `PrayerReminders.gs` and `PushImages.gs` from this branch (both add-only: new optional `images` config, `adminPrayerImage_`, and a raised upload cap) and add one more route line:
   - `adminPrayerImage: (typeof adminPrayerImage_ === 'function') ? adminPrayerImage_ : null,`
   Existing live prayer config (`enabled`/`testMode`/`prayers`) is preserved: the new `images` field defaults to the original per-prayer images, so nothing students see changes until the admin picks otherwise.
5. Publish a new version on the existing deployment.
6. Enable from the admin card; this installs the trigger. Rollback: disable from the card (removes the trigger), or redeploy the previous version.

Admin card extras in `admin.html`: per-category expander with notification preview, per-category text editing (new `AutoContent` sheet, created on first save only; falls back to the built-in sourced library, resettable), per-category image choice (original / ready-made / none / custom upload via the same Cloudinary path as the composer), and per-category recurrence (`gapMin` 30–720 minutes, default 90). The prayer card gets the same refined design with per-prayer enable, image choice, preview and his-account-only test.

Until activation the admin card stays hidden (its load call fails silently), exactly like the prayer card before its backend shipped.

## Push enable resilience + diagnostics (fix/push-enable-resilience)

Frontend (`push.js`): first-visit prompt card (one tap, dismissible, once per device), auto-heal re-registration when permission was granted but no token saved, persistent error state with retry, iOS "install the PWA first" guidance, in-app-browser "open in Chrome/Safari" hint. Admin (`admin.html`): token coverage counts (enabled / not yet / total students) in the push section.

Backend (additive):
- `Push.gs`: `stuPushAttempt_` + append-only `PushAttempts` sheet (`ts, username, stage, message, ua`) — client logs why enabling failed per device. Auth optional so "سجل دخولك الأول" cases still get logged.
- `PrayerReminders.gs`: prayer reminders also append to the bell inbox (`inboxAppend_`, guarded) — an in-site fallback for students without tokens.

Activation after approval: back up live files; update `Push.gs` and `PrayerReminders.gs`; add one typeof-guarded route line for `stuPushAttempt` to the `routeStudents_` map; publish a new version. Rollback: revert the deployment.

## Prayer tick window matching (fix/prayer-tick-window)

Bug found 2026-11-24 after the user reported zero notifications: `prayerTick_` only sent when the current HH:mm exactly equaled the prayer time, but the 5-minute trigger fires at a fixed phase (minutes ≡ 3 mod 5 on this project), so any prayer time not ending in 3 or 8 was silently skipped forever (Fajr, Asr, Maghrib, Isha).

Fix: window matching — a prayer fires when it is 0–30 minutes past its time and has not been sent today (dedupe via new `PRAYER_SENT_V2` script property, per prayer per day; legacy `PRAYER_LAST` record is migrated so an already-sent prayer is not repeated). Send lands 2–6 minutes after the adhan instead of never. Also brings the repo in line with the approved live v30 wording, which previously existed only in the live project.

Activation after approval: back up the live files, paste `PrayerReminders.gs` from this branch over the live one, publish a new version. The existing 5-minute trigger stays; nothing else changes. Rollback: re-paste the backup and publish.
