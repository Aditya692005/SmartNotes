"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileText, Brain, Network, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OutputOptionsProps {
  transcript: string;
  structuredNotes: string;
  mindmap: string;
  isGenerating: boolean;
  onComplete: () => void;
  onNotesGenerated?: (notes: string) => void;
  onMindmapGenerated?: (mindmap: string) => void;
}

export function OutputOptions({
  transcript,
  structuredNotes,
  mindmap,
  isGenerating,
  onComplete,
  onNotesGenerated,
  onMindmapGenerated,
}: OutputOptionsProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("transcript");
  const [notes, setNotes] = useState(structuredNotes);
  const [mindmapData, setMindmapData] = useState(mindmap);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (isGenerating && transcript && (!notes || !mindmapData)) {
      generateContent();
    }
  }, [isGenerating, transcript, notes, mindmapData]);

  // Keep local state in sync if parent passes new values (e.g., when user
  // navigates back or when values are set from elsewhere in the app).
  useEffect(() => {
    if (structuredNotes && structuredNotes !== notes) setNotes(structuredNotes);
  }, [structuredNotes]);

  useEffect(() => {
    if (mindmap && mindmap !== mindmapData) setMindmapData(mindmap);
  }, [mindmap]);

  // If notes are already available but a mindmap hasn't been generated, run
  // the generation flow even if `isGenerating` is false (e.g., we've marked
  // the pipeline complete earlier). The guard ensures we don't start another
  // generation if one is already in progress.
  useEffect(() => {
    if (!isLoading && !mindmapData && notes && notes.trim()) {
      generateContent();
    }
  }, [notes, mindmapData, isLoading]);

  const generateContent = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      let finalNotes = notes;
      // ✅ Generate Structured Notes if we don't already have them
      if (!finalNotes) {
        const notesResponse = await fetch("/api/generate-notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript }),
        });

        if (!notesResponse.ok) {
          let errMsg = `Failed to generate notes (status ${notesResponse.status})`;
          try {
            const errJson = await notesResponse.json();
            errMsg = errJson?.error || errMsg;
          } catch (e) {
            try {
              const errText = await notesResponse.text();
              if (errText) errMsg = errText;
            } catch (_) {}
          }
          console.error(
            "Notes response error:",
            notesResponse.status,
            notesResponse.statusText
          );
          throw new Error(errMsg);
        }

        const notesData = await notesResponse.json();
        finalNotes = notesData.structuredNotes;
        setNotes(finalNotes);
        onNotesGenerated?.(finalNotes);
      }

      // ✅ Generate Mindmap (use structured notes)
      const mindmapResponse = await fetch("/api/generate-mindmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: finalNotes }),
      });

      if (!mindmapResponse.ok) {
        let errMsg = `Failed to generate mindmap (status ${mindmapResponse.status})`;
        try {
          const errJson = await mindmapResponse.json();
          errMsg = errJson?.error || errMsg;
        } catch (e) {
          // If it's not JSON, attempt to read text
          try {
            const errText = await mindmapResponse.text();
            if (errText) errMsg = errText;
          } catch (err) {
            // ignore
          }
        }
        console.error(
          "Mindmap response error:",
          mindmapResponse.status,
          mindmapResponse.statusText
        );
        throw new Error(errMsg);
      }

      const mindmapResponseData = await mindmapResponse.json();
      const mmd = mindmapResponseData.mindmap;

      // Convert Mermaid (mmd) to SVG via server API
      let didConvertToSvg = false;
      try {
        console.log("Converting mindmap to SVG...", { mmdLength: mmd.length });
        const convertRes = await fetch("/api/convert-mmd", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mmd }),
        });

        console.log(
          "Convert response status:",
          convertRes.status,
          convertRes.statusText
        );

        if (!convertRes.ok) {
          let errorMsg = "Failed to convert mindmap to SVG";
          let errData: any = null;
          try {
            errData = await convertRes.json();
            errorMsg = errData?.error || errorMsg;
          } catch (e) {
            // If response is not JSON, attempt to read text
            try {
              const text = await convertRes.text();
              if (text) errorMsg = text;
            } catch (_e) {}
          }

          console.error("SVG conversion error:", errorMsg, errData);

          // If the server provided a sanitized MMD, prefer showing that to the user
          const sanitizedForUI =
            errData?.aggressiveMmd || errData?.sanitizedMmd || mmd;

          // Set the mindmapData to the sanitized/adjusted MMD that the server tried,
          // so the user sees the corrected version instead of raw (if available).
          setMindmapData(sanitizedForUI);
          onMindmapGenerated?.(sanitizedForUI);

          // Show a helpful toast with the error and a quick hint.
          toast({
            title: "Mindmap Conversion Failed",
            description: `${errorMsg}. Showing sanitized Mermaid code for inspection.`,
            variant: "destructive",
          });

          // Throw to jump to the outer catch logic (which is fallback behavior)
          throw new Error(errorMsg);
        }

        const svgText = await convertRes.text();
        didConvertToSvg = true;
        console.log("SVG generated successfully", {
          svgLength: svgText.length,
        });
        setMindmapData(svgText);
        onMindmapGenerated?.(svgText);
      } catch (convertError) {
        console.error("Mindmap conversion error:", convertError);
        // Fallback: store the raw mmd so user still has something
        setMindmapData(mmd);
        onMindmapGenerated?.(mmd);
        toast({
          title: "Mindmap Conversion Failed",
          description:
            "Could not render mindmap SVG. Showing raw Mermaid code instead.",
          variant: "destructive",
        });
      }

      // Only call onComplete when the mindmap was converted to SVG successfully.
      if (didConvertToSvg) onComplete();

      toast({
        title: "Generation Complete",
        description: "Your notes and mindmap have been generated successfully.",
      });
    } catch (error: any) {
      const message = error?.message || String(error) || "Unknown error";
      console.error("Error generating content:", message, error);
      toast({
        title: "Generation Failed",
        description: `There was an error generating your content: ${message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (type: "transcript" | "notes" | "mindmap") => {
    setIsExporting(true);

    try {
      const content =
        type === "transcript"
          ? transcript
          : type === "notes"
          ? notes
          : mindmapData;

      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, type, format: "docx" }),
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `smartnotes-${type}-${Date.now()}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: `Your ${type} document is being downloaded.`,
      });
    } catch {
      toast({
        title: "Download Failed",
        description: "There was an error downloading your document.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const isSvg = (content: string): boolean => {
    if (!content) return false;
    const trimmed = content.trim();
    // Detect SVG by looking for an <svg ...> tag anywhere in the content
    // This handles XML declarations (<?xml ...?>) and doctypes that appear before the <svg> tag
    return /<svg[\s>]/i.test(trimmed);
  };

  const handleDownloadSvg = async (svgContent: string) => {
    try {
      const blob = new Blob([svgContent], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `smartnotes-mindmap-${Date.now()}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: "Your mindmap SVG is downloading.",
      });
    } catch (e) {
      console.error("SVG download failed:", e);
      toast({
        title: "Download Failed",
        description: "There was an error downloading the SVG.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadAll = async () => {
    // Ensure the UI shows we're exporting for the whole multi-download operation
    setIsExporting(true);
    try {
      await handleDownload("transcript");
      await new Promise((resolve) => setTimeout(resolve, 500));
      await handleDownload("notes");
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (isSvg(mindmapData)) {
        await handleDownloadSvg(mindmapData);
      } else {
        await handleDownload("mindmap");
      }
    } catch (err) {
      console.error("Error while downloading all files:", err);
      toast({
        title: "Download Failed",
        description: "There was an error downloading one or more files.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Generated Outputs</h2>
          <div className="flex items-center gap-3">
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </div>
            )}
            {!isLoading && notes && mindmapData && (
              <Button
                variant="outline"
                onClick={handleDownloadAll}
                disabled={isExporting}
                className="gap-2 bg-transparent"
              >
                <Download className="w-4 h-4" />
                Download All
              </Button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="transcript" className="gap-2">
              <FileText className="w-4 h-4" />
              Transcript
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-2" disabled={isLoading}>
              <Brain className="w-4 h-4" />
              Structured Notes
            </TabsTrigger>
            <TabsTrigger value="mindmap" className="gap-2" disabled={isLoading}>
              <Network className="w-4 h-4" />
              Mindmap
            </TabsTrigger>
          </TabsList>

          {/* Transcript */}
          <TabsContent value="transcript" className="space-y-4">
            <div className="p-4 bg-secondary rounded-lg min-h-[300px] max-h-[500px] overflow-y-auto">
              <p className="text-sm whitespace-pre-wrap">{transcript}</p>
            </div>
            <Button
              onClick={() => handleDownload("transcript")}
              disabled={isExporting}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              {isExporting ? "Exporting..." : "Download Transcript (.docx)"}
            </Button>
          </TabsContent>

          {/* Notes */}
          <TabsContent value="notes" className="space-y-4">
            <div className="p-4 bg-secondary rounded-lg min-h-[300px] max-h-[500px] overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap">{notes}</pre>
            </div>
            <Button
              onClick={() => handleDownload("notes")}
              disabled={!notes || isExporting}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              {isExporting ? "Exporting..." : "Download Notes (.docx)"}
            </Button>
          </TabsContent>

          {/* Mindmap */}
          <TabsContent value="mindmap" className="space-y-4">
            <div className="p-4 bg-secondary rounded-lg min-h-[300px] overflow-x-auto">
              {isSvg(mindmapData) ? (
                <div dangerouslySetInnerHTML={{ __html: mindmapData }} />
              ) : (
                <pre className="text-sm whitespace-pre">{mindmapData}</pre>
              )}
            </div>
            {isSvg(mindmapData) ? (
              <Button
                onClick={() => handleDownloadSvg(mindmapData)}
                disabled={!mindmapData || isExporting}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                {isExporting ? "Downloading..." : "Download Mindmap (.svg)"}
              </Button>
            ) : (
              <Button
                onClick={() => handleDownload("mindmap")}
                disabled={!mindmapData || isExporting}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                {isExporting ? "Exporting..." : "Download Mindmap (.docx)"}
              </Button>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
}
