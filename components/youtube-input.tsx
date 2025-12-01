"use client";

import { useState } from "react";
import { Youtube, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { ConfirmationDialog } from "./confirmation-dialog";

function extractYouTubeVideoId(url: string) {
  const regex =
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([^&?/]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

export function YoutubeInput() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleProcess = async () => {
    const videoId = extractYouTubeVideoId(url);

    if (!videoId) {
      setErrorMessage("Invalid YouTube URL.");
      return;
    }

    // ✅ Skip external validation, let Supadata API handle it
    setErrorMessage("");
    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    setShowConfirmation(false);
    setIsLoading(true);
    setErrorMessage("");

    try {
      // ✅ Call the API route with the URL
      const response = await fetch("/api/youtube-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || "Failed to fetch transcript");
        setIsLoading(false);
        return;
      }

      // ✅ Store the transcript result
      sessionStorage.setItem(
        "transcriptionData",
        JSON.stringify({
          transcript: data.transcript,
          source: "youtube",
        })
      );

      // ✅ Now redirect to process page
      router.push("/process?source=youtube");
    } catch (error) {
      setErrorMessage("An error occurred while processing the video");
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Youtube className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">YouTube Video Processing</h3>
        </div>

        <p className="text-sm text-muted-foreground">
          Enter a YouTube video URL to extract and process its transcript.
        </p>

        <div className="flex gap-2">
          <Input
            placeholder="https://www.youtube.com/watch?v=..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1"
            disabled={isLoading}
          />
          <Button onClick={handleProcess} disabled={!url || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              "Process"
            )}
          </Button>
        </div>

        {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}
      </Card>

      <ConfirmationDialog
        open={showConfirmation}
        title="Process YouTube Video"
        description="The transcript from this YouTube video will be extracted. Continue?"
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirmation(false)}
        confirmText="Process"
        cancelText="Cancel"
      />
    </>
  );
}
