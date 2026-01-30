"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox@1.1.4";
import { CheckIcon } from "lucide-react@0.487.0";

import { cn } from "./utils";

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer border bg-input-background dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        // Force perfect square with multiple approaches
        "w-[10px] h-[10px] min-w-[10px] min-h-[10px] max-w-[10px] max-h-[10px]",
        "inline-flex items-center justify-center",
        "aspect-square",
        className,
      )}
      style={{
        width: '10px',
        height: '10px',
        minWidth: '10px',
        minHeight: '10px',
        maxWidth: '10px',
        maxHeight: '10px',
        aspectRatio: '1 / 1',
        display: 'inline-flex',
        padding: '0',
        boxSizing: 'border-box'
      }}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none w-full h-full"
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <CheckIcon className="w-[6px] h-[6px]" style={{ width: '6px', height: '6px', strokeWidth: 3 }} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
