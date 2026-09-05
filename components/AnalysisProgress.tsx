"use client";

import { Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

export interface AnalysisProgressProps {
  isOpen: boolean;
  onClose?: () => void;
  currentStep?: "validating" | "analyzing" | "verifying" | "generating" | "done" | "error";
  fileName?: string;
}

const STEPS = [
  { id: "validating", label: "Validating file integrity and format" },
  { id: "analyzing", label: "Analyzing media for synthetic signals & artifacts" },
  { id: "verifying", label: "Cross-referencing claims with Google Search grounding" },
  { id: "generating", label: "Building verifiable evidence report" },
];

export function AnalysisProgress({ isOpen, currentStep = "validating", fileName }: AnalysisProgressProps) {
  const getProgressValue = (step: string) => {
    switch (step) {
      case "validating":
        return 20;
      case "analyzing":
        return 50;
      case "verifying":
        return 75;
      case "generating":
        return 90;
      case "done":
        return 100;
      default:
        return 15;
    }
  };

  const getStepIndex = (step: string) => {
    switch (step) {
      case "validating":
        return 0;
      case "analyzing":
        return 1;
      case "verifying":
        return 2;
      case "generating":
        return 3;
      case "done":
        return 4;
      default:
        return 0;
    }
  };

  const activeIndex = getStepIndex(currentStep);
  const progressValue = getProgressValue(currentStep);

  return (
    <Dialog open={isOpen}>
      <DialogContent
        showCloseButton={false}
        className="max-w-md border-neutral-200 bg-white p-6 shadow-xl sm:rounded-2xl"
        aria-describedby="analysis-progress-description"
      >
        <div className="flex items-center gap-3 border-b border-neutral-100 pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <DialogTitle className="text-base font-semibold text-neutral-950">
              VeriTrace Analysis
            </DialogTitle>
            <p id="analysis-progress-description" className="text-xs text-neutral-500 truncate max-w-[280px]">
              {fileName || "Processing submitted media"}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium text-neutral-600">
              <span>Overall Progress</span>
              <span>{progressValue}%</span>
            </div>
            <Progress value={progressValue} className="h-1.5 bg-neutral-100" />
          </div>

          <div className="space-y-3 pt-2" role="status" aria-live="polite">
            {STEPS.map((step, idx) => {
              const isCompleted = idx < activeIndex;
              const isCurrent = idx === activeIndex;

              return (
                <div key={step.id} className="flex items-center gap-3 text-xs">
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : isCurrent ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-neutral-900" />
                  ) : (
                    <span className="h-4 w-4 shrink-0 rounded-full border border-neutral-300" />
                  )}
                  <span
                    className={`${
                      isCurrent
                        ? "font-semibold text-neutral-950"
                        : isCompleted
                        ? "text-neutral-600"
                        : "text-neutral-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
