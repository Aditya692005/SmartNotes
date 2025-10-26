"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, FileText, Brain, Network, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface OutputOptionsProps {
  transcript: string
  structuredNotes: string
  mindmap: string
  isGenerating: boolean
  onComplete: () => void
}

export function OutputOptions({ transcript, structuredNotes, mindmap, isGenerating, onComplete }: OutputOptionsProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("transcript")
  const [notes, setNotes] = useState(structuredNotes)
  const [mindmapData, setMindmapData] = useState(mindmap)
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    if (isGenerating && transcript && !notes && !mindmapData) {
      generateContent()
    }
  }, [isGenerating, transcript])

  const generateContent = async () => {
    setIsLoading(true)

    try {
      // Generate structured notes
      const notesResponse = await fetch("/api/generate-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      })
      const notesData = await notesResponse.json()
      setNotes(notesData.structuredNotes)

      // Generate mindmap
      const mindmapResponse = await fetch("/api/generate-mindmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      })
      const mindmapResponseData = await mindmapResponse.json()
      setMindmapData(mindmapResponseData.mindmapData)

      onComplete()

      toast({
        title: "Generation Complete",
        description: "Your notes and mindmap have been generated successfully.",
      })
    } catch (error) {
      console.error("Error generating content:", error)
      toast({
        title: "Generation Failed",
        description: "There was an error generating your content. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async (type: "transcript" | "notes" | "mindmap") => {
    setIsExporting(true)

    try {
      const content = type === "transcript" ? transcript : type === "notes" ? notes : mindmapData

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
      a.download = `smartnotes-${type}-${Date.now()}.docx`
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

  const handleDownloadAll = async () => {
    await handleDownload("transcript")
    await new Promise((resolve) => setTimeout(resolve, 500))
    await handleDownload("notes")
    await new Promise((resolve) => setTimeout(resolve, 500))
    await handleDownload("mindmap")
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Generated Outputs</h2>
          <div className="flex items-center gap-3">
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </div>
            )}
            {!isLoading && notes && mindmapData && (
              <Button
                variant="outline"
                onClick={handleDownloadAll}
                disabled={isExporting}
                className="gap-2 bg-transparent"
              >
                <Download className="w-4 h-4" />
                Download All
              </Button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="transcript" className="gap-2">
              <FileText className="w-4 h-4" />
              Transcript
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-2" disabled={isLoading}>
              <Brain className="w-4 h-4" />
              Structured Notes
            </TabsTrigger>
            <TabsTrigger value="mindmap" className="gap-2" disabled={isLoading}>
              <Network className="w-4 h-4" />
              Mindmap
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transcript" className="space-y-4">
            <div className="p-4 bg-secondary rounded-lg min-h-[300px] max-h-[500px] overflow-y-auto">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {transcript || "Complete transcript will be displayed here..."}
              </p>
            </div>
            <Button onClick={() => handleDownload("transcript")} disabled={isExporting} className="gap-2">
              <Download className="w-4 h-4" />
              {isExporting ? "Exporting..." : "Download Transcript (.docx)"}
            </Button>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <div className="p-4 bg-secondary rounded-lg min-h-[300px] max-h-[500px] overflow-y-auto">
              <div className="prose prose-sm max-w-none prose-invert">
                {notes ? (
                  <div className="whitespace-pre-wrap">{notes}</div>
                ) : (
                  <>
                    <h3>Key Points</h3>
                    <ul>
                      <li>Main concept 1 extracted from the transcript</li>
                      <li>Important detail about the topic discussed</li>
                      <li>Supporting information and examples</li>
                    </ul>
                    <h3>Summary</h3>
                    <p>
                      AI-generated summary of the main ideas and concepts discussed in the audio content. This section
                      provides a concise overview of the key takeaways.
                    </p>
                    <h3>Action Items</h3>
                    <ul>
                      <li>Follow-up task identified from the content</li>
                      <li>Additional research topics mentioned</li>
                    </ul>
                  </>
                )}
              </div>
            </div>
            <Button onClick={() => handleDownload("notes")} disabled={!notes || isExporting} className="gap-2">
              <Download className="w-4 h-4" />
              {isExporting ? "Exporting..." : "Download Notes (.docx)"}
            </Button>
          </TabsContent>

          <TabsContent value="mindmap" className="space-y-4">
            <div className="p-8 bg-secondary rounded-lg min-h-[400px]">
              {mindmapData ? (
                <div className="w-full">
                  <pre className="text-sm whitespace-pre-wrap overflow-x-auto">{mindmapData}</pre>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-4">
                    <Network className="w-16 h-16 mx-auto text-primary" />
                    <div>
                      <h3 className="font-semibold mb-2">Mindmap Visualization</h3>
                      <p className="text-sm text-muted-foreground max-w-md">
                        A visual representation of key concepts and their relationships will be displayed here. The
                        mindmap shows hierarchical connections between main topics and subtopics.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <Button onClick={() => handleDownload("mindmap")} disabled={!mindmapData || isExporting} className="gap-2">
              <Download className="w-4 h-4" />
              {isExporting ? "Exporting..." : "Download Mindmap (.docx)"}
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  )
}
