import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { SYSTEM_STATES, type SystemState } from "@shared/schema";
import { Activity, AlertTriangle, ShieldCheck, ZapOff } from "lucide-react";

interface StatusBadgeProps {
  status: SystemState;
  large?: boolean;
  className?: string;
}

export function StatusBadge({ status, large = false, className }: StatusBadgeProps) {
  const config = {
    [SYSTEM_STATES.STABLE]: {
      label: "STABLE",
      icon: ShieldCheck,
      colorClass: "status-stable",
    },
    [SYSTEM_STATES.BOUNDARY_ZONE]: {
      label: "BOUNDARY",
      icon: Activity,
      colorClass: "status-boundary",
    },
    [SYSTEM_STATES.UNSTABLE]: {
      label: "UNSTABLE",
      icon: AlertTriangle,
      colorClass: "status-unstable",
    },
    [SYSTEM_STATES.SYSTEM_SHOULD_HALT]: {
      label: "HALT REQUIRED",
      icon: ZapOff,
      colorClass: "status-halt",
      animate: true,
    },
  };

  const current = config[status];
  const Icon = current.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      key={status} // Re-animate on status change
      className={cn(
        "inline-flex items-center gap-2 rounded-md font-mono font-bold transition-colors duration-300 border",
        current.colorClass,
        large ? "px-6 py-3 text-lg" : "px-3 py-1 text-sm",
        current.animate && large ? "animate-pulse-fast" : "",
        className
      )}
    >
      <Icon className={large ? "w-6 h-6" : "w-4 h-4"} />
      <span>{current.label}</span>
    </motion.div>
  );
}
