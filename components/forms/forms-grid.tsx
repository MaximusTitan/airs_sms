"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Form } from "@/lib/types/database";
import { safeFormatDistanceToNow } from "@/lib/utils/date-utils";
import { Eye, Edit, Copy, MoreHorizontal, ExternalLink, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface FormsGridProps {
  forms: (Form & { leads?: { count: number }[] })[];
}

export function FormsGrid({ forms }: FormsGridProps) {
  const router = useRouter();
  const supabase = createClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getLeadCount = (form: Form & { leads?: { count: number }[] }) => {
    return form.leads?.[0]?.count || 0;
  };

  const copyFormUrl = (formId: string) => {
    const url = `${window.location.origin}/forms/${formId}`;
    navigator.clipboard.writeText(url);
    // You could add a toast notification here
  };

  const deleteForm = async (formId: string) => {
    if (!confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      return;
    }

    setDeletingId(formId);
    try {
      const { error } = await supabase
        .from('forms')
        .delete()
        .eq('id', formId);

      if (error) throw error;

      // Refresh the page to update the forms list
      router.refresh();
    } catch (error) {
      console.error('Error deleting form:', error);
      alert('Failed to delete form. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {forms.length === 0 ? (        <div className="col-span-full">
          <Card className="p-12 text-center">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <Eye className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              No forms yet
            </h3>
            <p className="text-muted-foreground mb-4">
              Create your first form to start collecting leads
            </p>
            <Link href="/dashboard/forms/new">
              <Button>Create Form</Button>
            </Link>
          </Card>
        </div>
      ) : (
        forms.map((form) => (
          <Card key={form.id} className="p-6 hover:shadow-lg transition-shadow">            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {form.name}
                </h3>
                {form.description && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {form.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant={form.is_active ? "default" : "secondary"}>
                    {form.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
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
                  </DropdownMenuItem>                  <DropdownMenuItem onClick={() => copyFormUrl(form.id)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy URL
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => deleteForm(form.id)}
                    className="text-red-600 hover:text-red-700 focus:text-red-700"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {deletingId === form.id ? 'Deleting...' : 'Delete'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
              <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">{form.fields.length}</span> fields
              </div>
              
              <div className="text-xs text-muted-foreground">
                {`Created ${safeFormatDistanceToNow(form.created_at, { addSuffix: true })}`}
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
