import * as React from "react";
import { cn } from "@/lib/utils";

export const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto rounded-md border border-border">
    <table
      ref={ref}
      className={cn(
        "w-full caption-bottom text-xs sm:text-sm",
        className
      )}
      {...props}
    />
  </div>
));
Table.displayName = "Table";

export const TableHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead
    className={cn(
      "border-b border-border bg-navy-soft text-xs uppercase tracking-wide text-muted-foreground",
      className
    )}
    {...props}
  />
);

export const TableBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={cn("divide-y divide-border", className)} {...props} />
);

export const TableRow = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr
    className={cn(
      "hover:bg-navy-soft/60 data-[state=selected]:bg-navy-soft",
      className
    )}
    {...props}
  />
);

export const TableHead = ({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th
    className={cn(
      "px-3 py-2 text-left align-middle font-medium text-muted-foreground",
      className
    )}
    {...props}
  />
);

export const TableCell = ({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td
    className={cn("px-3 py-2 align-middle text-foreground", className)}
    {...props}
  />
);


