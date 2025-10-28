"use client"

import { useState } from "react"
import { Upload, File, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

interface FileUploadProcessorProps {
  onTranscriptGenerated: (transcript: string) => void
  onError: (error: string) => void
}

export function FileUploadProcessor({ onTranscriptGenerated, onError }: FileUploadProcessorProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && isValidFileType(file)) {
      setSelectedFile(file)
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a valid audio or video file.",
        variant: "destructive",
      })
    }
  }

  const isValidFileType = (file: File) => {
    const validTypes = ["audio/mpeg", "audio/wav", "video/mp4", "video/x-msvideo", "video/x-matroska"]
    const validExtensions = [".mp3", ".wav", ".mp4", ".avi", ".mkv"]
    return validTypes.includes(file.type) || validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  const handleProcessFile = async () => {
    if (!selectedFile) return

    setIsProcessing(true)
    
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const response = await fetch("/api/file-audio", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = "Failed to transcribe file"
        
        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.error || errorMessage
        } catch {
          // If it's not JSON, use the text as error message
          errorMessage = errorText || errorMessage
        }
        
        throw new Error(errorMessage)
      }

      const result = await response.json()
      
      if (result.error) {
        throw new Error(result.error)
      }

      onTranscriptGenerated(result.transcript)
      
      toast({
        title: "Transcription Complete",
        description: "Your file has been successfully transcribed.",
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to transcribe file"
      onError(errorMessage)
      toast({
        title: "Transcription Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Upload Media File</h3>
        </div>

        <p className="text-sm text-muted-foreground">Supported formats: MP3, WAV, MP4, AVI, MKV</p>

        {!selectedFile ? (
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">Select your audio or video file</p>
            <input
              type="file"
              id="file-upload-process"
              className="hidden"
              accept=".mp3,.wav,.mp4,.avi,.mkv,audio/*,video/*"
              onChange={handleFileSelect}
            />
            <Button asChild variant="outline">
              <label htmlFor="file-upload-process" className="cursor-pointer">
                Choose File
              </label>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg">
              <File className="w-8 h-8 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>

            <Button 
              className="w-full" 
              onClick={handleProcessFile}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Process File"
              )}
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
