"use client"

import { useState } from "react"
import { Youtube, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { ConfirmationDialog } from "./confirmation-dialog"

export function YoutubeInput() {
  const router = useRouter()
  const [url, setUrl] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const handleProcess = async () => {
    if (!url) return
    setShowConfirmation(true)
  }

  const handleConfirm = () => {
    setShowConfirmation(false)
    sessionStorage.setItem("youtubeUrl", url)
    router.push("/process?source=youtube")
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
            Enter a YouTube video URL to extract and process its transcript
          </p>

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
                  Processing
                </>
              ) : (
                "Process"
              )}
            </Button>
          </div>

          {isProcessing && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Fetching transcript from YouTube...</div>
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
