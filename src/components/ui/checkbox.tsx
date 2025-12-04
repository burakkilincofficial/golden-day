import * as React from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => {
    return (
      <label className="inline-flex items-center gap-2">
        <input
          ref={ref}
          type="checkbox"
          className={cn(
            "h-4 w-4 cursor-pointer rounded border border-border bg-navy-soft text-gold-soft ring-offset-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-soft focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";


