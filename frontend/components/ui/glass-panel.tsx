import { cn } from "@/lib/utils"

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: "default" | "high-contrast"
}

export function GlassPanel({ children, className, variant = "default", ...props }: GlassPanelProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-white/20 shadow-xl",
        "bg-white/10 backdrop-blur-[14px]", // The 14px blur requirement
        "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent before:pointer-events-none", // Layer 2: Gradient
        "after:absolute after:inset-0 after:bg-noise after:opacity-5 after:pointer-events-none", // Layer 3: Noise (optional, inferred from 'material')
        variant === "high-contrast" && "bg-slate-900/80 border-slate-700/50 text-white",
        className
      )}
      {...props}
    >
      <div className="relative z-10">{children}</div>
    </div>
  )
}
