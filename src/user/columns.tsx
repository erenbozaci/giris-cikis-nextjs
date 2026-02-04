import { ColumnDef } from "@tanstack/react-table"
import { Attendance } from "@/types"
import { Button } from "@/components/ui/button"
import { Pen, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";




export const columns = (
  onDelete: (id: string) => void,
  onEdit: (row: Attendance) => void,
  openForm: (v: boolean) => void,
  getAllData: () => void
): ColumnDef<Attendance>[] => [
    {
      accessorKey: "date",
      header: "Tarih",
      cell: ({ cell }) =>
        cell.getValue<Date>().toLocaleDateString("tr-TR"),
    },
    { accessorKey: "name", header: "İsim" },
    {
      accessorKey: "giris",
      header: "Giriş",
    },
    {
      accessorKey: "cikis",
      header: "Çıkış",
    },
    {
      accessorKey: "izin",
      header: "İzinli",
      cell: ({ cell }) => {
        const izin = cell.getValue<number>();
        return <Checkbox className="cursor-pointer" checked={izin === 1} onCheckedChange={async () => {
          await fetch(`/api/attendance/${cell.row.original.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ izin: izin === 1 ? 0 : 1 }),
          });
          getAllData();
        }} />
      }
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
            onClick={() => {
              onEdit(row.original)
              openForm(true)
            }}
          >
            <Pen />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="cursor-pointer"
            onClick={() => onDelete(row.original.id.toString())}
          >
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ]
