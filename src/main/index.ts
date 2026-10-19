import { app, BrowserWindow, dialog, ipcMain, shell } from "electron"
import { appendFileSync } from "node:fs"
import { join } from "node:path"
import { autoUpdater } from "electron-updater"
import {
  closeDatabase,
  createAttendance,
  deleteAttendance,
  listAttendance,
  listTwoWeeks,
  openDatabase,
  setIzin,
  updateAttendance,
} from "./db"

// Başlangıçta sessizce kapanmak yerine hatayı göster ve userData/hata.log'a yaz
function reportFatal(title: string, err: unknown) {
  const msg = err instanceof Error ? `${err.message}
${err.stack ?? ""}` : String(err)
  try {
    appendFileSync(join(app.getPath("userData"), "hata.log"), `[${new Date().toISOString()}] ${title}
${msg}

`)
  } catch {}
  dialog.showErrorBox(title, msg)
  app.quit()
}

process.on("uncaughtException", (err) => reportFatal("Beklenmeyen hata", err))

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 760,
    minWidth: 720,
    minHeight: 500,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: "#09090b",
    title: "Giriş Çıkış Kontrol",
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
    },
  })

  win.once("ready-to-show", () => win.show())
  // Sayfa yüklenemezse pencere hiç görünmeyebilir; yine de göster
  win.webContents.on("did-fail-load", (_e, code, desc) => {
    win.show()
    dialog.showErrorBox("Sayfa yüklenemedi", `${desc} (${code})`)
  })

  // Dış linkler uygulama içinde değil tarayıcıda açılsın
  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: "deny" }
  })

  if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
    void win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    void win.loadFile(join(__dirname, "../renderer/index.html"))
  }
}

// GitHub Releases'teki en son sürümle package.json sürümünü karşılaştırır; yeni sürüm varsa indirir
function checkForUpdates() {
  if (!app.isPackaged) return
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.on("update-downloaded", (info) => {
    void dialog
      .showMessageBox({
        type: "info",
        buttons: ["Şimdi yeniden başlat", "Sonra"],
        defaultId: 0,
        title: "Güncelleme hazır",
        message: `Yeni sürüm ${info.version} indirildi (mevcut: ${app.getVersion()}).`,
      })
      .then(({ response }) => {
        if (response === 0) autoUpdater.quitAndInstall()
      })
  })
  autoUpdater.on("error", (err) => {
    try {
      appendFileSync(join(app.getPath("userData"), "hata.log"), `[${new Date().toISOString()}] güncelleme: ${err.message}
`)
    } catch {}
  })
  void autoUpdater.checkForUpdates()
}

function registerIpc() {
  ipcMain.handle("attendance:list", (_e, query) => listAttendance(query))
  ipcMain.handle("attendance:twoWeeks", () => listTwoWeeks())
  ipcMain.handle("attendance:create", (_e, input) => createAttendance(input))
  ipcMain.handle("attendance:update", (_e, id: number, input) => updateAttendance(id, input))
  ipcMain.handle("attendance:setIzin", (_e, id: number, izin: number) => setIzin(id, izin))
  ipcMain.handle("attendance:remove", (_e, id: number) => deleteAttendance(id))
}

// Saat alanları sistem dilinden bağımsız 24 saat formatında görünsün
app.commandLine.appendSwitch("lang", "tr-TR")

// Aynı anda iki pencere/iki süreç DB'ye yazmasın
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on("second-instance", () => {
    const win = BrowserWindow.getAllWindows()[0]
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })

  app.whenReady().then(() => {
    // Windows görev çubuğu gruplaması ve bildirimler için kurulumdaki appId ile aynı olmalı
    if (process.platform === "win32") app.setAppUserModelId("com.eren.giriscikis")
    try {
      openDatabase()
      registerIpc()
      createWindow()
      checkForUpdates()
    } catch (err) {
      reportFatal("Uygulama başlatılamadı", err)
      return
    }

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit()
  })

  app.on("will-quit", closeDatabase)
}
