import { FileText, Brain, Download } from "lucide-react"
import { Card } from "@/components/ui/card"

export function FeatureCards() {
  const features = [
    {
      icon: FileText,
      title: "Complete Transcript",
      description: "Get the full raw transcript of your audio content in .docx format",
    },
    {
      icon: Brain,
      title: "Structured Notes",
      description: "AI-powered summarization creates organized, formatted notes",
    },
    {
      icon: Download,
      title: "Visual Mindmaps",
      description: "Export mindmaps showing key concepts and relationships",
    },
  ]

  return (
    <div id="features" className="space-y-6">
      <h2 className="text-2xl font-bold text-center">Output Options</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <Card key={feature.title} className="p-6">
              <div className="flex flex-col gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
