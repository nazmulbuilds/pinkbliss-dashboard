"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

interface CollapsibleContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CollapsibleContext = React.createContext<CollapsibleContextValue | undefined>(undefined)

function useCollapsible() {
  const context = React.useContext(CollapsibleContext)
  if (!context) {
    throw new Error("useCollapsible must be used within a Collapsible")
  }
  return context
}

interface CollapsibleProps extends React.ComponentProps<"div"> {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultOpen?: boolean
}

function Collapsible({
  className,
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  defaultOpen = false,
  ...props
}: CollapsibleProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen
  const onOpenChange = isControlled ? controlledOnOpenChange! : setUncontrolledOpen

  return (
    <CollapsibleContext.Provider value={{ open, onOpenChange }}>
      <div
        data-state={open ? "open" : "closed"}
        className={cn("group/collapsible", className)}
        {...props}
      >
        {children}
      </div>
    </CollapsibleContext.Provider>
  )
}

interface CollapsibleTriggerProps extends React.ComponentProps<"button"> {
  asChild?: boolean
}

function CollapsibleTrigger({
  className,
  children,
  asChild = false,
  ...props
}: CollapsibleTriggerProps) {
  const { open, onOpenChange } = useCollapsible()

  return (
    <button
      type="button"
      aria-expanded={open}
      data-state={open ? "open" : "closed"}
      onClick={() => onOpenChange(!open)}
      className={cn(
        "flex w-full items-center justify-between",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown 
        className={cn(
          "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
          open && "rotate-180"
        )}
      />
    </button>
  )
}

interface CollapsibleContentProps extends React.ComponentProps<"div"> {}

function CollapsibleContent({
  className,
  children,
  ...props
}: CollapsibleContentProps) {
  const { open } = useCollapsible()

  return (
    <div
      data-state={open ? "open" : "closed"}
      className={cn(
        "overflow-hidden transition-all duration-200",
        open ? "animate-in fade-in-0 slide-in-from-top-1" : "animate-out fade-out-0 slide-out-to-top-1 hidden",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }

