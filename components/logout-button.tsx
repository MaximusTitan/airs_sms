"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

interface LogoutButtonProps {
  iconOnly?: boolean;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export function LogoutButton({ iconOnly = false, variant = "outline", size = "default" }: LogoutButtonProps) {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  if (iconOnly) {
    return (
      <Button onClick={logout} variant={variant} size={size} className="h-8 w-8 p-0">
        <LogOut className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button onClick={logout} variant={variant} className="w-full">
      <LogOut className="h-4 w-4 mr-2" />
      Logout
    </Button>
  );
}
