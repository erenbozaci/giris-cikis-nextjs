import { prisma } from "@/db"
import type { Prisma } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"

// GET /api/attendance - Get paginated data or all data
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = searchParams.get("page")
  const pageSize = searchParams.get("pageSize")
  const twoWeeks = searchParams.get("twoWeeks")
  const q = (searchParams.get("q") ?? "").trim()
  const sortBy = (searchParams.get("sortBy") ?? "date").trim()
  const sortDir = (searchParams.get("sortDir") ?? "desc").trim()

  const allowedSortFields = new Set(["date", "name", "giris", "cikis", "izin"])
  const safeSortBy = allowedSortFields.has(sortBy) ? sortBy : "date"
  const safeSortDir: Prisma.SortOrder = sortDir === "asc" ? "asc" : "desc"
  const orderBy = { [safeSortBy]: safeSortDir } as Prisma.AttendanceOrderByWithRelationInput

  try {
    if (twoWeeks === "true") {
      // Get last two weeks data
      const twoWeeksAgo = new Date()
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

      const where: Prisma.AttendanceWhereInput = {
        AND: [
          {
            date: {
              gte: twoWeeksAgo,
            },
          },
          ...(q ? [{ name: { contains: q } }] : []),
        ],
      }

      const data = await prisma.attendance.findMany({
        where,
        orderBy,
      })

      return NextResponse.json(data)
    }

    if (page !== null && pageSize !== null) {
      // Paginated query
      const pageNum = parseInt(page)
      const size = parseInt(pageSize)

      const where: Prisma.AttendanceWhereInput | undefined = q
        ? { name: { contains: q } }
        : undefined

      const [data, count] = await Promise.all([
        prisma.attendance.findMany({
          skip: pageNum * size,
          take: size,
          orderBy,
          where,
        }),
        prisma.attendance.count({ where }),
      ])

      return NextResponse.json({ data, count })
    }

    // Get all data
    const data = await prisma.attendance.findMany({
      ...(q ? { where: { name: { contains: q } } } : {}),
      orderBy,
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching attendance:", error)
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 })
  }
}

// POST /api/attendance - Create new attendance
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const data = await prisma.attendance.create({
      data: {
        date: new Date(body.date),
        name: body.name,
        giris: body.giris,
        cikis: body.cikis,
        izin: body.izin ?? 0,
      },
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error creating attendance:", error)
    return NextResponse.json({ error: "Failed to create data" }, { status: 500 })
  }
}
