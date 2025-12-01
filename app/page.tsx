import { Header } from "@/components/header"
import { InputModeSelector } from "@/components/input-mode-selector"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-balance">Speech-to-Notes Generator</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
              Transform spoken content into well-structured notes and mindmaps. Support for live audio, YouTube videos,
              and uploaded media files.
            </p>
          </div>

          {/* Input Mode Selector */}
          <InputModeSelector />
        </div>
      </main>

      <footer className="border-t border-border py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          SmartNotes - Automated Note-Taking Assistant
        </div>
      </footer>
    </div>
  )
}
