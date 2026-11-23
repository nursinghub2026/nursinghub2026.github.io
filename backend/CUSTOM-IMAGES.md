# Custom notification images

This change is **not deployed**. Existing ready-made banners work without image-hosting setup. Custom-image sends stay blocked until the backend reports hosting configured.

## Design
- Admin draws the final 1200 × 600 PNG in the browser. Arabic headline, subtitle and a visual button caption are editable.
- Optional local PNG/JPEG/WebP background, center-cropped under a navy overlay. No file leaves the device on selection, preview or download.
- Explicit send passes the PNG to the existing authenticated admin endpoint.
- Server checks PNG signature, dimensions and size before upload. It generates a unique Cloudinary public ID, signs on the server and sets overwrite=false. Existing images are never changed.
- Cloudinary returns a stable HTTPS delivery URL; FCM gets that URL rather than base64. API secrets never enter frontend code or notification payloads.
- The image is accessible to anyone with its URL. Do not put private student data in it. The drawn button is artwork, not an independent clickable action.

## Setup after merge, with owner approval
1. Create or connect the owner's Cloudinary environment. Confirm current free-plan quota and terms with the owner; do not add billing or paid add-ons.
2. Securely set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in Apps Script Properties. Never commit secrets.
3. Back up the complete current live Apps Script source.
4. Add PushImages.gs, then apply the limited customImages capability and image upload hooks in Push.gs. Preserve existing deployment, routes and all lecture data.
5. Publish the existing deployment as a new version only after approval. No new spreadsheet tabs or lecture writes are needed.
6. Send a test only to the owner's opted-in device, after approval of the test content. Verify CDN URL returns image/png without sign-in and check the device display. FCM acceptance alone does not verify physical display.
7. Retain immutable uploaded assets while notifications may still refer to them. Any cleanup is a separate approved operation.

## Failure behavior
- Missing hosting: manual custom-image send is blocked before any send or upload.
- Invalid PNG / wrong size / too large: rejected server-side.
- Upload failure: no notification send.
- FCM partial failure: existing sent/failed report remains in effect. Repeated sends may create another image; no automatic retry or duplicate broadcast.
- Ready-made and image-free banners remain available.

## References
- https://cloudinary.com/documentation/upload_images
- https://cloudinary.com/documentation/image_upload_api_reference
- https://developers.google.com/workspace/drive/api/reference/rest/v3/files

Drive thumbnail URLs are short-lived and documented as unsuitable for direct web application use, so they are not used as long-lived notification image hosting.
