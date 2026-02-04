"use client"

import { useCallback, useEffect, useState } from "react"
import { Attendance } from "@/types"
import { AttendanceForm } from "@/user/attendence-form"
import { DataTable } from "@/components/data-table"
import { columns } from "@/user/columns"
import { PaginationState, SortingState } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

const PAGE_SIZE = 10

export default function AttendancePage() {
    const [data, setData] = useState<Attendance[]>([])
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState<Attendance | undefined>()
    const [totalCount, setTotalCount] = useState(0)
    const [twoWeeksHours, setTwoWeeksHours] = useState<{ [key: string]: number }>({})
    const [query, setQuery] = useState("")
    const [sorting, setSorting] = useState<SortingState>([
        { id: "date", desc: true },
    ])
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: PAGE_SIZE,
    })

    const pageCount = Math.ceil(totalCount / pagination.pageSize)

    const fetchTwoWeeksHours = useCallback(async () => {
        const res = await fetch("/api/attendance?twoWeeks=true")
        const rows = await res.json()
        const hoursOfUser: { [key: string]: number } = {}
        
        rows.forEach((entry: { giris: string; cikis: string; name: string }) => {
            const [girisHour, girisMinute] = entry.giris.split(':').map(Number)
            const [cikisHour, cikisMinute] = entry.cikis.split(':').map(Number)
            let cikisHourAdjusted = cikisHour;
            if (cikisHour < girisHour) {
               cikisHourAdjusted += 24;
            }
            
            
            const girisMinutes = girisHour * 60 + girisMinute
            const cikisMinutes = cikisHourAdjusted * 60 + cikisMinute
            
            const diffInHours = (cikisMinutes - girisMinutes) / 60
            
            if (!hoursOfUser[entry.name]) {
                hoursOfUser[entry.name] = 0
            }
            hoursOfUser[entry.name] += diffInHours
        })
        
        setTwoWeeksHours(hoursOfUser)
    }, [])

    const fetchPageData = useCallback(async () => {
        const q = query.trim()
        const qParam = q ? `&q=${encodeURIComponent(q)}` : ""

        const sort = sorting[0]
        const sortBy = sort?.id ? `&sortBy=${encodeURIComponent(sort.id)}` : ""
        const sortDir = sort ? `&sortDir=${sort.desc ? "desc" : "asc"}` : ""

        toast.loading("Veriler yükleniyor...", { id: "fetching-data" })

        const res = await fetch(
            `/api/attendance?page=${pagination.pageIndex}&pageSize=${pagination.pageSize}${qParam}${sortBy}${sortDir}`
        )
        const { data: rows, count } = await res.json()
        toast.success("Veriler yüklendi", { id: "fetching-data" })
        setData(rows.map((row: Attendance & { date: string }) => ({
            ...row,
            date: new Date(row.date)
        })))
        setTotalCount(count)
        fetchTwoWeeksHours()
    }, [pagination.pageIndex, pagination.pageSize, fetchTwoWeeksHours, query, sorting])

    useEffect(() => {
        const id = setTimeout(() => {
            void fetchPageData()
        }, 0)

        return () => clearTimeout(id)
    }, [fetchPageData])

    const setQueryAndReset = (value: string) => {
        setQuery(value)
        setPagination(prev => ({ ...prev, pageIndex: 0 }))
    }

    const setSortingAndReset = (updater: SortingState | ((old: SortingState) => SortingState)) => {
        setSorting(updater)
        setPagination(prev => ({ ...prev, pageIndex: 0 }))
    }

    const save = useCallback(async (entry: Attendance) => {
        if (editing) {
            await fetch(`/api/attendance/${editing.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    date: entry.date.toISOString(),
                    name: entry.name,
                    giris: entry.giris,
                    cikis: entry.cikis,
                }),
            })
        } else {
            await fetch("/api/attendance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    date: entry.date.toISOString(),
                    name: entry.name,
                    giris: entry.giris,
                    cikis: entry.cikis,
                }),
            })
        }
        setOpen(false)
        fetchPageData()
    }, [editing, fetchPageData])

    const remove = async (id: string) => {
        await fetch(`/api/attendance/${id}`, {
            method: "DELETE",
        })
        fetchPageData()
        toast.success("Kayıt silindi")
    }

    return (
        <div className="space-y-4 w-full">
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

            <DataTable 
                columns={columns(remove, setEditing, setOpen, fetchPageData)} 
                data={data}
                pageCount={pageCount}
                pagination={pagination}
                onPaginationChange={setPagination}
                sorting={sorting}
                onSortingChange={setSortingAndReset}
            />

            <AttendanceForm
                open={open}
                onClose={() => {
                    setOpen(false)
                }}
                initialData={editing}
                onSubmit={save}
            />
            <div className="font-bold py-2">
                Son İki Haftadaki Toplam Saat Sayısı:
                {Object.entries(twoWeeksHours).map(([name, hours]) => (
                    <div key={name}>{name}: {hours.toFixed(2)} saat</div>
                ))}
            </div>
        </div>
    )
}
