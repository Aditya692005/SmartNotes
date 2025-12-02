"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
    const source = searchParams.get("source") ?? "";

    if (!hasTranscribedRef.current && source) {
      hasTranscribedRef.current = true;
      transcribeContent(source);
    }
  }, [searchParams]);

  // Mark the pipeline as complete only when both notes and mindmap are present
  // and the mindmap is a rendered SVG. This prevents false completion when
  // only raw Mermaid markup is available.
  const isSvg = (content?: string) => {
    if (!content) return false;
    return /<svg[\s>]/i.test(content.trim());
  };

  useEffect(() => {
    if (
      structuredNotes &&
      structuredNotes.trim() &&
      mindmap &&
      mindmap.trim() &&
      isSvg(mindmap)
    ) {
      setCurrentStep("complete");
    }
  }, [structuredNotes, mindmap]);

  const transcribeContent = async (source: string) => {
    try {
      setCurrentStep("transcribing");

      if (source === "youtube") {
        // ✅ Get the correct key "transcriptionData"
        const storedData = sessionStorage.getItem("transcriptionData");

        if (!storedData) {
          throw new Error("Transcript not found");
        }

        // ✅ Parse the JSON and extract transcript
        const parsedData = JSON.parse(storedData);
        setTranscript(parsedData.transcript);

        // ✅ Clean up sessionStorage
        sessionStorage.removeItem("transcriptionData");
      } else if (source === "live-audio" || source === "file-upload") {
        // Handle live-audio source
        const storedData = sessionStorage.getItem("transcriptionData");

        if (!storedData) {
          throw new Error("Transcript not found");
        }

        const parsedData = JSON.parse(storedData);
        setTranscript(parsedData.transcript);
        // If this was a file upload, we can optionally store fileName or source metadata
        // into state if needed later (storedData includes fileName for file-upload)
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

  // Save note to DB when generation is complete
  const noteSavedRef = useRef(false);
  const saveNote = async () => {
    if (
      currentStep === "complete" &&
      transcript &&
      structuredNotes &&
      mindmap &&
      transcript.trim() &&
      structuredNotes.trim() &&
      mindmap.trim()
    ) {
      // Prevent duplicate saves
      if (noteSavedRef.current) return;
      noteSavedRef.current = true;
      try {
        // Try to get a title from the first heading in notes, else fallback
        let title = "Untitled Note";
        const headingMatch = structuredNotes.match(/^# (.+)$/m);
        if (headingMatch) title = headingMatch[1].trim();

        // Try to get source info from sessionStorage (if available)
        let source = searchParams.get("source") || "unknown";
        let sourceUrl = undefined;
        let fileName = undefined;
        if (source === "youtube") {
          const stored = sessionStorage.getItem("transcriptionData");
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (parsed.url) sourceUrl = parsed.url;
            } catch {}
          }
          // Also try to get from searchParams
          sourceUrl = sourceUrl || searchParams.get("url") || undefined;
        } else if (source === "file-upload") {
          const stored = sessionStorage.getItem("transcriptionData");
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (parsed.fileName) fileName = parsed.fileName;
            } catch {}
          }
        }

        const res = await fetch("/api/notes/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            transcript,
            structuredNotes,
            mindmapData: mindmap,
            source,
            sourceUrl,
            fileName,
          }),
        });
        if (res.ok) {
          toast({
            title: "Note Saved!",
            description: "Your note has been saved to the dashboard.",
          });
        } else {
          const data = await res.json();
          toast({
            title: "Save Failed",
            description: data?.error || "Could not save note.",
            variant: "destructive",
          });
        }
      } catch (err) {
        toast({
          title: "Save Failed",
          description: "Could not save note.",
          variant: "destructive",
        });
      }
    }
  };
  useEffect(() => {
    saveNote();
  }, [currentStep, transcript, structuredNotes, mindmap, searchParams, toast]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Processing Your Content</h1>
            <p className="text-muted-foreground">
              Follow the steps below to generate your notes and mindmaps.
            </p>
          </div>

          <ProcessingSteps currentStep={currentStep} />

          {currentStep === "transcribing" && (
            <div className="text-center py-12">
              <div className="inline-flex items-center gap-3 text-muted-foreground">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <span>Transcribing...</span>
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
              // Default to 'generating' when continuing and allow explicit
              // nextStep override from child components.
              onContinue={(nextStep) =>
                setCurrentStep(nextStep ?? "generating")
              }
              onNotesGenerated={setStructuredNotes}
            />
          )}

          {(currentStep === "generating" || currentStep === "complete") && (
            <OutputOptions
              transcript={transcript}
              structuredNotes={structuredNotes}
              mindmap={mindmap}
              isGenerating={currentStep === "generating"}
              onComplete={() => setCurrentStep("complete")}
              onNotesGenerated={setStructuredNotes}
              onMindmapGenerated={setMindmap}
            />
          )}

          {/* When the processing reaches the complete state, provide a simple
              link back to the home page so users can continue their workflow. */}
          {currentStep === "complete" && (
            <div className="mt-6 flex justify-center">
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full max-w-md"
              >
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
