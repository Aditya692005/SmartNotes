"use client"

import { useState } from "react"
import { Mic, Youtube, Upload } from "lucide-react"
import { Card } from "@/components/ui/card"
import { LiveAudioRecorder } from "@/components/live-audio-recorder"
import { YoutubeInput } from "@/components/youtube-input"
import { FileUploader } from "@/components/file-uploader"

type InputMode = "live" | "youtube" | "upload" | null

export function InputModeSelector() {
  const [selectedMode, setSelectedMode] = useState<InputMode>(null)

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
      description: "Extract transcript from YouTube videos",
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
      {selectedMode === "youtube" && <YoutubeInput />}
      {selectedMode === "upload" && <FileUploader />}
    </div>
  )
}
