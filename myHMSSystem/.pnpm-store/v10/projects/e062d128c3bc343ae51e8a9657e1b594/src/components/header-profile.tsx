"use client"

import { CircleUser, LogOut, Settings } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { roleLabels, type CurrentStaff } from "@/lib/auth/roles"
import { createClient } from "@/lib/supabase/client"
import { endBrowserSession } from "@/lib/auth/browser-session"

export function HeaderProfile({ staff }: { staff: CurrentStaff }) {
  const router = useRouter()
  const fullName = `${staff.firstName} ${staff.lastName}`.trim()

  async function handleLogout() {
    endBrowserSession()
    await createClient().auth.signOut()
    router.replace("/sign-in")
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <CircleUser className="size-5" />
          <span className="sr-only">Open user menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>
          <p className="truncate text-sm font-medium">{fullName}</p>
          <p className="truncate text-xs font-normal text-muted-foreground">{staff.email}</p>
          <p className="mt-1 text-xs font-medium text-primary">{roleLabels[staff.role]}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link href="/settings/account"><Settings />My account</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut />Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
