import { Check, Loader2 } from "lucide-react"

interface ProcessingStepsProps {
  currentStep: "transcribing" | "editing" | "generating" | "complete"
}

export function ProcessingSteps({ currentStep }: ProcessingStepsProps) {
  const steps = [
    { id: "transcribing", label: "Transcribing" },
    { id: "editing", label: "Review & Edit" },
    { id: "generating", label: "Generating Notes" },
    { id: "complete", label: "Complete" },
  ]

  const getStepStatus = (stepId: string) => {
    const stepIndex = steps.findIndex((s) => s.id === stepId)
    const currentIndex = steps.findIndex((s) => s.id === currentStep)

    if (stepIndex < currentIndex) return "complete"
    if (stepIndex === currentIndex) return "current"
    return "upcoming"
  }

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => {
        const status = getStepStatus(step.id)

        return (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                  status === "complete"
                    ? "bg-primary border-primary text-primary-foreground"
                    : status === "current"
                      ? "border-primary text-primary"
                      : "border-border text-muted-foreground"
                }`}
              >
                {status === "complete" ? (
                  <Check className="w-5 h-5" />
                ) : status === "current" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <span
                className={`text-sm font-medium ${status === "current" ? "text-foreground" : "text-muted-foreground"}`}
              >
                {step.label}
              </span>
            </div>

            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-4 transition-colors ${status === "complete" ? "bg-primary" : "bg-border"}`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
