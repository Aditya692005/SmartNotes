"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Header } from "@/components/header"
import { YoutubeInput } from "@/components/youtube-input"
import { FileUploader } from "@/components/file-uploader"
import { LiveAudioRecorder } from "@/components/live-audio-recorder"
import { TranscriptionEditor } from "@/components/transcription-editor"
import { ProcessingSteps } from "@/components/processing-steps"
import { MindmapFlow } from "@/components/mindmap-flow"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Save, FileText, Brain, Network } from "lucide-react"

export default function ProcessPage() {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { data: session } = useSession()
  const [currentStep, setCurrentStep] = useState<"input" | "transcribing" | "editing" | "generating" | "complete">("input")
  const [transcript, setTranscript] = useState("")
  const [structuredNotes, setStructuredNotes] = useState("")
  const [mindmapData, setMindmapData] = useState<any>(null)
  const [error, setError] = useState("")
  const [source, setSource] = useState("")
  const [metadata, setMetadata] = useState<any>(null)
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false)
  const [isGeneratingMindmap, setIsGeneratingMindmap] = useState(false)

  useEffect(() => {
    const sourceParam = searchParams.get("source")
    if (sourceParam) {
      setSource(sourceParam)
      // Check for transcript data from sessionStorage
      if (typeof window !== 'undefined') {
        const transcriptData = sessionStorage.getItem("transcriptionData")
        if (transcriptData) {
          try {
            const data = JSON.parse(transcriptData)
            if (data.transcript) {
              setTranscript(data.transcript)
              setSource(data.source || "unknown")
              setMetadata(data.metadata)
              setCurrentStep("editing")
              // Clear the sessionStorage data
              sessionStorage.removeItem("transcriptionData")
            }
          } catch (error) {
            console.error("Error parsing transcript data:", error)
          }
        }
      }
    } else {
      // Check for transcript data from sessionStorage (fallback for direct navigation)
      if (typeof window !== 'undefined') {
        const transcriptData = sessionStorage.getItem("transcriptData") || sessionStorage.getItem("transcriptionData")
        if (transcriptData) {
          try {
            const data = JSON.parse(transcriptData)
            if (data.transcript) {
              setTranscript(data.transcript)
              setSource(data.source || "unknown")
              setMetadata(data.metadata)
              setCurrentStep("editing")
              // Clear the sessionStorage data
              sessionStorage.removeItem("transcriptData")
              sessionStorage.removeItem("transcriptionData")
            }
          } catch (error) {
            console.error("Error parsing transcript data:", error)
          }
        }
      }
    }
  }, [searchParams])

  const handleTranscriptGenerated = (newTranscript: string, newMetadata?: any) => {
    setTranscript(newTranscript)
    setMetadata(newMetadata)
    setCurrentStep("editing")
    setError("")
  }

  const handleError = (message: string) => {
    setError(message)
    setCurrentStep("input")
  }

  const handleGenerateNotes = async () => {
    if (!transcript) return

    setIsGeneratingNotes(true)
    setIsGeneratingMindmap(true)
    setCurrentStep("generating") // Set step to generating
    try {
      // Generate both notes and mindmap
      const [notesResponse, mindmapResponse] = await Promise.all([
        fetch("/api/generate-notes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ transcript }),
        }),
        fetch("/api/generate-mindmap", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ transcript }),
        })
      ])

      if (!notesResponse.ok) {
        const errorText = await notesResponse.text()
        let errorMessage = "Failed to generate notes"
        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.error || errorMessage
        } catch {
          errorMessage = errorText || errorMessage
        }
        throw new Error(errorMessage)
      }

      const notesResult = await notesResponse.json()
      if (notesResult.error) {
        throw new Error(notesResult.error)
      }

      setStructuredNotes(notesResult.structuredNotes)

      // Handle mindmap response
      if (mindmapResponse.ok) {
        const mindmapResult = await mindmapResponse.json()
        if (mindmapResult.mindmapData) {
          setMindmapData(mindmapResult.mindmapData)
        }
      }

      setCurrentStep("complete")
      toast({
        title: "Generation Complete",
        description: "Your notes and mindmap have been generated successfully.",
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred while generating notes."
      toast({
        title: "Generation Failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsGeneratingNotes(false)
      setIsGeneratingMindmap(false)
    }
  }

  const handleGenerateMindmap = async () => {
    if (!transcript) return

    setIsGeneratingMindmap(true)
    try {
      const response = await fetch("/api/generate-mindmap", {
          method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transcript }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = "Failed to generate mindmap"
        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.error || errorMessage
        } catch {
          errorMessage = errorText || errorMessage
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      if (result.error) {
        throw new Error(result.error)
      }

      // Store the raw mindmap data as a string (MindmapFlow will parse it)
      setMindmapData(result.mindmapData)
      setCurrentStep("complete")
      toast({
        title: "Mindmap Generated",
        description: "AI has generated an interactive mindmap from your transcript.",
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred while generating mindmap."
      toast({
        title: "Mindmap Generation Failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsGeneratingMindmap(false)
    }
  }

  const handleSave = async () => {
    if (!transcript) return

    try {
      const title = `Note from ${source} - ${new Date().toLocaleDateString()}`
      
      const response = await fetch("/api/notes/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          transcript,
          structuredNotes,
          mindmapData: mindmapData ? JSON.stringify(mindmapData) : null,
          source,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save note")
      }

      toast({
        title: "Note Saved",
        description: "Your note has been saved successfully.",
      })
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save your note. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDownload = async (type: "transcript" | "notes" | "mindmap") => {
    let content = ""
    switch (type) {
      case "transcript":
        content = transcript
        break
      case "notes":
        content = structuredNotes
        break
      case "mindmap":
        content = mindmapData ? JSON.stringify(mindmapData, null, 2) : ""
        break
    }

    if (!content) {
      toast({
        title: "No Content",
        description: `No ${type} content available to download.`,
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/export", {
          method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content, type, format: "docx" }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate download")
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
        description: `Your ${type} has been downloaded.`,
      })
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download file. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">Smart Notes Processing</h1>
            <p className="text-muted-foreground mt-2">
              Transform your content into structured notes and interactive mindmaps
            </p>
          </div>

          <ProcessingSteps currentStep={currentStep} />

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="text-red-800">
                  <strong>Error:</strong> {error}
              </div>
              </CardContent>
            </Card>
          )}

          {currentStep === "input" && (
            <Tabs defaultValue="youtube" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="youtube">📺 YouTube</TabsTrigger>
                <TabsTrigger value="upload">📁 Upload</TabsTrigger>
                <TabsTrigger value="record">🎤 Record</TabsTrigger>
              </TabsList>
              
              <TabsContent value="youtube" className="space-y-4">
                <YoutubeInput 
                  onTranscriptGenerated={handleTranscriptGenerated}
                  onError={handleError}
                />
              </TabsContent>
              
              <TabsContent value="upload" className="space-y-4">
                <FileUploader 
                  onTranscriptGenerated={handleTranscriptGenerated}
                  onError={handleError}
                />
              </TabsContent>
              
              <TabsContent value="record" className="space-y-4">
                <LiveAudioRecorder />
              </TabsContent>
            </Tabs>
          )}

          {currentStep === "editing" && transcript && (
            <Card>
              <CardHeader>
                <CardTitle>Review & Edit Transcript</CardTitle>
                <CardDescription>
                  Review the generated transcript and make any necessary edits before generating notes and mindmaps.
                </CardDescription>
              </CardHeader>
              <CardContent>
            <TranscriptionEditor
              transcript={transcript}
              onTranscriptChange={setTranscript}
                  onGenerateNotes={handleGenerateNotes}
                  onGenerateMindmap={handleGenerateMindmap}
                  isGeneratingNotes={isGeneratingNotes}
                  isGeneratingMindmap={isGeneratingMindmap}
                />
              </CardContent>
            </Card>
          )}

          {currentStep === "generating" && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Generating notes and mindmap...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === "complete" && (
            <Card className="p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Generated Outputs</h2>
                  <div className="flex items-center gap-2">
                    <Button onClick={handleSave} variant="outline" className="gap-2">
                      <Save className="w-4 h-4" />
                      Save Note
                    </Button>
                  </div>
                </div>

                <Tabs defaultValue="transcript" className="w-full">
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
                    <div className="p-4 bg-secondary rounded-lg min-h-[500px] max-h-[600px] overflow-y-auto">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {transcript || "Transcript will be displayed here..."}
                      </p>
                    </div>
                    <Button onClick={() => handleDownload("transcript")} className="gap-2">
                      <Download className="w-4 h-4" />
                      Download Transcript (.docx)
                    </Button>
                  </TabsContent>

                  <TabsContent value="notes" className="space-y-4">
                    <div className="p-4 bg-secondary rounded-lg min-h-[500px] max-h-[600px] overflow-y-auto">
                      <div className="prose prose-sm max-w-none prose-invert">
                        {structuredNotes ? (
                          <div className="whitespace-pre-wrap">{structuredNotes}</div>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-sm text-muted-foreground">Notes will be generated here...</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button onClick={() => handleDownload("notes")} disabled={!structuredNotes} className="gap-2">
                      <Download className="w-4 h-4" />
                      Download Notes (.docx)
                    </Button>
                  </TabsContent>

                  <TabsContent value="mindmap" className="space-y-4">
                    <div className="p-8 bg-secondary rounded-lg min-h-[500px]">
                      {mindmapData ? (
                        <div className="w-full h-full">
                          <MindmapFlow data={mindmapData} />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center space-y-4">
                            <Network className="w-16 h-16 mx-auto text-primary" />
                            <div>
                              <h3 className="font-semibold mb-2">Mindmap Visualization</h3>
                              <p className="text-sm text-muted-foreground max-w-md">
                                Mindmap will be generated here...
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <Button onClick={() => handleDownload("mindmap")} disabled={!mindmapData} className="gap-2">
                      <Download className="w-4 h-4" />
                      Download Mindmap (.docx)
                    </Button>
                  </TabsContent>
                </Tabs>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}