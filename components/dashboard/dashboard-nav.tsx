"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Mail, 
  BarChart3,
  LogOut,
  UserCheck,
  Menu,
  ChevronLeft
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Leads", href: "/dashboard/leads", icon: Users },
  { name: "Groups", href: "/dashboard/groups", icon: UserCheck },
  { name: "Forms", href: "/dashboard/forms", icon: FileText },
  { name: "Emails", href: "/dashboard/emails", icon: Mail },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
];

export function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Handle mounting and localStorage initialization
  useEffect(() => {
    setIsMounted(true);
    try {
      const savedState = localStorage.getItem('dashboard-nav-collapsed');
      if (savedState !== null) {
        setIsCollapsed(JSON.parse(savedState));
      }
    } catch (error) {
      console.error('Error loading nav state:', error);
    }
  }, []);

  // Save collapsed state to localStorage when it changes
  const toggleCollapsed = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    try {
      localStorage.setItem('dashboard-nav-collapsed', JSON.stringify(newState));
    } catch (error) {
      console.error('Error saving nav state:', error);
    }
  };

  useEffect(() => {
    const getUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email || "");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setIsLoading(false);
      }
    };
    getUser();
  }, []);

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!isMounted) {
    return null;
  }

  return (
    <div className={cn(
      "flex flex-col bg-card border-r border-border shadow-sm transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="flex items-center justify-between h-16 px-4 border-b border-border">
        {!isCollapsed && (
          <h1 className="text-2xl font-bold text-rose-600">
            Sales CRM
          </h1>
        )}
        <Button
          onClick={toggleCollapsed}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isCollapsed ? "justify-center" : "",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <Icon className={cn("h-5 w-5 flex-shrink-0", !isCollapsed && "mr-3")} />
              {!isCollapsed && item.name}
            </Link>
          );
        })}
      </nav>        <div className="px-4 py-4 border-t border-border">        <div className={cn("flex items-center", isCollapsed ? "justify-center" : "justify-between")}>
          <div className="flex-1 min-w-0">
            {!isCollapsed && (
              <>
                <p className="text-sm font-medium text-foreground truncate">
                  {isLoading ? "Loading..." : userEmail || "No email"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Logged in
                </p>
              </>
            )}
          </div>
          <Button
            onClick={logout}
            variant="ghost"
            size="sm"
            className={cn("h-8 w-8 p-0", !isCollapsed && "ml-2")}
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
