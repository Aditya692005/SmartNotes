"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Pause, Play, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { ConfirmationDialog } from "./confirmation-dialog";

type RecordingState = "idle" | "recording" | "paused";

function LiveAudioRecorder() {
  const router = useRouter();
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [duration, setDuration] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      setError(null);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setRecordingState("recording");
      intervalRef.current = setInterval(
        () => setDuration((prev) => prev + 1),
        1000
      );
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("Unable to access microphone. Please check permissions.");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState === "recording") {
      mediaRecorderRef.current.pause();
      setRecordingState("paused");
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingState === "paused") {
      mediaRecorderRef.current.resume();
      setRecordingState("recording");
      intervalRef.current = setInterval(
        () => setDuration((prev) => prev + 1),
        1000
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
    setRecordingState("idle");
    if (intervalRef.current) clearInterval(intervalRef.current);
    setShowConfirmation(true);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleConfirm = async () => {
    setShowConfirmation(false);

    // ✅ Combine chunks into final audio blob
    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
    const file = new File([audioBlob], "recording.webm", {
      type: "audio/webm",
    });

    const transcript = await new Promise<string>((resolve, reject) => {
      const ws = new WebSocket("ws://localhost:8000/transcribe");
      ws.binaryType = "arraybuffer";

      ws.onopen = async () => {
        const buffer = await audioBlob.arrayBuffer();
        ws.send(buffer); // ✅ send entire audio
        ws.send("DONE"); // ✅ tell server audio is complete
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("📝 Final Transcript:", data.text);
        resolve(data.text);
        ws.close(); // ✅ close only after receiving transcript
      };

      ws.onerror = (err) => {
        console.error("❌ WebSocket Error:", err);
        reject(err);
      };
    });

    console.log("📝 Whisper Transcript:", transcript);

    // ✅ Save transcript for next page
    sessionStorage.setItem(
      "transcriptionData",
      JSON.stringify({
        transcript,
        source: "live-audio",
      })
    );

    // ✅ Upload original audio (if needed)
    const formData = new FormData();
    formData.append("audio", file);

    await fetch("/api/upload-audio", {
      method: "POST",
      body: formData,
    });

    router.push("/process?source=live-audio");
  };

  const handleCancel = () => setShowConfirmation(false);

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
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center gap-3">
            {recordingState === "idle" && (
              <Button onClick={startRecording} className="gap-2">
                <Mic className="w-4 h-4" /> Start Recording
              </Button>
            )}

            {recordingState === "recording" && (
              <>
                <Button
                  onClick={pauseRecording}
                  variant="outline"
                  className="gap-2"
                >
                  <Pause className="w-4 h-4" /> Pause
                </Button>
                <Button
                  onClick={stopRecording}
                  variant="destructive"
                  className="gap-2"
                >
                  <Square className="w-4 h-4" /> Stop
                </Button>
              </>
            )}

            {recordingState === "paused" && (
              <>
                <Button onClick={resumeRecording} className="gap-2">
                  <Play className="w-4 h-4" /> Resume
                </Button>
                <Button
                  onClick={stopRecording}
                  variant="destructive"
                  className="gap-2"
                >
                  <Square className="w-4 h-4" /> Stop
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

export default LiveAudioRecorder;
