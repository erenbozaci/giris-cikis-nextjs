import { prisma } from "@/db"
import { NextRequest, NextResponse } from "next/server"

// PUT /api/attendance/[id] - Update attendance
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const data = await prisma.attendance.update({
      where: { id: parseInt(id) },
      data: {
        date: new Date(body.date),
        name: body.name,
        giris: body.giris,
        cikis: body.cikis,
      },
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error updating attendance:", error)
    return NextResponse.json({ error: "Failed to update data" }, { status: 500 })
  }
}

// PATCH /api/attendance/[id] - Update izin field only
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const data = await prisma.attendance.update({
      where: { id: parseInt(id) },
      data: {
        izin: body.izin,
      },
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error updating izin:", error)
    return NextResponse.json({ error: "Failed to update izin" }, { status: 500 })
  }
}

// DELETE /api/attendance/[id] - Delete attendance
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.attendance.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting attendance:", error)
    return NextResponse.json({ error: "Failed to delete data" }, { status: 500 })
  }
}
