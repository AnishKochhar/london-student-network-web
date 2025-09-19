"use client";

import * as React from "react";
import * as TooltipPrimitives from "@radix-ui/react-tooltip";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/app/lib/utils";

const TooltipProvider = TooltipPrimitives.Provider;

const Tooltip = TooltipPrimitives.Root;

const TooltipTrigger = TooltipPrimitives.Trigger;

const tooltipVariants = cva(
    "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
);

export interface TooltipContentProps
    extends React.ComponentPropsWithoutRef<typeof TooltipPrimitives.Content>,
        VariantProps<typeof tooltipVariants> {}

const TooltipContent = React.forwardRef<
    React.ElementRef<typeof TooltipPrimitives.Content>,
    TooltipContentProps
>(({ className, sideOffset = 4, ...props }, ref) => (
    <TooltipPrimitives.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(tooltipVariants(), className)}
        {...props}
    />
));
TooltipContent.displayName = TooltipPrimitives.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
