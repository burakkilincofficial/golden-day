import * as React from "react";
import { cn } from "@/lib/utils";

export interface LoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8"
};

export function Loader({ className, size = "md" }: LoaderProps) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-muted-foreground/20 border-t-gold",
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Yükleniyor"
    >
      <span className="sr-only">Yükleniyor...</span>
    </div>
  );
}

export function LoaderOverlay({ children, isLoading }: { children: React.ReactNode; isLoading: boolean }) {
  if (!isLoading) return <>{children}</>;

  return (
    <div className="relative">
      <div className="pointer-events-none opacity-50">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
        <div className="flex flex-col items-center gap-3">
          <Loader size="lg" />
          <p className="text-sm text-muted-foreground">Kura çekiliyor...</p>
        </div>
      </div>
    </div>
  );
}

