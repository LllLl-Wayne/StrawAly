import * as React from "react"
import { cn } from "@/lib/utils"
import { useAccent } from "@/components/theme/accent-provider"
import { buttonAccentClasses, buttonCustomStyle } from "@/lib/themeAccent"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const { accent, customColor } = useAccent()
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 btn-sync",
          {
            [buttonAccentClasses(accent) + " shadow"]: variant === "default" && accent !== 'custom',
            "bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200": variant === "secondary",
            "border border-gray-200 bg-white shadow-sm hover:bg-gray-50": variant === "outline",
            "hover:bg-gray-100": variant === "ghost",
            "bg-red-500 text-white shadow hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-600": variant === "destructive",
          },
          {
            "h-9 px-4 py-2": size === "default",
            "h-8 rounded-md px-3 text-xs": size === "sm",
            "h-10 rounded-md px-8": size === "lg",
            "h-9 w-9": size === "icon",
          },
          className
        )}
        ref={ref}
        style={accent === 'custom' && variant === 'default' ? buttonCustomStyle(customColor) : undefined}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
