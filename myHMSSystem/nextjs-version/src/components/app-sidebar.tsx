"use client"

import * as React from "react"
import {
  LayoutPanelLeft,
  LayoutDashboard,
  Mail,
  CheckSquare,
  MessageCircle,
  Calendar,
  Shield,
  AlertTriangle,
  Settings,
  HelpCircle,
  CreditCard,
  LayoutTemplate,
  Users,
} from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { SidebarNotification } from "@/components/sidebar-notification"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { title } from "node:process"

const data = {
  user: {
    name: "ShadcnStore",
    email: "store@example.com",
    avatar: "",
  },
  navGroups: [
    {
      label: "Dashboards",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: LayoutDashboard,
        },
  
      ],
    },
    {
      label: "Apps",
      items: [
    
        {
          title: "Calendar",
          url: "/calendar",
          icon: Calendar,
        },
        {
          title: "Users",
          url: "/users",
          icon: Users,
        },
      ],
    },
    {
      label: "Pages",
      items: [
        {
          title: "Landing",
          url: "/landing",
          target: "_blank",
          icon: LayoutTemplate,
        },
        {
          title: "Reception",
          url: "#",
          icon: Shield,
          items: [
            {
              title: "Register Patients",
              url: "/register-patient",
            },
            {
              title: "View Patients",
              url: "/view-patients",
            },
            
          ],
        },

        {
          title: "Billing",
          url: "#",
          icon: CheckSquare,
          items: [
            {
              title: "Unpaid Patients",
              url: "/unpaid-patients",
            },
            {
              title:"paid patients",
              url: "/paid-patients"
            }

            
          ],

        },

        {
          title:"Triage",
          url:"#",
          icon: MessageCircle,
          items:[
            {
              title:"Triage Queue",
              url:"/triage-queue"
            },
            {
              title:"Triage Form",
              url:"/triage-form"
            }
          ]
        },

        {
          title:"OPD",
          url:"#",
          icon: Mail,
          items:[
            {
              title:"OPD Queue",
              url:"/opd-queue"
            },
            {
              title:"OPD Visit",
              url:"/opd-visit"
            },
            {
              title:"Admit to IPD",
              url:"/admit"
            }
          ] 
        },
        {
          title:"Maternity",
          url:"#",
          icon: Calendar,
          items:[
            {
              title:"Queue",
              url:"/maternity-queue"
            },
            {
              title:"New Case",
              url:"/maternity-new"
            },
            {
              title:"Record Delivery",
              url:"/delivery-record"
            }
          ]
        },
        {
          title:"Antenatal Clinic (ANC)",
          url:"#",
          icon: Calendar,
          items:[
            {
              title:"ANC Queue",
              url:"/anc-queue"
            },
            {
              title:"New ANC Visit",
              url:"/anc-new"
            }
          ]
        },
        {
          title:"Postnatal Clinic",
          url:"#",
          icon: Calendar,
          items:[
            {
              title:"Postnatal Queue",
              url:"/postnatal-queue"
            },
            {
              title:"New Postnatal Visit",
              url:"/postnatal-new"
            }
          ]
        },
        {
          title:"Laboratory",
          url:"#",
          icon: LayoutPanelLeft,
          items:[
            {
              title:"Dashboard",
              url:"/lab"
            },
            {
              title:"Test Master",
              url:"/lab/lab-master"
            },
            {
              title:"Test Requests",
              url:"/lab/lab-requests"
            },
            {
              title:"Sample Management",
              url:"/lab/samples"
            },
            {
              title:"Result Entry",
              url:"/lab/results"
            },
            {
              title:"Result Validation",
              url:"/lab/validation"
            },
            {
              title:"Result Delivery",
              url:"/lab/delivery"
            },
            {
              title:"Critical Alerts",
              url:"/lab/alerts"
            },
            {
              title:"Quality Control",
              url:"/lab/qc"
            },
            {
              title:"Billing Integration",
              url:"/lab/billing"
            }
          ]
        },

        {
          title:"Pharmacy",
          url:"#",
          icon: LayoutPanelLeft,
          items:[
            {
              title:"Dashboard",
              url:"/pharmacy"
            },
            {
              title:"Stock Management",
              url:"/pharmacy"
            }
          ]
        },
        
        {
          title:"Dental",
          url:"#",
          icon: LayoutPanelLeft,
          items:[
            {
              title:"Dental Queue",
              url:"/dental-queue"
            },
            {
              title:"Dental Visit",
              url:"/dental-visit"
            }
          ]
        },

        {
          title: "Errors",
          url: "#",
          icon: AlertTriangle,
          items: [
            {
              title: "Unauthorized",
              url: "/errors/unauthorized",
            },
            {
              title: "Forbidden",
              url: "/errors/forbidden",
            },
            {
              title: "Not Found",
              url: "/errors/not-found",
            },
            {
              title: "Internal Server Error",
              url: "/errors/internal-server-error",
            },
            {
              title: "Under Maintenance",
              url: "/errors/under-maintenance",
            },
          ],
        },
        {
          title: "Settings",
          url: "#",
          icon: Settings,
          items: [
            {
              title: "User Settings",
              url: "/settings/user",
            },
            {
              title: "Account Settings",
              url: "/settings/account",
            },
            {
              title: "Plans & Billing",
              url: "/settings/billing",
            },
            {
              title: "Appearance",
              url: "/settings/appearance",
            },
            {
              title: "Notifications",
              url: "/settings/notifications",
            },
            {
              title: "Connections",
              url: "/settings/connections",
            },
          ],
        },
        {
          title: "FAQs",
          url: "/faqs",
          icon: HelpCircle,
        },
        {
          title: "Pricing",
          url: "/pricing",
          icon: CreditCard,
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Logo size={24} className="text-current" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">ShadcnStore</span>
                  <span className="truncate text-xs">Admin Dashboard</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {data.navGroups.map((group) => (
          <NavMain key={group.label} label={group.label} items={group.items} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarNotification />
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
