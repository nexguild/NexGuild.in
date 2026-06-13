import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BadgeVariant } from "@/components/ui/badge";
import Link from "next/link";

type OpportunityType = "survey" | "micro_task" | "data_labeling" | "content_task" | "offerwall" | "managed_project";

interface OpportunityCardProps {
  id?: string;
  title: string;
  type: OpportunityType;
  description: string;
  payout: string;
  estimatedMinutes: number;
  skillLevel: "any" | "intermediate" | "advanced";
  href?: string;
  showStartButton?: boolean;
  className?: string;
}

const typeLabels: Record<OpportunityType, string> = {
  survey:           "Survey",
  micro_task:       "Micro-task",
  data_labeling:    "Data Labeling",
  content_task:     "Content Task",
  offerwall:        "Offerwall",
  managed_project:  "Project Task",
};

const typeVariants: Record<OpportunityType, BadgeVariant> = {
  survey:           "brand",
  micro_task:       "info",
  data_labeling:    "warning",
  content_task:     "success",
  offerwall:        "neutral",
  managed_project:  "danger",
};

const skillLabels = {
  any:          "No experience required",
  intermediate: "Intermediate",
  advanced:     "Advanced",
};

export function OpportunityCard({
  title,
  type,
  description,
  payout,
  estimatedMinutes,
  skillLevel,
  href,
  showStartButton = true,
  className,
}: OpportunityCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)]",
        "flex flex-col p-5 transition-colors hover:border-[var(--border-strong)]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <Badge variant={typeVariants[type]}>{typeLabels[type]}</Badge>
        <span className="text-base font-bold text-[var(--success-text)] whitespace-nowrap">
          {payout}
        </span>
      </div>

      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1 line-clamp-1">
        {title}
      </h3>
      <p className="text-sm text-[var(--text-secondary)] line-clamp-2 flex-1 mb-4">
        {description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {estimatedMinutes} min
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {skillLabels[skillLevel]}
          </span>
        </div>

        {showStartButton && href && (
          <Button asChild size="sm">
            <Link href={href}>Start Task</Link>
          </Button>
        )}

        {!showStartButton && (
          <span className="text-xs text-[var(--text-muted)] italic">Login required</span>
        )}
      </div>
    </div>
  );
}
