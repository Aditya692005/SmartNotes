"use client";

import type React from "react";
import { useState, useCallback } from "react";
import { Upload, File, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { ConfirmationDialog } from "./confirmation-dialog";
import { toast } from "sonner"; // optional if you use sonner or shadcn toast

export function FileUploader() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // ✅ Supported MIME types + extensions
  const VALID_TYPES = [
    "audio/mpeg", // .mp3
    "audio/wav", // .wav
    "audio/mp4", // .m4a
    "audio/webm", // .webm
    "video/mp4", // .mp4
    "video/quicktime", // .mov
    "video/webm", // .webm
    "video/x-matroska", // .mkv
  ];

  const VALID_EXTENSIONS = [
    ".mp3",
    ".wav",
    ".m4a",
    ".webm",
    ".mp4",
    ".mov",
    ".mkv",
  ];

  const isValidFileType = (file: File) => {
    const typeOk = VALID_TYPES.includes(file.type);
    const extOk = VALID_EXTENSIONS.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );
    return typeOk || extOk;
  };

  const handleInvalidFile = (file: File) => {
    toast?.error?.(`❌ Unsupported file format: ${file.name}`, {
      description:
        "Please upload MP3, WAV, M4A, WEBM, MP4, MOV, or MKV files only.",
    });
    setSelectedFile(null);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (isValidFileType(file)) {
      setSelectedFile(file);
    } else {
      handleInvalidFile(file);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (isValidFileType(file)) {
      setSelectedFile(file);
    } else {
      handleInvalidFile(file);
      e.target.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleProcessFile = () => {
    if (selectedFile) {
      setShowConfirmation(true);
    }
  };

  const handleConfirm = () => {
    setShowConfirmation(false);
    if (!selectedFile) return;

    const transcriptPromise = new Promise<string>((resolve, reject) => {
      const ws = new WebSocket("ws://localhost:8000/transcribe");
      ws.binaryType = "arraybuffer";

      ws.onopen = async () => {
        const buffer = await selectedFile.arrayBuffer();
        ws.send(buffer);
        ws.send("DONE"); // ✅ tell server recording is finished
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.text) {
          console.log("📝 Final Transcript:", data.text);
          resolve(data.text); // ✅ return transcript to promise
          ws.close(); // ✅ close AFTER transcript is received
        } else if (data.error) {
          reject(data.error);
          ws.close();
        }
      };

      ws.onerror = (err) => reject(err);
    });

    transcriptPromise
      .then((transcript) => {
        sessionStorage.setItem(
          "transcriptionData",
          JSON.stringify({ transcript, source: "file-upload" })
        );

        router.push("/process?source=file-upload");
      })
      .catch((err) => {
        toast.error("Transcription failed", { description: String(err) });
      });
  };

  const handleCancel = () => {
    setShowConfirmation(false);
  };

  return (
    <>
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Upload Media File</h3>
          </div>

          <p className="text-sm text-muted-foreground">
            Supported formats: MP3, WAV, M4A, WEBM, MP4, MOV, MKV
          </p>

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
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop your file here, or click to browse
              </p>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".mp3,.wav,.m4a,.webm,.mp4,.mov,.mkv"
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
                  <p className="text-sm font-medium truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedFile(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <Button className="w-full" onClick={handleProcessFile}>
                Process File
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
  );
}
