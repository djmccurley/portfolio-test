// Shared media limits. No imports, so scripts/ can load this without pulling in sharp or eleventy-img.
// Tune the video cap here only: it feeds the renderer, the CI guard and the pre-commit hook.
export const VIDEO_EXTS = new Set([".mp4", ".webm"]);
export const VIDEO_MAX_MB = 50;
export const VIDEO_MAX_BYTES = VIDEO_MAX_MB * 1024 * 1024;
