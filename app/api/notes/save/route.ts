import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const saveNoteSchema = z.object({
  title: z.string().min(1, "Title is required"),
  transcript: z.string().min(1, "Transcript is required"),
  structuredNotes: z.string().min(1, "Structured notes are required"),
  mindmapData: z.string().optional(),
  source: z.string().min(1, "Source is required"),
  sourceUrl: z.string().optional(),
  fileName: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, transcript, structuredNotes, mindmapData, source, sourceUrl, fileName } = saveNoteSchema.parse(body)

    const note = await prisma.note.create({
      data: {
        title,
        transcript,
        structuredNotes,
        mindmapData,
        source,
        sourceUrl,
        fileName,
        userId: session.user.id,
      },
    })

    return NextResponse.json(
      { message: "Note saved successfully", note },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error("Save note error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}