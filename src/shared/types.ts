export type Attendance = {
  id: number
  /** ISO tarih (YYYY-MM-DD'nin yerel gece yarısı) */
  date: string
  name: string
  giris: string
  cikis: string
  izin: number
}

export type AttendanceInput = Pick<Attendance, "date" | "name" | "giris" | "cikis">

export const SORT_FIELDS = ["date", "name", "giris", "cikis", "izin"] as const
export type SortField = (typeof SORT_FIELDS)[number]

export type ListQuery = {
  page: number
  pageSize: number
  q?: string
  sortBy?: SortField
  sortDir?: "asc" | "desc"
}

export type ListResult = {
  data: Attendance[]
  count: number
}

export type AttendanceApi = {
  list: (query: ListQuery) => Promise<ListResult>
  twoWeeks: () => Promise<Attendance[]>
  create: (input: AttendanceInput) => Promise<Attendance>
  update: (id: number, input: AttendanceInput) => Promise<Attendance>
  setIzin: (id: number, izin: number) => Promise<Attendance>
  remove: (id: number) => Promise<void>
}
