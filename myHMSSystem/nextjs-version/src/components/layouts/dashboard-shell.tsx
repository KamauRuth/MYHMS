"use client"

import * as React from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { ThemeCustomizer, ThemeCustomizerTrigger } from "@/components/theme-customizer"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useSidebarConfig } from "@/hooks/use-sidebar-config"
import type { CurrentStaff } from "@/lib/auth/roles"

export function DashboardShell({
  children,
  staff,
}: {
  children: React.ReactNode
  staff: CurrentStaff
}) {
  const [themeCustomizerOpen, setThemeCustomizerOpen] = React.useState(false)
  const { config } = useSidebarConfig()

  const sidebar = (
    <AppSidebar
      staff={staff}
      variant={config.variant}
      collapsible={config.collapsible}
      side={config.side}
    />
  )

  const content = (
    <SidebarInset>
      <SiteHeader staff={staff} />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">{children}</div>
        </div>
      </div>
      <SiteFooter />
    </SidebarInset>
  )

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "17rem",
        "--sidebar-width-icon": "3rem",
        "--header-height": "calc(var(--spacing) * 14)",
      } as React.CSSProperties}
      className={config.collapsible === "none" ? "sidebar-none-mode" : ""}
    >
      {config.side === "left" ? <>{sidebar}{content}</> : <>{content}{sidebar}</>}
      <ThemeCustomizerTrigger onClick={() => setThemeCustomizerOpen(true)} />
      <ThemeCustomizer open={themeCustomizerOpen} onOpenChange={setThemeCustomizerOpen} />
    </SidebarProvider>
  )
}
