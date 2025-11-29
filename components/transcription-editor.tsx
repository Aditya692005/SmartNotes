"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Edit3, Check } from "lucide-react";

interface TranscriptionEditorProps {
  transcript: string;
  onTranscriptChange: (transcript: string) => void;
  onContinue: () => void;
}

export function TranscriptionEditor({
  transcript,
  onTranscriptChange,
  onContinue,
}: TranscriptionEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState(transcript);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // keep editedTranscript in sync when parent updates transcript
  useEffect(() => {
    console.log("🔍 TranscriptionEditor received transcript:", transcript); // Debug log
    setEditedTranscript(transcript);
  }, [transcript]);

  const handleSave = () => {
    onTranscriptChange(editedTranscript);
    setIsEditing(false);
  };

  const displayedText = isEditing ? editedTranscript : transcript;
  const wordCount = (displayedText || "").split(/\s+/).filter(Boolean).length;

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Transcript</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {wordCount} words
            </span>
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="gap-2"
              >
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
              {/* ✅ Only show sample text if transcript is truly empty */}
              {transcript && transcript.trim()
                ? transcript
                : "Your transcript will appear here. This is a sample transcript showing how the content will be displayed. You can edit this text by clicking the Edit button above. The transcript will be used to generate structured notes and mindmaps."}
            </p>
          </div>
        )}

        {!isEditing && (
          <div className="flex justify-end">
            <Button
              onClick={async () => {
                // Use the latest text (if user was editing, use editedTranscript)
                const payloadTranscript = editedTranscript || transcript;

                // update parent transcript so other components see the latest text
                onTranscriptChange(payloadTranscript);

                setIsSubmitting(true);
                try {
                  const res = await fetch("/api/generate-notes", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ transcript: payloadTranscript }),
                  });

                  const data = await res.json();

                  if (!res.ok) {
                    console.error("Generate notes failed:", data);
                    alert(data?.error || "Failed to generate notes");
                    return;
                  }

                  // store structuredNotes so other parts of the app can access if needed
                  if (data?.notes) {
                    try {
                      sessionStorage.setItem("structuredNotes", data.notes);
                    } catch (e) {
                      console.error("Storage error:", e);
                    }
                  }

                  onContinue();
                } catch (err) {
                  console.error("Error calling /api/generate-notes:", err);
                  alert("Failed to generate notes. Check console for details.");
                } finally {
                  setIsSubmitting(false);
                }
              }}
              size="lg"
              disabled={isSubmitting || !transcript?.trim()}
            >
              {isSubmitting ? "Generating..." : "Continue to Generate Notes"}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
