"use client"

import { useState } from "react"
import { Mic, Youtube, Upload, ArrowRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LiveAudioRecorder } from "@/components/live-audio-recorder"
import { YoutubeInput } from "@/components/youtube-input"
import { FileUploader } from "@/components/file-uploader"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

type InputMode = "live" | "youtube" | "upload" | null

export function InputModeSelector() {
  const [selectedMode, setSelectedMode] = useState<InputMode>(null)
  const [transcript, setTranscript] = useState("")
  const [metadata, setMetadata] = useState<any>(null)
  const [error, setError] = useState("")
  const { toast } = useToast()
  const router = useRouter()

  const handleTranscriptGenerated = (newTranscript: string, newMetadata?: any) => {
    setTranscript(newTranscript)
    setMetadata(newMetadata)
    setError("")
    toast({
      title: "Transcription Complete",
      description: "Your content has been transcribed successfully!",
    })
  }

  const handleError = (message: string) => {
    setError(message)
    setTranscript("")
    setMetadata(null)
  }

  const handleGoToProcess = () => {
    // Store transcript in sessionStorage for the process page
    if (typeof window !== 'undefined') {
      sessionStorage.setItem("transcriptData", JSON.stringify({
        transcript,
        source: selectedMode,
        metadata
      }))
    }
    router.push("/process")
  }

  const modes = [
    {
      id: "live" as const,
      title: "Live Recording",
      description: "Record audio directly from your microphone",
      icon: Mic,
    },
    {
      id: "youtube" as const,
      title: "YouTube Video",
      description: "Download audio from YouTube videos and transcribe",
      icon: Youtube,
    },
    {
      id: "upload" as const,
      title: "Upload File",
      description: "Upload audio or video files (MP3, WAV, MP4)",
      icon: Upload,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        {modes.map((mode) => {
          const Icon = mode.icon
          const isSelected = selectedMode === mode.id

          return (
            <Card
              key={mode.id}
              className={`p-6 cursor-pointer transition-all hover:border-primary ${
                isSelected ? "border-primary bg-primary/5" : ""
              }`}
              onClick={() => setSelectedMode(mode.id)}
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{mode.title}</h3>
                  <p className="text-sm text-muted-foreground">{mode.description}</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Render selected mode component */}
      {selectedMode === "live" && <LiveAudioRecorder />}
      {selectedMode === "youtube" && (
        <YoutubeInput 
          onTranscriptGenerated={handleTranscriptGenerated}
          onError={handleError}
        />
      )}
      {selectedMode === "upload" && (
        <FileUploader 
          onTranscriptGenerated={handleTranscriptGenerated}
          onError={handleError}
        />
      )}

      {/* Show transcript if available */}
      {transcript && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Generated Transcript</h3>
              {metadata && (
                <div className="text-sm text-muted-foreground">
                  {metadata.videoTitle && `Video: ${metadata.videoTitle}`}
                  {metadata.fileName && `File: ${metadata.fileName}`}
                </div>
              )}
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-64 overflow-y-auto">
              <p className="text-sm whitespace-pre-wrap">{transcript}</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                <strong>Next Steps:</strong> Generate notes and mindmaps from this transcript.
              </div>
              <Button onClick={handleGoToProcess} className="flex items-center gap-2">
                Generate Notes & Mindmap
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Show error if any */}
      {error && (
        <Card className="p-6 border-red-200 bg-red-50 dark:bg-red-950/20">
          <div className="text-red-800 dark:text-red-200">
            <strong>Error:</strong> {error}
          </div>
        </Card>
      )}
    </div>
  )
}