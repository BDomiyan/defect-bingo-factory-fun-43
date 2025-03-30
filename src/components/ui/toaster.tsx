
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  ToastIcon
} from "@/components/ui/toast"
import { cn } from "@/lib/utils"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast 
            key={id} 
            variant={variant} 
            {...props} 
            className={cn(
              "flex items-start gap-3 shadow-lg backdrop-blur-sm border-2",
              variant === "success" && "border-green-500/30",
              variant === "warning" && "border-yellow-500/30",
              variant === "error" && "border-red-500/30", 
              variant === "info" && "border-blue-500/30",
            )}
          >
            <ToastIcon variant={variant} />
            <div className="grid gap-1 flex-1">
              {title && <ToastTitle className="font-semibold">{title}</ToastTitle>}
              {description && (
                <ToastDescription className="opacity-90">{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose className="opacity-70 hover:opacity-100 transition-opacity" />
          </Toast>
        )
      })}
      <ToastViewport className="p-6" />
    </ToastProvider>
  )
}
