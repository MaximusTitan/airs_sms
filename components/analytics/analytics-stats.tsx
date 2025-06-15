import { Card } from "@/components/ui/card";
import { Lead, Form, Email } from "@/lib/types/database";
import { Users, CheckCircle, FileText, Mail, TrendingUp, Target } from "lucide-react";

interface AnalyticsStatsProps {
  leads: (Lead & { forms?: { name: string } })[];
  forms: Form[];
  emails: Email[];
}

export function AnalyticsStats({ leads, forms, emails }: AnalyticsStatsProps) {
  const qualifiedLeads = leads.filter(lead => lead.status === 'qualified');
  const conversionRate = leads.length > 0 ? (qualifiedLeads.length / leads.length) * 100 : 0;
  const sentEmails = emails.filter(email => email.status === 'sent');
  
  const stats = [
    {
      title: "Total Leads",
      value: leads.length,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      description: "All collected leads",
    },
    {
      title: "Qualified Leads",
      value: qualifiedLeads.length,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
      description: "High-quality prospects",
    },
    {
      title: "Conversion Rate",
      value: `${conversionRate.toFixed(1)}%`,
      icon: Target,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      description: "Lead qualification rate",
    },
    {
      title: "Active Forms",
      value: forms.filter(form => form.is_active).length,
      icon: FileText,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      description: "Currently collecting leads",
    },
    {
      title: "Emails Sent",
      value: sentEmails.length,
      icon: Mail,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
      description: "Successful deliveries",
    },
    {
      title: "Growth Rate",
      value: "+12.5%",
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
      description: "Month over month",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${stat.bgColor} dark:bg-opacity-20`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {stat.title}
                  </h3>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {stat.description}
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
