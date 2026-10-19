import { contextBridge, ipcRenderer } from "electron"
import type { AttendanceApi } from "../shared/types"

const api: AttendanceApi = {
  list: (query) => ipcRenderer.invoke("attendance:list", query),
  twoWeeks: () => ipcRenderer.invoke("attendance:twoWeeks"),
  create: (input) => ipcRenderer.invoke("attendance:create", input),
  update: (id, input) => ipcRenderer.invoke("attendance:update", id, input),
  setIzin: (id, izin) => ipcRenderer.invoke("attendance:setIzin", id, izin),
  remove: (id) => ipcRenderer.invoke("attendance:remove", id),
  exportDb: () => ipcRenderer.invoke("db:export"),
  importDb: () => ipcRenderer.invoke("db:import"),
  checkUpdate: () => ipcRenderer.invoke("app:checkUpdate"),
}

contextBridge.exposeInMainWorld("api", api)
