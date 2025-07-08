'use client';

import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { EmailMetricsByDate, EmailEngagementTrend } from '@/lib/email-analytics';

interface EmailVolumeChartProps {
  data: EmailMetricsByDate[];
}

export function EmailVolumeChart({ data }: EmailVolumeChartProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate}
            stroke="#666"
            fontSize={12}
          />
          <YAxis stroke="#666" fontSize={12} />
          <Tooltip 
            labelFormatter={(value) => formatDate(value as string)}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '6px'
            }}
          />
          <Area
            type="monotone"
            dataKey="sent"
            stackId="1"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.6}
            name="Sent"
          />
          <Area
            type="monotone"
            dataKey="delivered"
            stackId="2"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.6}
            name="Delivered"
          />
          <Area
            type="monotone"
            dataKey="opened"
            stackId="3"
            stroke="#8b5cf6"
            fill="#8b5cf6"
            fillOpacity={0.6}
            name="Opened"
          />
          <Area
            type="monotone"
            dataKey="clicked"
            stackId="4"
            stroke="#f59e0b"
            fill="#f59e0b"
            fillOpacity={0.6}
            name="Clicked"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface EngagementRatesChartProps {
  data: EmailEngagementTrend[];
}

export function EngagementRatesChart({ data }: EngagementRatesChartProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate}
            stroke="#666"
            fontSize={12}
          />
          <YAxis 
            stroke="#666" 
            fontSize={12}
            label={{ value: 'Rate (%)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            labelFormatter={(value) => formatDate(value as string)}
            formatter={(value: number, name: string) => [
              `${value.toFixed(2)}%`, 
              name
            ]}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '6px'
            }}
          />
          <Line
            type="monotone"
            dataKey="openRate"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
            name="Open Rate"
          />
          <Line
            type="monotone"
            dataKey="clickRate"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
            name="Click Rate"
          />
          <Line
            type="monotone"
            dataKey="bounceRate"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
            name="Bounce Rate"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface EmailPerformanceBarChartProps {
  data: EmailMetricsByDate[];
}

export function EmailPerformanceBarChart({ data }: EmailPerformanceBarChartProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate}
            stroke="#666"
            fontSize={12}
          />
          <YAxis stroke="#666" fontSize={12} />
          <Tooltip 
            labelFormatter={(value) => formatDate(value as string)}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '6px'
            }}
          />
          <Bar dataKey="delivered" fill="#10b981" name="Delivered" />
          <Bar dataKey="bounced" fill="#ef4444" name="Bounced" />
          <Bar dataKey="failed" fill="#6b7280" name="Failed" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface EmailStatusPieChartProps {
  data: {
    delivered: number;
    bounced: number;
    failed: number;
    complained: number;
  };
}

export function EmailStatusPieChart({ data }: EmailStatusPieChartProps) {
  const total = data.delivered + data.bounced + data.failed + data.complained;
  
  if (total === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center text-muted-foreground">
        No data available
      </div>
    );
  }

  const pieData = [
    { name: 'Delivered', value: data.delivered, color: '#10b981' },
    { name: 'Bounced', value: data.bounced, color: '#f59e0b' },
    { name: 'Failed', value: data.failed, color: '#ef4444' },
    { name: 'Complained', value: data.complained, color: '#8b5cf6' }
  ].filter(item => item.value > 0);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => 
              `${name} ${(percent * 100).toFixed(1)}%`
            }
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => [value.toLocaleString(), 'Count']}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '6px'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
