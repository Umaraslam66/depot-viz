export function safeFilename(textValue, extensionValue) {
  const baseName = textValue
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${baseName || "rail-scenario"}.${extensionValue}`;
}

export function downloadBlob(blobValue, filenameValue) {
  const objectUrl = URL.createObjectURL(blobValue);
  const downloadLink = document.createElement("a");
  downloadLink.href = objectUrl;
  downloadLink.download = filenameValue;
  downloadLink.click();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 800);
}
