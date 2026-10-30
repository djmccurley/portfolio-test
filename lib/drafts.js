// Draft visibility (PUB-05, D-13). Eleventy sets ELEVENTY_RUN_MODE itself at startup, so CI cannot inherit a value.
// Fail closed: only the exact run modes `serve` and `watch` show drafts; anything else hides them.
export function showDrafts() {
  const mode = process.env.ELEVENTY_RUN_MODE;
  return mode === "serve" || mode === "watch";
}
