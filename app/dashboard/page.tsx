"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileText,
  Calendar,
  ExternalLink,
  Trash2,
  Eye,
  Loader2,
  Download,
  Plus,
  Edit3,
  Check,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface Note {
  id: string;
  title: string;
  source: string;
  sourceUrl?: string;
  fileName?: string;
  createdAt: string;
  updatedAt: string;
  structuredNotes?: string;
  mindmapData?: string;
  transcript?: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [cardFormats, setCardFormats] = useState<
    Record<string, "docx" | "txt">
  >({});
  const [downloadingNoteId, setDownloadingNoteId] = useState<string | null>(
    null
  );
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState<string>("");
  const [savingTitleId, setSavingTitleId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated") {
      fetchNotes();
    }
  }, [status, router]);

  const fetchNotes = async () => {
    try {
      const response = await fetch("/api/notes?full=1");
      if (response.ok) {
        const data = await response.json();
        setNotes(data.notes);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch notes",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast({
        title: "Error",
        description: "Failed to fetch notes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    setIsDeleting(noteId);
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setNotes(notes.filter((note) => note.id !== noteId));
        toast({
          title: "Note Deleted",
          description: "The note has been deleted successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete note",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const setFormatForCard = (noteId: string, format: "docx" | "txt") => {
    setCardFormats((prev) => ({ ...prev, [noteId]: format }));
  };

  const handleDownloadNote = async (
    note: Note,
    type: "transcript" | "notes" | "mindmap",
    format: "docx" | "txt" = "docx"
  ) => {
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

      if (!response.ok) throw new Error("Export failed");
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
        description: `Your ${type} is downloading as ${format}.`,
      });
    } catch (error) {
      console.error("Download failed:", error);
      toast({
        title: "Download Failed",
        description: "There was an error downloading the file.",
        variant: "destructive",
      });
    }
  };

  const downloadNoteMindmapSVG = async (note: Note) => {
    if (!note.mindmapData) {
      toast({
        title: "No Mindmap",
        description: "This note doesn't have a mindmap to download.",
        variant: "destructive",
      });
      return;
    }
    try {
      setDownloadingNoteId(note.id);
      let svg = note.mindmapData.trim();
      if (!svg.startsWith("<svg")) {
        const res = await fetch("/api/convert-mmd", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mmd: svg }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error("convert failed", err);
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
    } catch (err) {
      console.error("Download mindmap error:", err);
      toast({
        title: "Download Failed",
        description: "There was an error downloading the mindmap.",
        variant: "destructive",
      });
    } finally {
      setDownloadingNoteId(null);
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
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="flex flex-col gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">My Notes</h1>
              <p className="text-muted-foreground">
                View and manage your saved notes and mindmaps
              </p>
            </div>
            <Link href="/">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create New Note
              </Button>
            </Link>
          </div>

          {notes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No notes yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Start by creating your first note from audio, video, or file
                  content.
                </p>
                <Link href="/">
                  <Button>Get Started</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {notes.map((note) => (
                <Card
                  key={note.id}
                  className="w-full hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-lg line-clamp-2">
                          {editingNoteId === note.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                value={editedTitle}
                                onChange={(e) => setEditedTitle(e.target.value)}
                                className="w-full rounded border px-2 py-1 text-sm"
                                aria-label="Edit title"
                              />
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={async () => {
                                    try {
                                      setSavingTitleId(note.id);
                                      const res = await fetch(
                                        `/api/notes/${note.id}`,
                                        {
                                          method: "PATCH",
                                          headers: {
                                            "Content-Type": "application/json",
                                          },
                                          body: JSON.stringify({
                                            title: editedTitle,
                                          }),
                                        }
                                      );
                                      if (!res.ok)
                                        throw new Error(
                                          "Failed to update title"
                                        );
                                      const data = await res.json();
                                      setNotes((prev) =>
                                        prev.map((n) =>
                                          n.id === note.id ? data.note : n
                                        )
                                      );
                                      setEditingNoteId(null);
                                      toast({ title: "Title updated" });
                                    } catch (err) {
                                      console.error(
                                        "Error updating title:",
                                        err
                                      );
                                      toast({
                                        title: "Update Failed",
                                        description: "Could not update title",
                                        variant: "destructive",
                                      });
                                    } finally {
                                      setSavingTitleId(null);
                                    }
                                  }}
                                  disabled={savingTitleId === note.id}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingNoteId(null);
                                    setEditedTitle("");
                                  }}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span>{note.title}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingNoteId(note.id);
                                  setEditedTitle(note.title);
                                }}
                              >
                                <Edit3 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <span>{getSourceIcon(note.source)}</span>
                          <span>{getSourceLabel(note.source)}</span>
                          {note.fileName && (
                            <span className="text-xs text-muted-foreground">
                              • {note.fileName}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteNote(note.id)}
                        disabled={isDeleting === note.id}
                        className="text-destructive hover:text-destructive"
                      >
                        {isDeleting === note.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(note.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Structured Notes Preview */}
                      {note.structuredNotes && (
                        <div className="text-xs mt-2 max-h-16 overflow-hidden whitespace-pre-line bg-muted rounded p-2">
                          {note.structuredNotes
                            .split("\n")
                            .slice(0, 4)
                            .join("\n")}
                          {note.structuredNotes.split("\n").length > 4 && "..."}
                        </div>
                      )}
                      {/* Mindmap Preview Icon */}
                      {note.mindmapData && (
                        <div className="flex items-center gap-1 text-xs text-primary mt-1">
                          <span role="img" aria-label="mindmap">
                            🧠 Mindmap available
                          </span>
                        </div>
                      )}
                      {note.sourceUrl && (
                        <div className="flex items-center gap-2">
                          <ExternalLink className="w-4 h-4 text-muted-foreground" />
                          <a
                            href={note.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline truncate"
                          >
                            View Source
                          </a>
                        </div>
                      )}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex gap-2 flex-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleDownloadNote(
                                note,
                                "transcript",
                                cardFormats[note.id] ?? "docx"
                              )
                            }
                            className="gap-2 flex-1"
                          >
                            <Download className="w-4 h-4" />
                            Transcript
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleDownloadNote(
                                note,
                                "notes",
                                cardFormats[note.id] ?? "docx"
                              )
                            }
                            className="gap-2 flex-1"
                          >
                            <Download className="w-4 h-4" />
                            Notes
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadNoteMindmapSVG(note)}
                            disabled={!note?.mindmapData}
                            className="gap-2 flex-1"
                          >
                            <Download className="w-4 h-4" />
                            Mindmap
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={cardFormats[note.id] ?? "docx"}
                            onValueChange={(v) =>
                              setFormatForCard(note.id, v as "docx" | "txt")
                            }
                          >
                            <SelectTrigger size="sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="docx">DOCX</SelectItem>
                              <SelectItem value="txt">TXT</SelectItem>
                            </SelectContent>
                          </Select>
                          <Link
                            href={`/notes/${note.id}`}
                            className="flex-1 sm:w-auto"
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
