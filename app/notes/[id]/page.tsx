"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  FileText, 
  Brain, 
  Network, 
  Calendar,
  ArrowLeft,
  Download,
  ExternalLink
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { MindmapVisualizer } from "@/components/mindmap-visualizer"
import Link from "next/link"

interface Note {
  id: string
  title: string
  transcript: string
  structuredNotes: string
  mindmapData?: string
  source: string
  sourceUrl?: string
  fileName?: string
  createdAt: string
  updatedAt: string
}

export default function NotePage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [note, setNote] = useState<Note | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated") {
      fetchNote()
    }
  }, [status, router, params.id])

  const fetchNote = async () => {
    try {
      const response = await fetch(`/api/notes/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setNote(data.note)
      } else if (response.status === 404) {
        toast({
          title: "Note Not Found",
          description: "The requested note could not be found.",
          variant: "destructive",
        })
        router.push("/dashboard")
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch note",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching note:", error)
      toast({
        title: "Error",
        description: "Failed to fetch note",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async (type: "transcript" | "notes" | "mindmap") => {
    if (!note) return

    setIsExporting(true)
    try {
      const content = type === "transcript" ? note.transcript : 
                    type === "notes" ? note.structuredNotes : 
                    note.mindmapData || ""

      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, type, format: "docx" }),
      })

      if (!response.ok) {
        throw new Error("Export failed")
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${note.title}-${type}-${Date.now()}.docx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Download Started",
        description: `Your ${type} document is being downloaded.`,
      })
    } catch (error) {
      console.error("Error downloading:", error)
      toast({
        title: "Download Failed",
        description: "There was an error downloading your document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
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
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  if (status === "unauthenticated" || !note) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{note.title}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>{getSourceIcon(note.source)}</span>
                  <span>{getSourceLabel(note.source)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                </div>
                {note.fileName && (
                  <div className="text-xs">
                    {note.fileName}
                  </div>
                )}
              </div>
            </div>
          </div>

          {note.sourceUrl && (
            <Alert>
              <ExternalLink className="h-4 w-4" />
              <AlertDescription>
                <a
                  href={note.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  View original source
                </a>
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="transcript" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="transcript" className="gap-2">
                <FileText className="w-4 h-4" />
                Transcript
              </TabsTrigger>
              <TabsTrigger value="notes" className="gap-2">
                <Brain className="w-4 h-4" />
                Structured Notes
              </TabsTrigger>
              <TabsTrigger value="mindmap" className="gap-2">
                <Network className="w-4 h-4" />
                Mindmap
              </TabsTrigger>
            </TabsList>

            <TabsContent value="transcript" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Transcript</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload("transcript")}
                      disabled={isExporting}
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      {isExporting ? "Exporting..." : "Download"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-secondary rounded-lg min-h-[300px] max-h-[500px] overflow-y-auto">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {note.transcript}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Structured Notes</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload("notes")}
                      disabled={isExporting}
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      {isExporting ? "Exporting..." : "Download"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-secondary rounded-lg min-h-[300px] max-h-[500px] overflow-y-auto">
                    <div className="prose prose-sm max-w-none prose-invert">
                      <div className="whitespace-pre-wrap">{note.structuredNotes}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mindmap" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Mindmap</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload("mindmap")}
                      disabled={isExporting || !note.mindmapData}
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      {isExporting ? "Exporting..." : "Download"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="p-8 bg-secondary rounded-lg min-h-[400px]">
                    {note.mindmapData ? (
                      <div className="w-full h-full">
                        <MindmapVisualizer data={note.mindmapData} />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center space-y-4">
                          <Network className="w-16 h-16 mx-auto text-primary" />
                          <div>
                            <h3 className="font-semibold mb-2">No Mindmap Available</h3>
                            <p className="text-sm text-muted-foreground max-w-md">
                              This note doesn't have a mindmap visualization.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}