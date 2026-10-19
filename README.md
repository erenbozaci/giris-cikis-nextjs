# Giriş Çıkış (Electron)

Giriş/çıkış saatlerini takip eden masaüstü uygulaması. `giris-cikis-nextjs` projesinin Electron ile yeniden yazılmış hali.

**Yığın:** Electron · electron-vite · React · Tailwind v4 · shadcn/ui · better-sqlite3

## Geliştirme

```bash
npm install
npm run dev        # sıcak yeniden yüklemeli geliştirme
npm run typecheck
```

## Kurulum dosyası

```bash
npm run dist:win     # Windows: dist/Giriş Çıkış Setup x.y.z.exe  (Windows'ta çalıştırın)
npm run dist:linux   # Linux:   dist/Giriş Çıkış-x.y.z.AppImage
```

Her `main` push'unda GitHub Actions Windows kurulum dosyasını üretir: **Actions → son çalışma → Artifacts → GirisCikis-Kurulum**. `v1.0.0` gibi bir tag push'lanırsa dosya Releases'e de eklenir.

Kurulum dosyası imzasız olduğu için Windows SmartScreen uyarı verebilir: **Ek bilgi → Yine de çalıştır**.

Artık `baslat.bat`'a, Node.js kurulumuna veya tarayıcıya gerek yok; kullanıcı sadece kurulum dosyasını çalıştırır.

## Veritabanı

SQLite dosyası kullanıcı veri klasöründe tutulur:

- Windows: `%APPDATA%\Giriş Çıkış\data\giris-cikis.db`
- Linux: `~/.config/Giriş Çıkış/data/giris-cikis.db`

Tablo şeması eski Next.js/Prisma sürümüyle aynıdır; eski `data/dev.db` dosyası uygulama kapalıyken bu konuma `giris-cikis.db` adıyla kopyalanarak taşınabilir.

## Yapı

```
src/
  main/       Electron ana süreç: pencere, IPC, SQLite (db.ts)
  preload/    window.api köprüsü
  shared/     ortak tipler
  renderer/   React arayüzü (features/attendance, components/ui)
```
