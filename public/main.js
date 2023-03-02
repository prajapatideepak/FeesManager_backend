const electron = require("electron");
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

const path = require("path");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({ 
    icon: path.join(__dirname, 'software_icon.png'),
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      preload: path.join(__dirname, '../src/server.js')
    },
  });
  mainWindow.maximize()
  
  mainWindow.loadURL(
      `file://${path.join(__dirname, "/loader.html")}`
    );

   mainWindow.webContents.once('dom-ready', () => {
    mainWindow.loadURL(
      `file://${path.join(__dirname, "/index.html")}`
    );
  })
  
  mainWindow.on( "closed", () => { 
    mainWindow = null
  });
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});


