// Electron masaüstü kabuğu.
// Uygulamayı kendi içindeki yerel sunucudan açar; dış bağlantılar tarayıcıda açılır.

const path = require("node:path");
const { app, BrowserWindow, shell } = require("electron");
const { startServer } = require("./server");

let server = null;

// Site dosyaları geliştirmede depo kökünde, paketlenmiş exe'de resources/app içinde.
function siteRoot() {
  return app.isPackaged
    ? path.join(process.resourcesPath, "app")
    : path.join(__dirname, "..");
}

// Sabit bağlantı noktası, localStorage'ın (oyun ilerlemesi, sonuçlar) her açılışta
// aynı kökene yazılmasını sağlar. Port doluysa boş bir portla devam edilir.
async function openServer() {
  const root = siteRoot();
  try {
    return await startServer(root, { port: 47831 });
  } catch {
    return startServer(root);
  }
}

async function createWindow() {
  server = await openServer();

  const win = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 360,
    backgroundColor: "#fff6d8",
    autoHideMenuBar: true,
    title: "Doğru Yazarım İyi Oynarım",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (server && url.startsWith(server.url + "/")) return { action: "allow" };
    shell.openExternal(url);
    return { action: "deny" };
  });

  await win.loadURL(server.url + "/index.html");
}

app.whenReady().then(createWindow);

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("window-all-closed", () => {
  if (server) {
    server.close();
    server = null;
  }
  if (process.platform !== "darwin") app.quit();
});
