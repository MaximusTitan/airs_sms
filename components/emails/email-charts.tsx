'use client';

import { 
  ChartContainer,
  ChartConfig,
  ChartTooltip,
  ChartTooltipContent 
} from "@/components/ui/chart";
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
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { EmailMetricsByDate, EmailEngagementTrend } from '@/lib/email-analytics';

interface EmailVolumeChartProps {
  data: EmailMetricsByDate[];
}

// Chart configurations
const volumeChartConfig = {
  sent: {
    label: "Sent",
    color: "hsl(var(--chart-1))",
  },
  delivered: {
    label: "Delivered", 
    color: "hsl(var(--chart-2))",
  },
  opened: {
    label: "Opened",
    color: "hsl(var(--chart-3))",
  },
  clicked: {
    label: "Clicked",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig;

const engagementChartConfig = {
  openRate: {
    label: "Open Rate",
    color: "hsl(var(--chart-1))",
  },
  clickRate: {
    label: "Click Rate",
    color: "hsl(var(--chart-2))",
  },
  bounceRate: {
    label: "Bounce Rate",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

const performanceChartConfig = {
  delivered: {
    label: "Delivered",
    color: "hsl(var(--chart-1))",
  },
  bounced: {
    label: "Bounced",
    color: "hsl(var(--chart-2))",
  },
  failed: {
    label: "Failed",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

const statusChartConfig = {
  delivered: {
    label: "Delivered",
    color: "hsl(var(--chart-1))",
  },
  opened: {
    label: "Opened",
    color: "hsl(var(--chart-2))",
  },
  clicked: {
    label: "Clicked", 
    color: "hsl(var(--chart-3))",
  },
  bounced: {
    label: "Bounced",
    color: "hsl(var(--chart-4))",
  },
  failed: {
    label: "Failed",
    color: "hsl(var(--chart-5))",
  },
  complained: {
    label: "Complained",
    color: "hsl(var(--chart-6))",
  },
  unsubscribed: {
    label: "Unsubscribed",
    color: "hsl(var(--chart-7))",
  },
} satisfies ChartConfig;

export function EmailVolumeChart({ data }: EmailVolumeChartProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-sm">No email data available</p>
          <p className="text-xs">Send some emails to see analytics</p>
        </div>
      </div>
    );
  }

  return (
    <ChartContainer config={volumeChartConfig} className="h-64 w-full">
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          tickFormatter={formatDate}
          fontSize={12}
        />
        <YAxis fontSize={12} />
        <ChartTooltip 
          content={<ChartTooltipContent />}
          labelFormatter={(value) => formatDate(value as string)}
        />
        <Area 
          type="monotone" 
          dataKey="sent" 
          stackId="1" 
          stroke="var(--color-sent)" 
          fill="var(--color-sent)" 
          fillOpacity={0.7}
        />
        <Area 
          type="monotone" 
          dataKey="delivered" 
          stackId="1" 
          stroke="var(--color-delivered)" 
          fill="var(--color-delivered)" 
          fillOpacity={0.7}
        />
        <Area 
          type="monotone" 
          dataKey="opened" 
          stackId="1" 
          stroke="var(--color-opened)" 
          fill="var(--color-opened)" 
          fillOpacity={0.7}
        />
        <Area 
          type="monotone" 
          dataKey="clicked" 
          stackId="1" 
          stroke="var(--color-clicked)" 
          fill="var(--color-clicked)" 
          fillOpacity={0.7}
        />
      </AreaChart>
    </ChartContainer>
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

  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-sm">No engagement data available</p>
          <p className="text-xs">Send some emails to see engagement trends</p>
        </div>
      </div>
    );
  }

  return (
    <ChartContainer config={engagementChartConfig} className="h-64 w-full">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          tickFormatter={formatDate}
          fontSize={12}
        />
        <YAxis 
          domain={[0, 100]}
          fontSize={12}
          tickFormatter={(value) => `${value}%`}
        />
        <ChartTooltip 
          content={<ChartTooltipContent />}
          labelFormatter={(value) => formatDate(value as string)}
          formatter={(value: number) => [`${value.toFixed(1)}%`]}
        />
        <Line 
          type="monotone" 
          dataKey="openRate" 
          stroke="var(--color-openRate)" 
          strokeWidth={2}
          dot={{ r: 3 }}
        />
        <Line 
          type="monotone" 
          dataKey="clickRate" 
          stroke="var(--color-clickRate)" 
          strokeWidth={2}
          dot={{ r: 3 }}
        />
        <Line 
          type="monotone" 
          dataKey="bounceRate" 
          stroke="var(--color-bounceRate)" 
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ChartContainer>
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

  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-sm">No performance data available</p>
          <p className="text-xs">Send some emails to see performance metrics</p>
        </div>
      </div>
    );
  }

  return (
    <ChartContainer config={performanceChartConfig} className="h-64 w-full">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          tickFormatter={formatDate}
          fontSize={12}
        />
        <YAxis fontSize={12} />
        <ChartTooltip 
          content={<ChartTooltipContent />}
          labelFormatter={(value) => formatDate(value as string)}
        />
        <Bar dataKey="delivered" fill="var(--color-delivered)" />
        <Bar dataKey="bounced" fill="var(--color-bounced)" />
        <Bar dataKey="failed" fill="var(--color-failed)" />
      </BarChart>
    </ChartContainer>
  );
}

interface EmailStatusPieChartProps {
  data: {
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    failed: number;
    complained: number;
    unsubscribed: number;
  };
}

export function EmailStatusPieChart({ data }: EmailStatusPieChartProps) {
  const pieData = [
    { name: 'delivered', value: data.delivered, fill: 'var(--color-delivered)' },
    { name: 'opened', value: data.opened, fill: 'var(--color-opened)' },
    { name: 'clicked', value: data.clicked, fill: 'var(--color-clicked)' },
    { name: 'bounced', value: data.bounced, fill: 'var(--color-bounced)' },
    { name: 'failed', value: data.failed, fill: 'var(--color-failed)' },
    { name: 'complained', value: data.complained, fill: 'var(--color-complained)' },
    { name: 'unsubscribed', value: data.unsubscribed, fill: 'var(--color-unsubscribed)' },
  ].filter(item => item.value > 0);

  // Handle empty data
  if (pieData.length === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-sm">No status data available</p>
          <p className="text-xs">Send some emails to see status distribution</p>
        </div>
      </div>
    );
  }

  return (
    <ChartContainer config={statusChartConfig} className="h-64 w-full">
      <PieChart>
        <ChartTooltip 
          content={<ChartTooltipContent />}
          formatter={(value: number, name: string) => [
            value.toLocaleString(),
            statusChartConfig[name as keyof typeof statusChartConfig]?.label || name
          ]}
        />
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={5}
          dataKey="value"
        >
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}
