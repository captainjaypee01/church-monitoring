import { db } from "@/lib/db"
import { networks } from "@/lib/db/schema"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const networksData = await db.select().from(networks)
    return NextResponse.json(networksData)
  } catch (error) {
    console.error("Error fetching networks:", error)
    return NextResponse.json({ error: "Failed to fetch networks" }, { status: 500 })
  }
}
