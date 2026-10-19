import type { ColumnDef } from "@tanstack/react-table"
import type { Attendance } from "@shared/types"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Pen, Trash2 } from "lucide-react"

type Handlers = {
  onEdit: (row: Attendance) => void
  onDelete: (row: Attendance) => void
  onToggleIzin: (row: Attendance) => void
}

export const columns = ({ onEdit, onDelete, onToggleIzin }: Handlers): ColumnDef<Attendance>[] => [
  {
    accessorKey: "date",
    header: "Tarih",
    cell: ({ cell }) => new Date(cell.getValue<string>()).toLocaleDateString("tr-TR"),
  },
  { accessorKey: "name", header: "İsim" },
  { accessorKey: "giris", header: "Giriş" },
  { accessorKey: "cikis", header: "Çıkış" },
  {
    accessorKey: "izin",
    header: "İzinli",
    cell: ({ row }) => (
      <Checkbox
        className="cursor-pointer"
        checked={row.original.izin === 1}
        onCheckedChange={() => onToggleIzin(row.original)}
      />
    ),
  },
  {
    id: "actions",
    header: "",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="cursor-pointer"
          onClick={() => onEdit(row.original)}
        >
          <Pen />
        </Button>
        <Button
          size="sm"
          variant="destructive"
          className="cursor-pointer"
          onClick={() => onDelete(row.original)}
        >
          <Trash2 />
        </Button>
      </div>
    ),
  },
]
