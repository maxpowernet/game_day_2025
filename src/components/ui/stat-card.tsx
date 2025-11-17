import { LucideIcon } from "lucide-react";
import { Card } from "./card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "increase" | "decrease" | "neutral";
  icon?: LucideIcon;
  variant?: "default" | "primary";
  className?: string;
}

export function StatCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  variant = "default",
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "p-6 transition-all hover:shadow-lg",
        variant === "primary" && "bg-gradient-to-br from-primary to-accent text-primary-foreground",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={cn(
            "text-sm font-medium",
            variant === "primary" ? "text-primary-foreground/80" : "text-muted-foreground"
          )}>
            {title}
          </p>
          <h3 className="mt-2 text-3xl font-bold">{value}</h3>
          {change && (
            <div className="mt-2 flex items-center gap-1">
              <span className={cn(
                "text-xs font-medium",
                variant === "primary" ? "text-primary-foreground/80" : "text-muted-foreground"
              )}>
                {changeType === "increase" && "↑"}
                {changeType === "decrease" && "↓"}
                {" "}{change}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn(
            "rounded-full p-3",
            variant === "primary" ? "bg-white/20" : "bg-primary/10"
          )}>
            <Icon className={cn(
              "h-5 w-5",
              variant === "primary" ? "text-primary-foreground" : "text-primary"
            )} />
          </div>
        )}
      </div>
    </Card>
  );
}
