"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Pause, Play, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { ConfirmationDialog } from "./confirmation-dialog";

type RecordingState = "idle" | "recording" | "paused";

export function LiveAudioRecorder() {
  const router = useRouter();
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [duration, setDuration] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef("");
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        "Your browser does not support the Web Speech API. Please use Chrome."
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }
      setTranscript(finalTranscriptRef.current + interimTranscript);
    };

    recognition.onerror = (event: any) => {
      // Don't show error for "aborted" - this is expected when stopping/pausing
      if (event.error === "aborted") {
        console.log("Speech recognition aborted (expected)");
        return;
      }
      console.error("Speech recognition error:", event.error);
      
      // Only set error for non-abort errors
      if (event.error !== "aborted") {
        setError(`Speech recognition error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        setShowConfirmation(true);
      };

      mediaRecorder.start();
      setRecordingState("recording");

      if (recognitionRef.current) {
        finalTranscriptRef.current = "";
        setTranscript("");
        try {
          recognitionRef.current.start();
        } catch (err) {
          console.error("Failed to start speech recognition:", err);
          setError(
            "Speech recognition unavailable. Audio will be recorded and can be transcribed later."
          );
        }
      }

      intervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setError("Unable to access microphone. Please check permissions.");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState === "recording") {
      mediaRecorderRef.current.pause();
      setRecordingState("paused");
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (recognitionRef.current) {
        try {
          // Stop recognition gracefully
          if (isListening) {
            recognitionRef.current.stop();
          }
        } catch (err) {
          console.error("Error stopping recognition:", err);
        }
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingState === "paused") {
      mediaRecorderRef.current.resume();
      setRecordingState("recording");
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (err) {
          console.error("Error resuming recognition:", err);
        }
      }
      intervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      setRecordingState("idle");
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (recognitionRef.current) {
        try {
          // Stop recognition gracefully instead of aborting
          if (isListening) {
            recognitionRef.current.stop();
          }
        } catch (err) {
          console.error("Error stopping recognition:", err);
        }
      }
    }
  };

  const retryTranscription = () => {
    setError(null);
    if (recognitionRef.current && recordingState === "recording") {
      finalTranscriptRef.current = "";
      setTranscript("");
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Error retrying recognition:", err);
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleConfirm = () => {
    setShowConfirmation(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(
        "transcriptionData",
        JSON.stringify({
          transcript:
            finalTranscriptRef.current.trim() ||
            "(Audio recorded - will be transcribed on processing)",
          source: "live-audio",
        })
      );
    }
    router.push("/process?source=live-audio");
  };

  const handleCancel = () => {
    setShowConfirmation(false);
  };

  return (
    <>
      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Live Audio Recording</h3>
            <div className="text-2xl font-mono text-muted-foreground">
              {formatDuration(duration)}
            </div>
          </div>

          {recordingState === "recording" && (
            <div className="flex items-center gap-2 text-sm text-primary">
              <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
              Recording in progress...
            </div>
          )}

          {recordingState === "paused" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Pause className="w-4 h-4" />
              Recording paused
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                {recordingState === "recording" && (
                  <Button
                    onClick={retryTranscription}
                    variant="outline"
                    size="sm"
                    className="ml-4 bg-transparent"
                  >
                    Retry
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          {transcript && (
            <div className="p-4 bg-muted rounded-lg border border-border">
              <p className="text-sm text-muted-foreground mb-2">
                Live Transcript:
              </p>
              <p className="text-sm leading-relaxed">{transcript}</p>
            </div>
          )}

          <div className="flex items-center gap-3">
            {recordingState === "idle" && (
              <Button onClick={startRecording} className="gap-2">
                <Mic className="w-4 h-4" />
                Start Recording
              </Button>
            )}

            {recordingState === "recording" && (
              <>
                <Button
                  onClick={pauseRecording}
                  variant="outline"
                  className="gap-2 bg-transparent"
                >
                  <Pause className="w-4 h-4" />
                  Pause
                </Button>
                <Button
                  onClick={stopRecording}
                  variant="destructive"
                  className="gap-2"
                >
                  <Square className="w-4 h-4" />
                  Stop
                </Button>
              </>
            )}

            {recordingState === "paused" && (
              <>
                <Button onClick={resumeRecording} className="gap-2">
                  <Play className="w-4 h-4" />
                  Resume
                </Button>
                <Button
                  onClick={stopRecording}
                  variant="destructive"
                  className="gap-2"
                >
                  <Square className="w-4 h-4" />
                  Stop
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      <ConfirmationDialog
        open={showConfirmation}
        title="Process Recording"
        description={`Your recording of ${formatDuration(
          duration
        )} will be processed to generate notes and mindmaps. Continue?`}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText="Process"
        cancelText="Cancel"
      />
    </>
  );
}
