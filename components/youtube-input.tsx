"use client"

import { useState, useEffect } from "react"
import { Youtube, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { ConfirmationDialog } from "./confirmation-dialog"
import { useToast } from "@/hooks/use-toast"

interface YoutubeInputProps {
  onTranscriptGenerated: (transcript: string, metadata?: any) => void
  onError: (message: string) => void
}

export function YoutubeInput({ onTranscriptGenerated, onError }: YoutubeInputProps) {
  const router = useRouter()
  const [url, setUrl] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleProcess = async () => {
    if (!url) return
    setShowConfirmation(true)
  }

  const handleConfirm = async () => {
    setShowConfirmation(false)
    setIsProcessing(true)
    onError("") // Clear previous errors

    try {
      const response = await fetch("/api/youtube-audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = "Failed to process YouTube video"
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

      onTranscriptGenerated(result.transcript, {
        videoTitle: result.videoTitle,
        videoId: result.videoId,
        audioSize: result.audioSize
      })

      toast({
        title: "Transcription Complete",
        description: `Successfully transcribed: ${result.videoTitle}`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred during transcription."
      onError(message)
      toast({
        title: "Transcription Failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancel = () => {
    setShowConfirmation(false)
  }

  return (
    <>
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Youtube className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">YouTube Video Processing</h3>
          </div>

          <p className="text-sm text-muted-foreground">
            Enter a YouTube video URL to extract its transcript and process it.
            <br />
            <strong>Note:</strong> This extracts the transcript directly from YouTube's captions/subtitles.
          </p>

          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <strong>📝 Transcript Method:</strong> Extracts captions/subtitles directly from YouTube.
              Works with videos that have captions enabled!
            </p>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleProcess} disabled={!url || isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Extracting Transcript...
                </>
              ) : (
                "Extract Transcript"
              )}
            </Button>
          </div>

          {isProcessing && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Extracting transcript from YouTube captions...</div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: "60%" }} />
              </div>
            </div>
          )}
        </div>
      </Card>

      <ConfirmationDialog
        open={showConfirmation}
        title="Process YouTube Video"
        description={`The transcript from this YouTube video will be extracted and processed to generate notes and mindmaps. Continue?`}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText="Process"
        cancelText="Cancel"
      />
    </>
  )
}
