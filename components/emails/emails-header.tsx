"use client";

import { Button } from "@/components/ui/button";
import { Plus, Mail } from "lucide-react";
import Link from "next/link";

export function EmailsHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Email Management
        </h1>
        <p className="text-muted-foreground text-lg">
          Send and manage email campaigns
        </p>
      </div>
        <div className="flex gap-3">
        <Link href="/dashboard/emails/templates">
          <Button variant="outline" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Templates
          </Button>
        </Link>
        <Link href="/dashboard/emails/compose">
          <Button className="flex items-center gap-2 h-11 px-6 font-medium">
            <Plus className="h-4 w-4" />
            Compose Email
          </Button>
        </Link>
      </div>
    </div>
  );
}
