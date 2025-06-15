"use client";

import { Card } from "@/components/ui/card";
import { Lead } from "@/lib/types/database";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, eachDayOfInterval } from 'date-fns';

interface LeadsChartProps {
  leads: Lead[];
}

export function LeadsChart({ leads }: LeadsChartProps) {
  // Get last 7 days of data
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date(),
  });

  const chartData = last7Days.map(date => {
    const dayLeads = leads.filter(lead => {
      const leadDate = new Date(lead.created_at);
      return format(leadDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    });

    return {
      date: format(date, 'MMM dd'),
      leads: dayLeads.length,
      qualified: dayLeads.filter(lead => lead.status === 'qualified').length,
    };
  });

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Leads Overview (Last 7 Days)
      </h3>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="leads" fill="#3B82F6" name="Total Leads" />
            <Bar dataKey="qualified" fill="#10B981" name="Qualified" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
