"use client"

import * as React from "react"
import { CheckCircle2, X, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: "default" | "success" | "error"
  duration?: number
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, "id">) => void
  removeToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined)

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const addToast = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(7)
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 3000,
    }
    setToasts((prev) => [...prev, newToast])

    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, newToast.duration)
    }
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[]
  removeToast: (id: string) => void
}) {
  return (
    <div className="fixed top-0 right-0 z-[100] flex flex-col-reverse gap-2 p-4 w-full sm:w-auto max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const variant = toast.variant || "default"

  return (
    <div
      className={cn(
        "group relative flex w-full items-start gap-3 rounded-xl border bg-card p-4 shadow-lg",
        "animate-in slide-in-from-top-5 fade-in-0",
        variant === "success" && "border-amber-200/50 bg-amber-50/80 dark:bg-amber-950/10",
        variant === "error" && "border-destructive/20 bg-destructive/5"
      )}
      role="alert"
    >
      {variant === "success" && (
        <CheckCircle2 className="h-5 w-5 shrink-0 text-amber-500 dark:text-amber-400" />
      )}
      {variant === "error" && (
        <XCircle className="h-5 w-5 shrink-0 text-destructive" />
      )}
      <div className="flex-1 space-y-1">
        {toast.title && (
          <p
            className={cn(
              "text-sm font-medium",
              variant === "success" && "text-amber-700 dark:text-amber-200",
              variant === "error" && "text-destructive"
            )}
          >
            {toast.title}
          </p>
        )}
        {toast.description && (
          <p
            className={cn(
              "text-sm",
              variant === "success" && "text-amber-600 dark:text-amber-300",
              variant === "error" && "text-destructive/80"
            )}
          >
            {toast.description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        className={cn(
          "shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity",
          "hover:bg-muted hover:text-foreground",
          "group-hover:opacity-100 focus:opacity-100 focus:outline-none"
        )}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

