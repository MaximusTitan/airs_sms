"use client";

import { Button } from "@/components/ui/button";
import { Plus, Mail } from "lucide-react";
import Link from "next/link";

export function EmailsHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Email Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Send and manage email campaigns
        </p>
      </div>
      
      <div className="flex gap-2">
        <Link href="/dashboard/emails/templates">
          <Button variant="outline" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Templates
          </Button>
        </Link>
        <Link href="/dashboard/emails/compose">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Compose Email
          </Button>
        </Link>
      </div>
    </div>
  );
}
