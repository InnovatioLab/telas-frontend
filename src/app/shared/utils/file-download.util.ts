export function triggerBrowserFileDownload(
  url: string,
  fileNameHint?: string
): void {
  const a = document.createElement("a");
  a.href = url;
  if (fileNameHint) {
    a.download = fileNameHint;
  }
  a.rel = "noopener noreferrer";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
