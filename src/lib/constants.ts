// Image types accepted by the backend uploads endpoint. Mirror the allowlist in
// blog-platform-backend/src/routes/uploads.ts so the file picker only offers
// images the server will accept.
export const ALLOWED_IMAGE_TYPES = "image/jpeg,image/png,image/webp,image/gif";
