import type { Attendance } from "@shared/types"

export function toMinutes(value: string) {
  const [h, m] = value.split(":").map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

/** Giriş-çıkış arası saat; çıkış girişten önceyse gece yarısını geçmiş sayılır */
export function workedHours(giris: string, cikis: string) {
  const start = toMinutes(giris)
  let end = toMinutes(cikis)
  if (start === null || end === null) return 0
  if (end < start) end += 24 * 60
  return (end - start) / 60
}

export function hoursByName(rows: Attendance[]) {
  const totals: Record<string, number> = {}
  for (const row of rows) {
    totals[row.name] = (totals[row.name] ?? 0) + workedHours(row.giris, row.cikis)
  }
  return totals
}
