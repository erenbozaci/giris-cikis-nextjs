import type { AttendanceApi } from "../shared/types"

declare global {
  interface Window {
    api: AttendanceApi
  }
}
