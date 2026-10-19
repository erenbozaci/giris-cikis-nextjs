import { Toaster } from "@/components/ui/sonner"
import AttendancePage from "@/features/attendance/attendance-page"

export default function App() {
  return (
    <div className="flex min-h-screen justify-center bg-zinc-50 dark:bg-black">
      <main className="flex w-full max-w-4xl flex-col py-10 px-8 bg-white dark:bg-black">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Giriş Çıkış Kontrol</h1>
        <AttendancePage />
      </main>
      <Toaster />
    </div>
  )
}
