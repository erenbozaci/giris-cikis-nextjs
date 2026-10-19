import { useEffect, useState } from "react"
import type { Attendance, AttendanceInput } from "@shared/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { toast } from "sonner"
import { toMinutes } from "./hours"

type Props = {
  open: boolean
  onClose: () => void
  initialData?: Attendance
  onSubmit: (data: AttendanceInput) => Promise<void>
}

type FormState = { date: Date; name: string; giris: string; cikis: string }

const today = () => {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function AttendanceForm({ open, onClose, initialData, onSubmit }: Props) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FormState>({ date: today(), name: "", giris: "", cikis: "" })

  // Dialog her açıldığında formu sıfırla / düzenlenen kaydı yükle
  useEffect(() => {
    if (!open) return
    setForm(
      initialData
        ? { ...initialData, date: new Date(initialData.date) }
        : { date: today(), name: "", giris: "", cikis: "" }
    )
  }, [open, initialData])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const submit = async () => {
    if (!form.name.trim()) return toast.info("Lütfen isim girin")
    if (!form.giris || !form.cikis) return toast.info("Lütfen giriş ve çıkış saatlerini girin")
    if (toMinutes(form.giris) === null || toMinutes(form.cikis) === null) {
      return toast.error("Saat formatı geçersiz")
    }

    setSaving(true)
    try {
      await onSubmit({
        date: form.date.toISOString(),
        name: form.name.trim(),
        giris: form.giris,
        cikis: form.cikis,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const handleDateSelect = (date?: Date) => {
    if (!date) return
    set("date", new Date(date.getFullYear(), date.getMonth(), date.getDate()))
    setIsDatePickerOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-zinc-950 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">
            {initialData ? "Kayıt Güncelle" : "Yeni Kayıt"}
          </DialogTitle>
        </DialogHeader>

        <form
          id="attendance-form"
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
        >
          <div className="space-y-2">
            <Label className="text-zinc-400">Tarih</Label>
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  type="button"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon />
                  {format(form.date, "PPP", { locale: tr })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start" portalled={false}>
                <Calendar
                  mode="single"
                  selected={form.date}
                  onSelect={handleDateSelect}
                  defaultMonth={form.date}
                  locale={tr}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-400">İsim</Label>
            <Input
              autoFocus
              className="bg-zinc-900 border-zinc-800"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-zinc-400">Giriş</Label>
              <Input
                type="time"
                className="bg-zinc-900 border-zinc-800"
                value={form.giris}
                onChange={(e) => set("giris", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">Çıkış</Label>
              <Input
                type="time"
                className="bg-zinc-900 border-zinc-800"
                value={form.cikis}
                onChange={(e) => set("cikis", e.target.value)}
              />
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button variant="secondary" type="button" onClick={onClose}>
            İptal
          </Button>
          <Button type="submit" form="attendance-form" disabled={saving}>
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
