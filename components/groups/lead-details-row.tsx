"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { Lead, FormField } from "@/lib/types/database";
import { safeFormatDate } from "@/lib/utils/date-utils";

interface LeadWithForm extends Lead {
  forms?: {
    name: string;
    fields: FormField[];
  };
}

interface GroupMember {
  id: string;
  created_at: string;
  leads: LeadWithForm;
}

interface LeadDetailsRowProps {
  member: GroupMember;
  getRegisteredAsValue: (lead: LeadWithForm) => string | null;
  renderFormData: (
    formData: Record<string, string | boolean | number>,
    formFields?: FormField[]
  ) => React.ReactElement;
}

export function LeadDetailsRow({
  member,
  getRegisteredAsValue,
  renderFormData,
}: LeadDetailsRowProps) {
  return (
    <TableRow key={`${member.leads.id}-expanded`}>
      <TableCell colSpan={10} className="px-6 py-6 bg-accent/20">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Lead Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Lead Information
              </h4>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-foreground">
                    Full Name:
                  </span>
                  <span className="text-sm text-muted-foreground ml-2">
                    {member.leads.name}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-foreground">
                    Email:
                  </span>
                  <span className="text-sm text-muted-foreground ml-2">
                    {member.leads.email}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-foreground">
                    Phone:
                  </span>
                  <span className="text-sm text-muted-foreground ml-2">
                    {member.leads.phone || "Not provided"}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-foreground">
                    Registered as:
                  </span>
                  <span className="text-sm text-muted-foreground ml-2">
                    {getRegisteredAsValue(member.leads) || "Not provided"}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-foreground">
                    Source:
                  </span>
                  <span className="text-sm text-muted-foreground ml-2">
                    {member.leads.forms?.name ||
                      member.leads.source ||
                      "Direct"}
                  </span>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Timeline
              </h4>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-foreground">
                    Lead Created:
                  </span>
                  <div className="text-sm text-muted-foreground ml-2">
                    {safeFormatDate(member.leads.created_at)}
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium text-foreground">
                    Last Updated:
                  </span>
                  <div className="text-sm text-muted-foreground ml-2">
                    {safeFormatDate(member.leads.updated_at)}
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium text-foreground">
                    Added to Group:
                  </span>
                  <div className="text-sm text-muted-foreground ml-2">
                    {safeFormatDate(member.created_at)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          {member.leads.tags && member.leads.tags.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Tags
              </h4>
              <div className="flex flex-wrap gap-1">
                {member.leads.tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {member.leads.notes && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Notes
              </h4>
              <div className="p-3 bg-background rounded-md border">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {member.leads.notes}
                </p>
              </div>
            </div>
          )}

          {/* Form Data */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Form Submission Data
            </h4>
            <div className="p-3 bg-background rounded-md border">
              {renderFormData(
                member.leads.form_data,
                member.leads.forms?.fields
              )}
            </div>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}
