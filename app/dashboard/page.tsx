"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  FileText, 
  Calendar, 
  ExternalLink, 
  Trash2, 
  Eye,
  Loader2,
  Plus
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface Note {
  id: string
  title: string
  source: string
  sourceUrl?: string
  fileName?: string
  createdAt: string
  updatedAt: string
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated") {
      fetchNotes()
    }
  }, [status, router])

  const fetchNotes = async () => {
    try {
      const response = await fetch("/api/notes")
      if (response.ok) {
        const data = await response.json()
        setNotes(data.notes)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch notes",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching notes:", error)
      toast({
        title: "Error",
        description: "Failed to fetch notes",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    setIsDeleting(noteId)
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setNotes(notes.filter(note => note.id !== noteId))
        toast({
          title: "Note Deleted",
          description: "The note has been deleted successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to delete note",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting note:", error)
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "live-audio":
        return "🎤"
      case "youtube":
        return "📺"
      case "file-upload":
        return "📁"
      default:
        return "📄"
    }
  }

  const getSourceLabel = (source: string) => {
    switch (source) {
      case "live-audio":
        return "Live Audio"
      case "youtube":
        return "YouTube Video"
      case "file-upload":
        return "File Upload"
      default:
        return "Unknown"
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">My Notes</h1>
              <p className="text-muted-foreground">
                View and manage your saved notes and mindmaps
              </p>
            </div>
            <Link href="/">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create New Note
              </Button>
            </Link>
          </div>

          {notes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No notes yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Start by creating your first note from audio, video, or file content.
                </p>
                <Link href="/">
                  <Button>Get Started</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {notes.map((note) => (
                <Card key={note.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-lg line-clamp-2">
                          {note.title}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <span>{getSourceIcon(note.source)}</span>
                          <span>{getSourceLabel(note.source)}</span>
                          {note.fileName && (
                            <span className="text-xs text-muted-foreground">
                              • {note.fileName}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteNote(note.id)}
                        disabled={isDeleting === note.id}
                        className="text-destructive hover:text-destructive"
                      >
                        {isDeleting === note.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(note.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {note.sourceUrl && (
                        <div className="flex items-center gap-2">
                          <ExternalLink className="w-4 h-4 text-muted-foreground" />
                          <a
                            href={note.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline truncate"
                          >
                            View Source
                          </a>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Link href={`/notes/${note.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full gap-2">
                            <Eye className="w-4 h-4" />
                            View Note
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}