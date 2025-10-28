"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Upload, File, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { ConfirmationDialog } from "./confirmation-dialog"
import { useToast } from "@/hooks/use-toast"

interface FileUploaderProps {
  onTranscriptGenerated: (transcript: string, metadata?: any) => void
  onError: (message: string) => void
}

export function FileUploader({ onTranscriptGenerated, onError }: FileUploaderProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file && isValidFileType(file)) {
      setSelectedFile(file)
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && isValidFileType(file)) {
      setSelectedFile(file)
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

  const handleProcessFile = () => {
    if (selectedFile) {
      setShowConfirmation(true)
    }
  }

  const handleConfirm = async () => {
    setShowConfirmation(false)
    if (!selectedFile) return
    
    setIsProcessing(true)
    onError("") // Clear previous errors

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
          errorMessage = errorText || errorMessage
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      if (result.error) {
        throw new Error(result.error)
      }

      onTranscriptGenerated(result.transcript, {
        fileName: result.fileName,
        fileSize: result.fileSize,
        fileType: result.fileType
      })

      toast({
        title: "Transcription Complete",
        description: `Successfully transcribed: ${result.fileName}`,
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
            <Upload className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Upload Media File</h3>
          </div>

          <p className="text-sm text-muted-foreground">Supported formats: MP3, WAV, MP4, AVI, MKV</p>

          {!selectedFile ? (
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                isDragging ? "border-primary bg-primary/5" : "border-border"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">Drag and drop your file here, or click to browse</p>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".mp3,.wav,.mp4,.avi,.mkv,audio/*,video/*"
                onChange={handleFileSelect}
              />
              <Button asChild variant="outline">
                <label htmlFor="file-upload" className="cursor-pointer">
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
                <Button variant="ghost" size="icon" onClick={() => setSelectedFile(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <Button className="w-full" onClick={handleProcessFile} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Transcribing...
                  </>
                ) : (
                  "Process File"
                )}
              </Button>
            </div>
          )}
        </div>
      </Card>

      <ConfirmationDialog
        open={showConfirmation}
        title="Process Media File"
        description={`The file "${selectedFile?.name}" will be processed to generate notes and mindmaps. Continue?`}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText="Process"
        cancelText="Cancel"
      />
    </>
  )
}
