import { contextBridge, ipcRenderer } from "electron"
import type { AttendanceApi } from "../shared/types"

const api: AttendanceApi = {
  list: (query) => ipcRenderer.invoke("attendance:list", query),
  twoWeeks: () => ipcRenderer.invoke("attendance:twoWeeks"),
  create: (input) => ipcRenderer.invoke("attendance:create", input),
  update: (id, input) => ipcRenderer.invoke("attendance:update", id, input),
  setIzin: (id, izin) => ipcRenderer.invoke("attendance:setIzin", id, izin),
  remove: (id) => ipcRenderer.invoke("attendance:remove", id),
}

contextBridge.exposeInMainWorld("api", api)
