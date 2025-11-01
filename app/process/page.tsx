"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { TranscriptionEditor } from "@/components/transcription-editor";
import { ProcessingSteps } from "@/components/processing-steps";
import { OutputOptions } from "@/components/output-options";
import { useToast } from "@/hooks/use-toast";

export default function ProcessPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<
    "transcribing" | "editing" | "generating" | "complete"
  >("transcribing");
  const [transcript, setTranscript] = useState("");
  const [structuredNotes, setStructuredNotes] = useState("");
  const [mindmap, setMindmap] = useState("");
  const [error, setError] = useState("");
  const hasTranscribedRef = useRef(false);

  useEffect(() => {
    const source = searchParams.get("source");

    if (!hasTranscribedRef.current && source) {
      hasTranscribedRef.current = true;
      transcribeContent(source);
    }
  }, []);

  const transcribeContent = async (source: string | null) => {
    try {
      setCurrentStep("transcribing");

      if (source === "live-audio") {
        const transcriptionData = sessionStorage.getItem("transcriptionData");
        if (!transcriptionData) {
          throw new Error("No transcription data found");
        }

        const { transcript: webSpeechTranscript } =
          JSON.parse(transcriptionData);
        if (!webSpeechTranscript) {
          throw new Error("No transcript generated from speech recognition");
        }

        setTranscript(webSpeechTranscript);
        sessionStorage.removeItem("transcriptionData");
      } else if (source === "youtube") {
        const youtubeUrl = sessionStorage.getItem("youtubeUrl");
        if (!youtubeUrl) {
          throw new Error("No YouTube URL found");
        }

        const response = await fetch("/api/youtube-transcript", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: youtubeUrl }),
        });

        const result = await response.json();
        if (result.error) throw new Error(result.error);
        setTranscript(result.transcript);
        sessionStorage.removeItem("youtubeUrl");
      } else if (source === "file-upload") {
        const transcriptionData = sessionStorage.getItem("transcriptionData");
        if (!transcriptionData) {
          throw new Error("No transcription data found");
        }

        const { transcript: fileTranscript } = JSON.parse(transcriptionData);
        if (!fileTranscript) {
          throw new Error("No transcript received from whisper websocket");
        }

        setTranscript(fileTranscript);
        sessionStorage.removeItem("transcriptionData");
      }

      setCurrentStep("editing");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to process content";
      setError(errorMessage);
      toast({
        title: "Processing Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Processing Your Content</h1>
            <p className="text-muted-foreground">
              Follow the steps below to generate your notes and mindmaps
            </p>
          </div>

          <ProcessingSteps currentStep={currentStep} />

          {currentStep === "transcribing" && (
            <div className="text-center py-12">
              <div className="inline-flex items-center gap-3 text-muted-foreground">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <span>Transcribing audio to text...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive rounded-lg text-destructive">
              <p className="font-semibold">Error: {error}</p>
            </div>
          )}

          {(currentStep === "editing" ||
            currentStep === "generating" ||
            currentStep === "complete") && (
            <TranscriptionEditor
              transcript={transcript}
              onTranscriptChange={setTranscript}
              onContinue={() => setCurrentStep("generating")}
            />
          )}

          {(currentStep === "generating" || currentStep === "complete") && (
            <OutputOptions
              transcript={transcript}
              structuredNotes={structuredNotes}
              mindmap={mindmap}
              isGenerating={currentStep === "generating"}
              onComplete={() => setCurrentStep("complete")}
            />
          )}
        </div>
      </main>
    </div>
  );
}
