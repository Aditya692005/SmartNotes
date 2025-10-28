"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Edit3, Check } from "lucide-react"

interface TranscriptionEditorProps {
  transcript: string
  onTranscriptChange: (transcript: string) => void
  onGenerateNotes?: () => void
  onGenerateMindmap?: () => void
  isGeneratingNotes?: boolean
  isGeneratingMindmap?: boolean
}

export function TranscriptionEditor({ 
  transcript, 
  onTranscriptChange, 
  onGenerateNotes, 
  onGenerateMindmap,
  isGeneratingNotes = false,
  isGeneratingMindmap = false
}: TranscriptionEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTranscript, setEditedTranscript] = useState(transcript)

  const handleSave = () => {
    onTranscriptChange(editedTranscript)
    setIsEditing(false)
  }

  const wordCount = transcript.split(/\s+/).filter(Boolean).length

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Transcript</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{wordCount} words</span>
            {!isEditing ? (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2">
                <Edit3 className="w-4 h-4" />
                Edit
              </Button>
            ) : (
              <Button size="sm" onClick={handleSave} className="gap-2">
                <Check className="w-4 h-4" />
                Save
              </Button>
            )}
          </div>
        </div>

        {isEditing ? (
          <Textarea
            value={editedTranscript}
            onChange={(e) => setEditedTranscript(e.target.value)}
            className="min-h-[400px] font-mono text-sm"
            placeholder="Edit your transcript here..."
          />
        ) : (
          <div className="p-4 bg-secondary rounded-lg min-h-[400px] max-h-[600px] overflow-y-auto">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {transcript ||
                "Your transcript will appear here. This is a sample transcript showing how the content will be displayed. You can edit this text by clicking the Edit button above. The transcript will be used to generate structured notes and mindmaps."}
            </p>
          </div>
        )}

        {!isEditing && (
          <div className="flex justify-end gap-3">
            {onGenerateMindmap && (
              <Button 
                onClick={onGenerateMindmap} 
                disabled={isGeneratingMindmap}
                variant="outline"
                size="lg"
              >
                {isGeneratingMindmap ? "Generating..." : "Generate Mindmap"}
              </Button>
            )}
            {onGenerateNotes && (
              <Button 
                onClick={onGenerateNotes} 
                disabled={isGeneratingNotes}
                size="lg"
              >
                {isGeneratingNotes ? "Generating..." : "Generate Notes"}
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
