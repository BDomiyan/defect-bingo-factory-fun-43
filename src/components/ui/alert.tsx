
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { AlertCircle, CheckCircle, InfoIcon, XCircle, Bell } from "lucide-react"

import { cn } from "@/lib/utils"
import { AlertType } from "@/lib/types"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground shadow-md transition-all",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground border-muted",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        success:
          "border-green-500/50 bg-green-50 text-green-800 dark:border-green-500 dark:bg-green-950/50 dark:text-green-300 [&>svg]:text-green-500",
        warning:
          "border-yellow-500/50 bg-yellow-50 text-yellow-800 dark:border-yellow-500 dark:bg-yellow-950/50 dark:text-yellow-300 [&>svg]:text-yellow-500",
        info:
          "border-blue-500/50 bg-blue-50 text-blue-800 dark:border-blue-500 dark:bg-blue-950/50 dark:text-blue-300 [&>svg]:text-blue-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface AlertProps extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof alertVariants> {
  icon?: React.ReactNode
}

const getIconByVariant = (variant: string | undefined): React.ReactNode => {
  switch (variant) {
    case "success":
      return <CheckCircle className="h-4 w-4" />
    case "warning":
      return <AlertCircle className="h-4 w-4" />
    case "destructive":
      return <XCircle className="h-4 w-4" />
    case "info":
      return <InfoIcon className="h-4 w-4" />
    default:
      return <Bell className="h-4 w-4" />
  }
}

const Alert = React.forwardRef<
  HTMLDivElement,
  AlertProps
>(({ className, variant, icon, children, ...props }, ref) => {
  const IconToRender = icon || getIconByVariant(variant);
  
  return (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant }), "animate-fade-in", className)}
      {...props}
    >
      {IconToRender}
      {children}
    </div>
  )
})
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
