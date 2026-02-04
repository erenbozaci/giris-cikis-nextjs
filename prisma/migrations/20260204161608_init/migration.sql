-- CreateTable
CREATE TABLE "Attendance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "giris" TEXT NOT NULL,
    "cikis" TEXT NOT NULL,
    "izin" INTEGER NOT NULL DEFAULT 0
);
