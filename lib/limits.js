// Shared media limits. No imports, so scripts/ can load this without pulling in sharp or eleventy-img.
// Tune the video and PDF caps here only: they feed the renderer, the CI guard and the pre-commit hook.
export const VIDEO_EXTS = new Set([".mp4", ".webm"]);
export const VIDEO_MAX_MB = 50;
export const VIDEO_MAX_BYTES = VIDEO_MAX_MB * 1024 * 1024;
export const PDF_EXTS = new Set([".pdf"]);
export const PDF_MAX_MB = 25;
export const PDF_MAX_BYTES = PDF_MAX_MB * 1024 * 1024;
