"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export function FormsHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Forms
        </h1>
        <p className="text-muted-foreground text-lg">
          Create and manage lead collection forms
        </p>
      </div>
      
      <Link href="/dashboard/forms/new">
        <Button className="flex items-center gap-2 bg-primary hover:bg-primary/90 h-11 px-6 font-medium">
          <Plus className="h-4 w-4" />
          Create Form
        </Button>
      </Link>
    </div>
  );
}
