import { useState, useEffect } from "react"
import { Attendance } from "@/types/index"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { toast } from "sonner"

type Props = {
  open: boolean
  onClose: () => void
  initialData?: Attendance
  onSubmit: (data: Attendance) => void
}

export function AttendanceForm({
  open,
  onClose,
  initialData,
  onSubmit,
}: Props) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)

  const [form, setForm] = useState<Attendance>({} as Attendance);

  useEffect(() => {
    setForm(
      initialData ?? {
        id: 0,
        date: new Date(),
        name: "",
        giris: "",
        cikis: "",
      }
    )
  }, [initialData])

  const handleChange = (
    key: keyof Attendance,
    value: string
  ) => {
    setForm((prev: Attendance) => ({
      ...prev,
      [key]: key === "date" ? new Date(value) : value,
    }))
  }

  const submit = () => {
    if (!form.name?.trim()) {
      toast.info("Lütfen isim girin")
      return
    }
    if (!form.giris || !form.cikis) {
      toast.info("Lütfen giriş ve çıkış saatlerini girin")
      return
    }

    const toMinutes = (value: string) => {
      const [h, m] = value.split(":").map(Number)
      if (Number.isNaN(h) || Number.isNaN(m)) return null
      return h * 60 + m
    }

    const girisMin = toMinutes(form.giris)
    const cikisMin = toMinutes(form.cikis)
    if (girisMin === null || cikisMin === null) {
      toast.error("Saat formatı geçersiz")
      return
    }


    onSubmit(form)
    onClose()
  }

  const handleDateSelect = (date?: Date) => {
    if (!date) return

    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    setForm((prev) => ({ ...prev, date: localDate }))
    setIsDatePickerOpen(false)
  }


  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-950 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">
            {initialData ? "Kayıt Güncelle" : "Yeni Kayıt"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-zinc-400">Tarih</Label>
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  type="button"
                  data-empty={!form.date}
                  className="data-[empty=true]:text-muted-foreground w-full justify-start text-left font-normal"
                >
                  <CalendarIcon />
                  {form.date ? format(form.date, "PPP", { locale: tr }) : <span>Tarih seç</span>}
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

          <div>
            <Label className="text-zinc-400">İsim</Label>
            <Input
              className="bg-zinc-900 border-zinc-800"
              value={form.name}
              onChange={e =>
                handleChange("name", e.target.value)
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-zinc-400">Giriş</Label>
              <Input
                type="time"
                className="bg-zinc-900 border-zinc-800"
                value={form.giris}
                onChange={e =>
                  handleChange(
                    "giris",
                    e.target.value
                  )
                }
              />
            </div>

            <div>
              <Label className="text-zinc-400">Çıkış</Label>
              <Input
                type="time"
                className="bg-zinc-900 border-zinc-800"
                value={form.cikis}
                onChange={e =>
                  handleChange(
                    "cikis",
                    e.target.value
                  )
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="secondary"
            onClick={onClose}
          >
            İptal
          </Button>
          <Button onClick={submit}>
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
