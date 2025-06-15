"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Form } from "@/lib/types/database";
import { formatDistanceToNow } from "date-fns";
import { Eye, Edit, Copy, MoreHorizontal, ExternalLink } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

interface FormsGridProps {
  forms: (Form & { leads?: { count: number }[] })[];
}

export function FormsGrid({ forms }: FormsGridProps) {
  const getLeadCount = (form: Form & { leads?: { count: number }[] }) => {
    return form.leads?.[0]?.count || 0;
  };

  const copyFormUrl = (formId: string) => {
    const url = `${window.location.origin}/forms/${formId}`;
    navigator.clipboard.writeText(url);
    // You could add a toast notification here
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {forms.length === 0 ? (
        <div className="col-span-full">
          <Card className="p-12 text-center">
            <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Eye className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No forms yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Create your first form to start collecting leads
            </p>
            <Link href="/dashboard/forms/new">
              <Button>Create Form</Button>
            </Link>
          </Card>
        </div>
      ) : (
        forms.map((form) => (
          <Card key={form.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {form.name}
                </h3>
                {form.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {form.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant={form.is_active ? "default" : "secondary"}>
                    {form.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {getLeadCount(form)} leads
                  </span>
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/forms/${form.id}`} target="_blank">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Form
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/forms/${form.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => copyFormUrl(form.id)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy URL
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="space-y-3">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <span className="font-medium">{form.fields.length}</span> fields
              </div>
              
              <div className="text-xs text-gray-400 dark:text-gray-500">
                Created {formatDistanceToNow(new Date(form.created_at), { addSuffix: true })}
              </div>
              
              <div className="flex gap-2 pt-2">
                <Link href={`/forms/${form.id}`} target="_blank" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </Link>
                <Link href={`/dashboard/forms/${form.id}/edit`} className="flex-1">
                  <Button size="sm" className="w-full">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
