"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

// Bottom-right reads naturally on desktop but sits under a thumb (or the
// mobile drawer) on small screens, so default to top-center below `sm`.
function useResponsiveToastPosition(): ToasterProps["position"] {
  const [position, setPosition] =
    React.useState<ToasterProps["position"]>("bottom-right")

  React.useEffect(() => {
    const query = window.matchMedia("(max-width: 639px)")
    const update = () =>
      setPosition(query.matches ? "top-center" : "bottom-right")
    update()
    query.addEventListener("change", update)
    return () => query.removeEventListener("change", update)
  }, [])

  return position
}

const Toaster = ({ position, ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()
  const responsivePosition = useResponsiveToastPosition()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position={position ?? responsivePosition}
      style={{ fontFamily: "inherit", overflowWrap: "anywhere" }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "bg-background text-foreground border-border border-2 font-heading shadow-shadow rounded-base text-[13px] flex items-center gap-2.5 p-4 w-[356px] [&:has(button)]:justify-between",
          description: "font-base",
          actionButton:
            "font-base border-2 text-[12px] h-6 px-2 bg-main text-main-foreground border-border rounded-base shrink-0",
          cancelButton:
            "font-base border-2 text-[12px] h-6 px-2 bg-secondary-background text-foreground border-border rounded-base shrink-0",
          error: "bg-red-300 text-black",
          loading:
            "[&[data-sonner-toast]_[data-icon]]:flex [&[data-sonner-toast]_[data-icon]]:size-4 [&[data-sonner-toast]_[data-icon]]:relative [&[data-sonner-toast]_[data-icon]]:justify-start [&[data-sonner-toast]_[data-icon]]:items-center [&[data-sonner-toast]_[data-icon]]:flex-shrink-0",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
