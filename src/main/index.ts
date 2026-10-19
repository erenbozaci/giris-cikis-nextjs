import { app, BrowserWindow, dialog, ipcMain, shell } from "electron"
import { appendFileSync } from "node:fs"
import { join } from "node:path"
import { autoUpdater } from "electron-updater"
import {
  backupTo,
  closeDatabase,
  createAttendance,
  deleteAttendance,
  importFrom,
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
let updaterReady = false
function setupUpdater() {
  if (!app.isPackaged || updaterReady) return
  updaterReady = true
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
}

function checkForUpdates() {
  setupUpdater()
  if (app.isPackaged) void autoUpdater.checkForUpdates().catch(() => {})
}

function registerIpc() {
  ipcMain.handle("attendance:list", (_e, query) => listAttendance(query))
  ipcMain.handle("attendance:twoWeeks", () => listTwoWeeks())
  ipcMain.handle("attendance:create", (_e, input) => createAttendance(input))
  ipcMain.handle("attendance:update", (_e, id: number, input) => updateAttendance(id, input))
  ipcMain.handle("attendance:setIzin", (_e, id: number, izin: number) => setIzin(id, izin))
  ipcMain.handle("attendance:remove", (_e, id: number) => deleteAttendance(id))

  ipcMain.handle("db:export", async () => {
    const stamp = new Date().toISOString().slice(0, 10)
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: "Veritabanını dışa aktar",
      defaultPath: `giris-cikis-${stamp}.db`,
      filters: [{ name: "Veritabanı", extensions: ["db"] }],
    })
    if (canceled || !filePath) return { canceled: true }
    await backupTo(filePath)
    return { canceled: false, path: filePath }
  })

  ipcMain.handle("db:import", async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: "Veritabanını içe aktar",
      properties: ["openFile"],
      filters: [{ name: "Veritabanı", extensions: ["db"] }],
    })
    if (canceled || !filePaths[0]) return { canceled: true }
    const { response } = await dialog.showMessageBox({
      type: "warning",
      buttons: ["İçe aktar", "Vazgeç"],
      defaultId: 1,
      cancelId: 1,
      title: "Mevcut kayıtlar silinecek",
      message: "İçe aktarma mevcut tüm kayıtların yerini alır. Devam edilsin mi?",
    })
    if (response !== 0) return { canceled: true }
    return { canceled: false, count: importFrom(filePaths[0]) }
  })

  ipcMain.handle("app:checkUpdate", async () => {
    const current = app.getVersion()
    if (!app.isPackaged) return { status: "dev", version: current, current }
    setupUpdater()
    const res = await autoUpdater.checkForUpdates()
    const version = res?.updateInfo.version ?? current
    return { status: res?.isUpdateAvailable ? "available" : "latest", version, current }
  })
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
