import { useCallback, useEffect, useMemo, useState } from "react"
import type { PaginationState, SortingState, Updater } from "@tanstack/react-table"
import type { Attendance, AttendanceInput, SortField } from "@shared/types"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { AttendanceForm } from "./attendance-form"
import { columns } from "./columns"
import { hoursByName } from "./hours"

const PAGE_SIZE = 10

// IPC hata mesajlarının başındaki "Error invoking remote method ..." kısmını at
const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message.replace(/^Error invoking remote method '[^']+': (Error: )?/, "") : String(err)

export default function AttendancePage() {
  const [data, setData] = useState<Attendance[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [twoWeeksHours, setTwoWeeksHours] = useState<Record<string, number>>({})
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Attendance | undefined>()
  const [query, setQuery] = useState("")
  const [sorting, setSorting] = useState<SortingState>([{ id: "date", desc: true }])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: PAGE_SIZE })

  const pageCount = Math.max(1, Math.ceil(totalCount / pagination.pageSize))

  const refresh = useCallback(async () => {
    try {
      const sort = sorting[0]
      const [page, twoWeeks] = await Promise.all([
        window.api.list({
          page: pagination.pageIndex,
          pageSize: pagination.pageSize,
          q: query,
          sortBy: sort?.id as SortField | undefined,
          sortDir: sort?.desc ? "desc" : "asc",
        }),
        window.api.twoWeeks(),
      ])

      // Son sayfadaki son kayıt silindiyse bir önceki sayfaya dön
      if (page.data.length === 0 && pagination.pageIndex > 0) {
        setPagination((prev) => ({ ...prev, pageIndex: prev.pageIndex - 1 }))
        return
      }

      setData(page.data)
      setTotalCount(page.count)
      setTwoWeeksHours(hoursByName(twoWeeks))
    } catch (err) {
      toast.error(`Veriler yüklenemedi: ${errorMessage(err)}`)
    }
  }, [pagination.pageIndex, pagination.pageSize, query, sorting])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const setQueryAndReset = (value: string) => {
    setQuery(value)
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }

  const setSortingAndReset = (updater: Updater<SortingState>) => {
    setSorting(updater)
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }

  const save = async (input: AttendanceInput) => {
    try {
      if (editing) {
        await window.api.update(editing.id, input)
        toast.success("Kayıt güncellendi")
      } else {
        await window.api.create(input)
        toast.success("Kayıt eklendi")
      }
      await refresh()
    } catch (err) {
      toast.error(`Kaydedilemedi: ${errorMessage(err)}`)
      throw err
    }
  }

  const tableColumns = useMemo(
    () =>
      columns({
        onEdit: (row) => {
          setEditing(row)
          setOpen(true)
        },
        onDelete: async (row) => {
          if (!window.confirm(`${row.name} - ${new Date(row.date).toLocaleDateString("tr-TR")} kaydı silinsin mi?`)) return
          try {
            await window.api.remove(row.id)
            toast.success("Kayıt silindi")
            await refresh()
          } catch (err) {
            toast.error(`Silinemedi: ${errorMessage(err)}`)
          }
        },
        onToggleIzin: async (row) => {
          try {
            await window.api.setIzin(row.id, row.izin === 1 ? 0 : 1)
            await refresh()
          } catch (err) {
            toast.error(`İzin güncellenemedi: ${errorMessage(err)}`)
          }
        },
      }),
    [refresh]
  )

  const totals = Object.entries(twoWeeksHours).sort(([a], [b]) => a.localeCompare(b, "tr"))

  return (
    <div className="space-y-4 w-full">
      <div className="flex gap-3">
        <Button
          className="cursor-pointer"
          onClick={() => {
            setEditing(undefined)
            setOpen(true)
          }}
        >
          + Yeni Kayıt
        </Button>
        <Input
          className="bg-zinc-900 border-zinc-800"
          placeholder="Ara (isim)"
          value={query}
          onChange={(e) => setQueryAndReset(e.target.value)}
        />
      </div>

      <DataTable
        columns={tableColumns}
        data={data}
        pageCount={pageCount}
        pagination={pagination}
        onPaginationChange={setPagination}
        sorting={sorting}
        onSortingChange={setSortingAndReset}
      />

      <AttendanceForm
        open={open}
        onClose={() => setOpen(false)}
        initialData={editing}
        onSubmit={save}
      />

      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="mb-2 font-bold">Son İki Haftadaki Toplam Saat Sayısı</div>
        {totals.length ? (
          totals.map(([name, hours]) => (
            <div key={name} className="flex justify-between py-1 text-sm text-zinc-300">
              <span>{name}</span>
              <span className="tabular-nums">{hours.toFixed(2)} saat</span>
            </div>
          ))
        ) : (
          <div className="text-sm text-zinc-500">Kayıt yok</div>
        )}
      </div>
    </div>
  )
}
