document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const statusDiv = document.getElementById('status');
  const resultView = document.getElementById('result-view');
  const scannedLink = document.getElementById('scanned-link');
  const genView = document.getElementById('qr-generator-view');
  const qrCanvas = document.getElementById('qr-canvas');
  const historyList = document.getElementById('history-list');
  
  const toggleGen = document.getElementById('toggle-gen');
  const toggleHist = document.getElementById('toggle-hist');
  const clearBtn = document.getElementById('clear-history');

  // NEW: Action buttons
  const copyGenLinkBtn = document.getElementById('copy-gen-link');
  const downloadGenQrBtn = document.getElementById('download-gen-qr');

  // --- 1. LOAD SETTINGS & HISTORY ---
  chrome.storage.local.get(['enableGen', 'enableHist', 'scanHistory'], (data) => {
    const isGenEnabled = data.enableGen !== false; 
    const isHistEnabled = data.enableHist !== false;
    let history = data.scanHistory || [];

    toggleGen.checked = isGenEnabled;
    toggleHist.checked = isHistEnabled;
    renderHistory(history);

    runScanner(isGenEnabled, isHistEnabled, history);
  });

  // --- 2. SETTINGS LISTENERS ---
  toggleGen.addEventListener('change', (e) => chrome.storage.local.set({ enableGen: e.target.checked }));
  toggleHist.addEventListener('change', (e) => chrome.storage.local.set({ enableHist: e.target.checked }));
  
  clearBtn.addEventListener('click', () => {
    chrome.storage.local.set({ scanHistory: [] });
    renderHistory([]);
  });

  // --- 3. THE CORE LOGIC ---
  function runScanner(isGenEnabled, isHistEnabled, history) {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        statusDiv.textContent = "Error: Could not capture screen.";
        return;
      }

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', { willReadFrequently: true });
        
        // Speed Hack
        const scale = 0.5;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        context.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });

        if (code && code.data) {
          // WE FOUND A CODE
          statusDiv.style.display = 'none';
          resultView.style.display = 'block';
          scannedLink.href = code.data;
          scannedLink.textContent = "Open: " + code.data;

          if (isHistEnabled && !history.includes(code.data)) {
            history.unshift(code.data);
            if (history.length > 5) history.pop();
            chrome.storage.local.set({ scanHistory: history });
            renderHistory(history);
          }
        } else {
          // NO CODE FOUND -> GENERATE QR
          if (isGenEnabled) {
            statusDiv.style.display = 'none';
            genView.style.display = 'block';
            
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
              const currentUrl = tabs[0].url;
              
              // Create the QR
              new QRious({
                element: qrCanvas,
                value: currentUrl,
                size: 150
              });

              // NEW LOGIC: Copy Link Button
              copyGenLinkBtn.onclick = () => {
                navigator.clipboard.writeText(currentUrl).then(() => {
                  copyGenLinkBtn.textContent = "Copied!";
                  setTimeout(() => copyGenLinkBtn.textContent = "Copy Link", 2000);
                });
              };

              // NEW LOGIC: Download QR Button
              downloadGenQrBtn.onclick = () => {
                const link = document.createElement('a');
                link.download = 'Page_QR_Code.png';
                link.href = qrCanvas.toDataURL('image/png');
                link.click();
              };
            });
          } else {
            statusDiv.textContent = "No QR code found on the screen.";
          }
        }
      };
      img.src = dataUrl;
    });
  }

  // --- 4. HELPER: RENDER HISTORY ---
  function renderHistory(historyArray) {
    if (historyArray.length === 0) {
      historyList.innerHTML = "No recent scans.";
      return;
    }
    historyList.innerHTML = '';
    historyArray.forEach(url => {
      const a = document.createElement('a');
      a.href = url;
      a.target = "_blank";
      a.className = "history-item";
      a.textContent = url;
      historyList.appendChild(a);
    });
  }
});