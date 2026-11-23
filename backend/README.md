# Push backend

`Push.gs` is a backup of the notification-only Apps Script file, with the system notification appearance settings for this PR. No lecture or sheet data is changed.

## Deploy after the site PR is merged

The badge image must be live first. Back up the current Push.gs, apply the `webpush.notification` options from this file, and publish a new Apps Script version on the existing deployment. Keep the existing FCM_SA property private. Do not put its value in this repository.

The existing version 18 was authorized for `script.external_request` and one account-scoped admin send passed on 2026-11-23. The banner payload in this PR is not yet deployed.

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
The admin writes the notification title and body and chooses lecture, quiz, reply, motivation, or no image. Selection never overwrites typed words. A live approximate preview shows the result. Banner art contains a fixed category heading; personal title/body remain editable outside the image. The server allowlists banner names, never accepts an arbitrary image URL.

## Optional new-publication notices
New lecture and new content forms have an unchecked-by-default notice option. If enabled, editable title/body/banner are sent only after successful save, using adminPushSend. Draft lectures cannot send. Existing edit forms do not send. A push failure never repeats or rolls back the save, and a manual retry warns about possible duplicate delivery.

The notification destination is allowlisted to index.html, Lectures.html, or Lecture.html with an encoded ID. Apply the small Push.gs destination change after backing up the current file and publish a new backend version. Until that publication, notices still open the homepage. Tests use mocked saves and push responses, never real lecture/file/sheet data.
