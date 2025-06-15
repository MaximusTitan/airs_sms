"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export function FormsHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Forms
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Create and manage lead collection forms
        </p>
      </div>
      
      <Link href="/dashboard/forms/new">
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Form
        </Button>
      </Link>
    </div>
  );
}
