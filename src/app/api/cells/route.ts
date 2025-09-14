import { db } from "@/lib/db"
import { cells } from "@/lib/db/schema"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const cellsData = await db.select().from(cells)
    return NextResponse.json(cellsData)
  } catch (error) {
    console.error("Error fetching cells:", error)
    return NextResponse.json({ error: "Failed to fetch cells" }, { status: 500 })
  }
}
