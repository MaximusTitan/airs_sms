'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, BarChart3, Users, Target, RefreshCw, Plus, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface EmailsHeaderProps {
  totalEmails: number;
  totalLeads: number;
  conversionRate: number;
  currentTab?: 'emails' | 'analytics';
  onTabChange?: (tab: 'emails' | 'analytics') => void;
  onRefresh?: () => void | Promise<void>;
  isRefreshing?: boolean;
  avgOpenRate?: number;
  avgClickRate?: number;
}

export function EmailsHeader({ 
  totalEmails, 
  totalLeads, 
  conversionRate,
  currentTab = 'emails',
  onTabChange,
  onRefresh,
  isRefreshing = false,
  avgOpenRate,
  avgClickRate
}: EmailsHeaderProps) {
  const tabs = [
    {
      id: 'emails' as const,
      name: 'Email Management',
      icon: Mail,
      description: 'Compose and manage email campaigns'
    },
    {
      id: 'analytics' as const,
      name: 'Email Analytics',
      icon: BarChart3,
      description: 'Track performance and engagement'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Center</h1>
          <p className="text-muted-foreground">
            Manage your email campaigns and track performance metrics
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Link href="/dashboard/emails/compose">
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Compose Email
              </Button>
            </Link>
            <Link href="/dashboard/emails/templates">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Templates
              </Button>
            </Link>
          </div>
          
          {/* Refresh Button */}
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          )}
          
          {/* Stats Badges */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {totalEmails} emails
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {totalLeads} leads
            </Badge>
            {avgOpenRate !== undefined && (
              <Badge variant="secondary" className="flex items-center gap-1">
                📊 {avgOpenRate.toFixed(1)}% open rate
              </Badge>
            )}
            {avgClickRate !== undefined && (
              <Badge variant="secondary" className="flex items-center gap-1">
                🖱️ {avgClickRate.toFixed(1)}% click rate
              </Badge>
            )}
            <Badge variant="secondary" className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              {conversionRate.toFixed(1)}% conversion
            </Badge>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      {onTabChange && (
        <div className="border-b border-border">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors",
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}
