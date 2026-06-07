// ============================================================
// frontend/src/components/Sidebar/AppSidebar.tsx  (replace)
// Adds a CRM section to the sidebar navigation
// ============================================================

import { Link, useRouterState } from "@tanstack/react-router"
import {
  Briefcase,
  Building2,
  CalendarClock,
  Handshake,
  Home,
  Users as UsersIcon,
} from "lucide-react"
import { SidebarAppearance } from "@/components/Common/Appearance"
import { Logo } from "@/components/Common/Logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import useAuth from "@/hooks/useAuth"
import { User } from "./User"

const mainItems = [
  { icon: Home, title: "Dashboard", path: "/" },
  { icon: Briefcase, title: "Items", path: "/items" },
]

const crmItems = [
  { icon: Building2, title: "Companies", path: "/crm/companies" },
  { icon: UsersIcon, title: "Contacts", path: "/crm/contacts" },
  { icon: Handshake, title: "Deals", path: "/crm/deals" },
  { icon: CalendarClock, title: "Activities", path: "/crm/activities" },
]

export function AppSidebar() {
  const { user: currentUser } = useAuth()
  const location = useRouterState({ select: (s) => s.location.pathname })

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-4 py-6 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:items-center">
        <Logo variant="responsive" />
      </SidebarHeader>

      <SidebarContent>
        {/* Main nav */}
        <SidebarGroup>
          <SidebarMenu>
            {mainItems.map((item) => (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton asChild isActive={location === item.path}>
                  <Link to={item.path}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            {currentUser?.is_superuser && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/admin"}>
                  <Link to="/admin">
                    <UsersIcon />
                    <span>Admin</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>

        {/* CRM nav */}
        <SidebarGroup>
          <SidebarGroupLabel>CRM</SidebarGroupLabel>
          <SidebarMenu>
            {crmItems.map((item) => (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  asChild
                  isActive={location.startsWith(item.path)}
                >
                  <Link to={item.path}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarAppearance />
        <User user={currentUser} />
      </SidebarFooter>
    </Sidebar>
  )
}

export default AppSidebar
