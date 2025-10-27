import { LayoutDashboard, Users, BookOpen, FileText, TrendingUp, BarChart3, Settings } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "User Management", url: "/users", icon: Users },
  { title: "Course Management", url: "/courses", icon: BookOpen },
  { title: "Content Management", url: "/content", icon: FileText },
  { title: "Enrollment Tracking", url: "/enrollments", icon: TrendingUp },
  { title: "Performance Monitoring", url: "/performance", icon: BarChart3 },
  { title: "System Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === "collapsed";

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent>
        <div className="p-6 flex items-center gap-3">
          {!collapsed && (
            <>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-sidebar-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-sidebar-foreground">EduAdmin</h1>
                <p className="text-xs text-sidebar-foreground/70">Learning Platform</p>
              </div>
            </>
          )}
          {collapsed && (
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto">
              <BookOpen className="h-6 w-6 text-sidebar-primary-foreground" />
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className="transition-all duration-200"
                  >
                    <NavLink to={item.url} end>
                      <item.icon className={collapsed ? "mx-auto" : "mr-2"} />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
