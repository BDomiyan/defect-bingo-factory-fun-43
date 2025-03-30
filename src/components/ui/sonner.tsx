
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      richColors
      expand
      closeButton
      position="top-right"
      toastOptions={{
        duration: 5000,
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg p-4 rounded-md",
          title: "text-sm font-semibold mb-1",
          description: "group-[.toast]:text-muted-foreground text-sm",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "!bg-green-50 !border-green-500/40 dark:!bg-green-900/60 dark:!border-green-500/40 animate-in fade-in-20",
          warning: "!bg-yellow-50 !border-yellow-500/40 dark:!bg-yellow-900/60 dark:!border-yellow-500/40 animate-in fade-in-20",
          error: "!bg-red-50 !border-red-500/40 dark:!bg-red-900/60 dark:!border-red-500/40 animate-in fade-in-20",
          info: "!bg-blue-50 !border-blue-500/40 dark:!bg-blue-900/60 dark:!border-blue-500/40 animate-in fade-in-20",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
