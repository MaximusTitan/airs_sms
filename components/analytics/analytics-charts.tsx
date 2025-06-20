"use client";

import { Card } from "@/components/ui/card";
import { Lead } from "@/lib/types/database";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { format, subDays, eachDayOfInterval, startOfMonth, endOfMonth, eachWeekOfInterval } from 'date-fns';

interface AnalyticsChartsProps {
  leads: (Lead & { forms?: { name: string } })[];
}

export function AnalyticsCharts({ leads }: AnalyticsChartsProps) {
  // Leads by status
  const statusData = [
    { name: 'Qualified', value: leads.filter(l => l.status === 'qualified').length, color: '#10B981' },
    { name: 'Unqualified', value: leads.filter(l => l.status === 'unqualified').length, color: '#F59E0B' },
    { name: 'Trash', value: leads.filter(l => l.status === 'trash').length, color: '#EF4444' },
  ].filter(item => item.value > 0);

  // Leads by source
  const sourceData = leads.reduce((acc, lead) => {
    const source = lead.forms?.name || lead.source || 'Direct';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sourceChartData = Object.entries(sourceData).map(([name, value]) => ({
    name,
    value,
  }));

  // Daily leads for the last 30 days
  const last30Days = eachDayOfInterval({
    start: subDays(new Date(), 29),
    end: new Date(),
  });

  const dailyLeadsData = last30Days.map(date => {
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

  // Weekly conversion trend
  const weeklyData = eachWeekOfInterval({
    start: startOfMonth(subDays(new Date(), 90)),
    end: endOfMonth(new Date()),
  }).map(weekStart => {
    const weekLeads = leads.filter(lead => {
      const leadDate = new Date(lead.created_at);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return leadDate >= weekStart && leadDate <= weekEnd;
    });

    const qualifiedWeekLeads = weekLeads.filter(lead => lead.status === 'qualified');
    const conversionRate = weekLeads.length > 0 ? (qualifiedWeekLeads.length / weekLeads.length) * 100 : 0;

    return {
      week: format(weekStart, 'MMM dd'),
      leads: weekLeads.length,
      conversionRate: conversionRate.toFixed(1),
    };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">      {/* Daily Leads Chart */}
      <Card className="p-6 lg:col-span-2">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Daily Leads (Last 30 Days)
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyLeadsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="leads" fill="#3B82F6" name="Total Leads" />
              <Bar dataKey="qualified" fill="#10B981" name="Qualified" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>      {/* Leads by Status */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Leads by Status
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>      {/* Leads by Source */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Leads by Source
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sourceChartData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={80} />
              <Tooltip />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>      {/* Conversion Rate Trend */}
      <Card className="p-6 lg:col-span-2">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Weekly Conversion Rate Trend
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}%`, 'Conversion Rate']} />
              <Line 
                type="monotone" 
                dataKey="conversionRate" 
                stroke="#10B981" 
                strokeWidth={2}
                dot={{ fill: '#10B981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
