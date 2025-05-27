const { app, BrowserWindow } = require('electron');
const path = require('path');

// Disable hardware acceleration to potentially resolve GPU process issues.
app.disableHardwareAcceleration();
// Forcefully disable GPU process
app.commandLine.appendSwitch('disable-gpu');
// Try ignoring the GPU blocklist
app.commandLine.appendSwitch('ignore-gpu-blocklist');
// Add no-sandbox as a last resort for GPU issues (use with caution)
app.commandLine.appendSwitch('--no-sandbox');

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html')); // Corrected path

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
