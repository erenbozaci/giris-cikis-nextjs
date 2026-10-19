import Database from "better-sqlite3"
import { app } from "electron"
import { mkdirSync } from "node:fs"
import { join } from "node:path"
import {
  SORT_FIELDS,
  type Attendance,
  type AttendanceInput,
  type ListQuery,
  type ListResult,
} from "../shared/types"

let db: Database.Database

export function openDatabase(): void {
  const dir = join(app.getPath("userData"), "data")
  mkdirSync(dir, { recursive: true })

  db = new Database(join(dir, "giris-cikis.db"))
  db.pragma("journal_mode = WAL")
  // SQLite LIKE yalnızca ASCII'de harf duyarsız; Türkçe karakterler için (İ/ı, Ş/ş...)
  db.function("tr_lower", { deterministic: true }, (s) => String(s ?? "").toLocaleLowerCase("tr-TR"))

  // Eski Next.js/Prisma şemasıyla aynı: eski dev.db dosyası buraya kopyalanabilir
  db.exec(`
    CREATE TABLE IF NOT EXISTS "Attendance" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "date" DATETIME NOT NULL,
      "name" TEXT NOT NULL,
      "giris" TEXT NOT NULL,
      "cikis" TEXT NOT NULL,
      "izin" INTEGER NOT NULL DEFAULT 0
    );
  `)
}

export function backupTo(path: string): Promise<unknown> {
  return db.backup(path)
}

// Seçilen .db dosyasındaki kayıtlarla mevcut tüm kayıtların yerini alır
export function importFrom(path: string): number {
  const src = new Database(path, { readonly: true, fileMustExist: true })
  try {
    const rows = src
      .prepare(`SELECT date, name, giris, cikis, izin FROM "Attendance"`)
      .all() as Omit<Attendance, "id">[]
    const insert = db.prepare(
      `INSERT INTO Attendance (date, name, giris, cikis, izin) VALUES (@date, @name, @giris, @cikis, @izin)`
    )
    db.transaction(() => {
      db.exec(`DELETE FROM Attendance`)
      for (const r of rows) insert.run(r)
    })()
    return rows.length
  } finally {
    src.close()
  }
}

export function closeDatabase() {
  db?.close()
}

function getById(id: number) {
  return db.prepare(`SELECT * FROM Attendance WHERE id = ?`).get(id) as Attendance
}

export function listAttendance(query: ListQuery): ListResult {
  const q = (query.q ?? "").trim()
  const sortBy = SORT_FIELDS.includes(query.sortBy!) ? query.sortBy : "date"
  const sortDir = query.sortDir === "asc" ? "ASC" : "DESC"
  const where = q ? `WHERE instr(tr_lower(name), tr_lower(@q)) > 0` : ""

  const data = db
    .prepare(
      `SELECT * FROM Attendance ${where}
       ORDER BY "${sortBy}" ${sortDir}, id ${sortDir}
       LIMIT @limit OFFSET @offset`
    )
    .all({ q, limit: query.pageSize, offset: query.page * query.pageSize }) as Attendance[]

  const { count } = db
    .prepare(`SELECT COUNT(*) AS count FROM Attendance ${where}`)
    .get({ q }) as { count: number }

  return { data, count }
}

export function listTwoWeeks(): Attendance[] {
  const twoWeeksAgo = new Date()
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

  return db
    .prepare(`SELECT * FROM Attendance WHERE date >= ? ORDER BY date DESC`)
    .all(twoWeeksAgo.toISOString()) as Attendance[]
}

export function createAttendance(input: AttendanceInput): Attendance {
  const { lastInsertRowid } = db
    .prepare(
      `INSERT INTO Attendance (date, name, giris, cikis, izin)
       VALUES (@date, @name, @giris, @cikis, 0)`
    )
    .run(normalize(input))
  return getById(Number(lastInsertRowid))
}

export function updateAttendance(id: number, input: AttendanceInput): Attendance {
  db.prepare(
    `UPDATE Attendance SET date = @date, name = @name, giris = @giris, cikis = @cikis
     WHERE id = @id`
  ).run({ ...normalize(input), id })
  return getById(id)
}

export function setIzin(id: number, izin: number): Attendance {
  db.prepare(`UPDATE Attendance SET izin = ? WHERE id = ?`).run(izin ? 1 : 0, id)
  return getById(id)
}

export function deleteAttendance(id: number) {
  db.prepare(`DELETE FROM Attendance WHERE id = ?`).run(id)
}

function normalize(input: AttendanceInput): AttendanceInput {
  const name = String(input.name ?? "").trim()
  const date = new Date(input.date)
  const timeRe = /^\d{2}:\d{2}$/

  if (!name) throw new Error("İsim boş olamaz")
  if (Number.isNaN(date.getTime())) throw new Error("Geçersiz tarih")
  if (!timeRe.test(input.giris) || !timeRe.test(input.cikis)) {
    throw new Error("Saat formatı geçersiz")
  }

  return { name, date: date.toISOString(), giris: input.giris, cikis: input.cikis }
}
