// Create the right-click menu when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "scan-qr-image",
    title: "Scan this QR Code",
    contexts: ["image"]
  });
});

// Note: Manifest V3 background scripts cannot easily read image pixels directly. 
// For a fully functional right-click scan, you usually inject a script into the page.
// To keep things simple and fast for now, we will just open the image in a new tab 
// where the user can click the extension icon to scan it instantly.
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "scan-qr-image") {
    chrome.tabs.create({ url: info.srcUrl });
  }
});