document.addEventListener('DOMContentLoaded', () => {
  const statusDiv = document.getElementById('status');
  const resultDiv = document.getElementById('result');
  const linkElement = document.getElementById('link');

  // 1. Instantly capture the visible area of the current tab
  chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
    if (chrome.runtime.lastError) {
      statusDiv.textContent = "Error: Could not capture the screen.";
      return;
    }

    const img = new Image();
    img.onload = () => {
      // 2. Draw the screenshot onto an invisible canvas to get the raw pixels
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      context.drawImage(img, 0, 0, img.width, img.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      // 3. Pass the raw pixels to the jsQR library
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      // 4. Update the UI based on what we found
      if (code && code.data) {
        statusDiv.style.display = 'none';
        resultDiv.style.display = 'block';
        linkElement.href = code.data;
        linkElement.textContent = "Open: " + code.data;
      } else {
        statusDiv.textContent = "No QR code found on the screen.";
      }
    };
    
    // Trigger the image load
    img.src = dataUrl;
  });
});