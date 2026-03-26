import { cn } from "@/lib/utils"

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: "default" | "high-contrast"
}

export function GlassPanel({ children, className, variant = "default", ...props }: GlassPanelProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-gray-200 shadow-sm bg-white",
        variant === "high-contrast" && "bg-gray-50 border-gray-300",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
