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

## Scheduled weekly/one-shot reminders (feat/scheduled-notices)

The admin writes reminders himself (title, body, banner, all students or one, Cairo time, optional weekly repeat); each fires as a push + an inbox row at its time. Storage is strictly append-only: `ScheduledNotices`, `ScheduledSends` (dedupe log), `ScheduledCancels` (cancel = new row, original untouched).

- `backend/ScheduledNotices.gs`: `adminSchedAdd_` / `adminSchedList_` / `adminSchedCancel_` / `adminSchedSet_`, `schedTick_` (5-minute trigger), `schedInstallTrigger_`.
- Sending is OFF by default (`SCHED_CFG.enabled=false`). Nothing reaches students until the owner flips the switch in the admin card himself. Occurrences older than a day are skipped, never back-sent.
- Admin UI: new card in `admin.html` under the prayer card with form, enable switch, and list with cancel.

Activation after approval: back up the live files; add `ScheduledNotices.gs` to the project; add four typeof-guarded lines to the `routeStudents_` map (`adminSchedAdd`, `adminSchedList`, `adminSchedCancel`, `adminSchedSet`); publish a new version; run `schedInstallTrigger_()` once from the editor. Rollback: revert the deployment and delete the trigger.
