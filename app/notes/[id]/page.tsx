"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Header } from "@/components/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileText,
  Brain,
  Network,
  Calendar,
  ArrowLeft,
  Download,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface Note {
  id: string;
  title: string;
  transcript: string;
  structuredNotes: string;
  mindmapData?: string;
  source: string;
  sourceUrl?: string;
  fileName?: string;
  createdAt: string;
  updatedAt: string;
}

export default function NotePage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const clientParams = useParams();
  const { toast } = useToast();
  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<"docx" | "txt">("docx");

  useEffect(() => {
    async function loadNote() {
      if (status === "unauthenticated") {
        router.push("/auth/signin");
        return;
      }
      if (status === "authenticated") {
        // Await params if needed
        let id = clientParams?.id ?? params?.id;
        if (Array.isArray(id)) {
          id = id[0];
        }
        await fetchNote(id);
      }
    }
    loadNote();
  }, [status, router, params]);

  const fetchNote = async (id: string) => {
    try {
      const response = await fetch(`/api/notes/${id}`);
      if (response.ok) {
        const data = await response.json();
        setNote(data.note);
      } else if (response.status === 404) {
        toast({
          title: "Note Not Found",
          description: "The requested note could not be found.",
          variant: "destructive",
        });
        router.push("/dashboard");
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch note",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching note:", error);
      toast({
        title: "Error",
        description: "Failed to fetch note",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (
    type: "transcript" | "notes" | "mindmap",
    format: "docx" | "txt" = "docx"
  ) => {
    if (!note) return;

    setIsExporting(true);
    try {
      const content =
        type === "transcript"
          ? note.transcript
          : type === "notes"
          ? note.structuredNotes
          : note.mindmapData || "";

      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, type, format }),
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${note.title}-${type}-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: `Your ${type} document is being downloaded as ${format}.`,
      });
    } catch (error) {
      console.error("Error downloading:", error);
      toast({
        title: "Download Failed",
        description:
          "There was an error downloading your document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const downloadMindmapSVG = async () => {
    if (!note?.mindmapData) {
      toast({
        title: "No Mindmap",
        description: "This note doesn't contain a mindmap to download.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      let svg = note.mindmapData.trim();
      if (!svg.startsWith("<svg")) {
        // Try converting via server
        const res = await fetch("/api/convert-mmd", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mmd: svg }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error("Convert error:", err);
          toast({
            title: "Conversion Failed",
            description: err?.error || "Failed to convert Mermaid to SVG.",
            variant: "destructive",
          });
          return;
        }
        svg = await res.text();
      }

      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${note.title}-mindmap-${Date.now()}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: "Your mindmap SVG is downloading.",
      });
    } catch (e) {
      console.error("Download mindmap SVG error:", e);
      toast({
        title: "Download Failed",
        description: "Failed to download the mindmap.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "live-audio":
        return "🎤";
      case "youtube":
        return "📺";
      case "file-upload":
        return "📁";
      default:
        return "📄";
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case "live-audio":
        return "Live Audio";
      case "youtube":
        return "YouTube Video";
      case "file-upload":
        return "File Upload";
      default:
        return "Unknown";
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (status === "unauthenticated" || !note) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{note.title}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>{getSourceIcon(note.source)}</span>
                  <span>{getSourceLabel(note.source)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                </div>
                {note.fileName && (
                  <div className="text-xs">{note.fileName}</div>
                )}
              </div>
            </div>
          </div>

          {note.sourceUrl && (
            <Alert>
              <ExternalLink className="h-4 w-4" />
              <AlertDescription>
                <a
                  href={note.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  View original source
                </a>
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="transcript" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="transcript" className="gap-2">
                <FileText className="w-4 h-4" />
                Transcript
              </TabsTrigger>
              <TabsTrigger value="notes" className="gap-2">
                <Brain className="w-4 h-4" />
                Structured Notes
              </TabsTrigger>
              <TabsTrigger value="mindmap" className="gap-2">
                <Network className="w-4 h-4" />
                Mindmap
              </TabsTrigger>
            </TabsList>

            <TabsContent value="transcript" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Transcript</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-secondary rounded-lg min-h-[300px] max-h-[500px] overflow-y-auto">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {note.transcript}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Structured Notes</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-secondary rounded-lg min-h-[300px] max-h-[500px] overflow-y-auto">
                    <div className="prose prose-sm max-w-none prose-invert">
                      <div className="whitespace-pre-wrap">
                        {note.structuredNotes}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mindmap" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Mindmap</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="p-8 bg-secondary rounded-lg min-h-[400px]">
                    {note.mindmapData ? (
                      <div className="w-full h-full">
                        {note.mindmapData.trim().startsWith("<svg") ? (
                          <div
                            dangerouslySetInnerHTML={{
                              __html: note.mindmapData,
                            }}
                          />
                        ) : (
                          <pre className="text-sm whitespace-pre-wrap">
                            {note.mindmapData}
                          </pre>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center space-y-4">
                          <Network className="w-16 h-16 mx-auto text-primary" />
                          <div>
                            <h3 className="font-semibold mb-2">
                              No Mindmap Available
                            </h3>
                            <p className="text-sm text-muted-foreground max-w-md">
                              This note doesn't have a mindmap visualization.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex gap-4 justify-end mt-6 items-center">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload("transcript", selectedFormat)}
                disabled={isExporting}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Transcript
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload("notes", selectedFormat)}
                disabled={isExporting}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Notes
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadMindmapSVG}
                disabled={isExporting || !note?.mindmapData}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Mindmap
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={selectedFormat}
                onValueChange={(v) => setSelectedFormat(v as "docx" | "txt")}
              >
                <SelectTrigger size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="docx">DOCX</SelectItem>
                  <SelectItem value="txt">TXT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
