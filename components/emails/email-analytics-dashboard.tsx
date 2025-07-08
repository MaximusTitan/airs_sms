'use client';

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Calendar, TrendingUp, TrendingDown, Mail, Eye, MousePointer, AlertTriangle, XCircle, CheckCircle } from "lucide-react";
import { EmailAnalytics, EmailMetricsByDate, EmailEngagementTrend } from "@/lib/email-analytics";
import { 
  EmailVolumeChart, 
  EngagementRatesChart, 
  EmailPerformanceBarChart, 
  EmailStatusPieChart 
} from './email-charts';

interface EmailAnalyticsDashboardProps {
  initialData: {
    analytics: EmailAnalytics;
    dailyMetrics: EmailMetricsByDate[];
    engagementTrends: EmailEngagementTrend[];
  };
}

export function EmailAnalyticsDashboard({ initialData }: EmailAnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState('7d');
  const [analytics, setAnalytics] = useState(initialData.analytics);
  const [dailyMetrics, setDailyMetrics] = useState(initialData.dailyMetrics);
  const [engagementTrends, setEngagementTrends] = useState(initialData.engagementTrends);
  const [loading, setLoading] = useState(false);

  const refreshData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/email?range=${timeRange}`);
      const data = await response.json();
      setAnalytics(data.analytics);
      setDailyMetrics(data.dailyMetrics);
      setEngagementTrends(data.engagementTrends);
    } catch (error) {
      console.error('Failed to refresh analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/analytics/email?range=${timeRange}`);
        const data = await response.json();
        setAnalytics(data.analytics);
        setDailyMetrics(data.dailyMetrics);
        setEngagementTrends(data.engagementTrends);
      } catch (error) {
        console.error('Failed to refresh analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [timeRange]);

  const statCards = [
    {
      title: "Total Sent",
      value: analytics.totalSent.toLocaleString(),
      icon: Mail,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      description: "Emails delivered to recipients"
    },
    {
      title: "Delivery Rate",
      value: `${analytics.deliveryRate.toFixed(1)}%`,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
      description: `${analytics.delivered.toLocaleString()} delivered`,
      trend: analytics.deliveryRate >= 95 ? 'up' : analytics.deliveryRate >= 90 ? 'stable' : 'down'
    },
    {
      title: "Open Rate",
      value: `${analytics.openRate.toFixed(1)}%`,
      icon: Eye,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      description: `${analytics.opened.toLocaleString()} opened`,
      trend: analytics.openRate >= 20 ? 'up' : analytics.openRate >= 15 ? 'stable' : 'down'
    },
    {
      title: "Click Rate",
      value: `${analytics.clickRate.toFixed(1)}%`,
      icon: MousePointer,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      description: `${analytics.clicked.toLocaleString()} clicked`,
      trend: analytics.clickRate >= 3 ? 'up' : analytics.clickRate >= 2 ? 'stable' : 'down'
    },
    {
      title: "Bounce Rate",
      value: `${analytics.bounceRate.toFixed(1)}%`,
      icon: AlertTriangle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      description: `${analytics.bounced.toLocaleString()} bounced`,
      trend: analytics.bounceRate <= 2 ? 'up' : analytics.bounceRate <= 5 ? 'stable' : 'down'
    },
    {
      title: "Complaint Rate",
      value: `${analytics.complaintRate.toFixed(1)}%`,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
      description: `${analytics.complained.toLocaleString()} complaints`,
      trend: analytics.complaintRate <= 0.1 ? 'up' : analytics.complaintRate <= 0.5 ? 'stable' : 'down'
    }
  ];

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with time range selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Email Analytics</h2>
          <p className="text-muted-foreground">
            Track email performance and engagement metrics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select
            value={timeRange}
            onValueChange={setTimeRange}
            disabled={loading}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={refreshData} disabled={loading} variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{stat.value}</span>
                    {getTrendIcon(stat.trend)}
                  </div>
                </div>
              </div>
            </div>
            <p className={`text-sm mt-2 ${getTrendColor(stat.trend)}`}>
              {stat.description}
            </p>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Volume Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Email Volume Trends</h3>
          <EmailVolumeChart data={dailyMetrics} />
        </Card>

        {/* Engagement Rates Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Engagement Trends</h3>
          <EngagementRatesChart data={engagementTrends} />
        </Card>

        {/* Email Performance Bar Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Delivery Performance</h3>
          <EmailPerformanceBarChart data={dailyMetrics} />
        </Card>

        {/* Email Status Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Status Distribution</h3>
          <EmailStatusPieChart 
            data={{
              delivered: analytics.delivered,
              opened: analytics.opened,
              clicked: analytics.clicked,
              bounced: analytics.bounced,
              failed: analytics.failed,
              complained: analytics.complained,
              unsubscribed: analytics.unsubscribed
            }} 
          />
        </Card>
      </div>

      {/* Detailed Metrics Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Daily Breakdown</h3>
        <EmailMetricsTable data={dailyMetrics} />
      </Card>
    </div>
  );
}

function EmailMetricsTable({ data }: { data: EmailMetricsByDate[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Date</th>
            <th className="text-right p-2">Sent</th>
            <th className="text-right p-2">Delivered</th>
            <th className="text-right p-2">Opened</th>
            <th className="text-right p-2">Clicked</th>
            <th className="text-right p-2">Bounced</th>
            <th className="text-right p-2">Failed</th>
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 10).map((row, index) => (
            <tr key={index} className="border-b">
              <td className="p-2">{new Date(row.date).toLocaleDateString()}</td>
              <td className="text-right p-2">{row.sent.toLocaleString()}</td>
              <td className="text-right p-2">{row.delivered.toLocaleString()}</td>
              <td className="text-right p-2">{row.opened.toLocaleString()}</td>
              <td className="text-right p-2">{row.clicked.toLocaleString()}</td>
              <td className="text-right p-2">{row.bounced.toLocaleString()}</td>
              <td className="text-right p-2">{row.failed.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > 10 && (
        <p className="text-center text-muted-foreground py-4">
          Showing 10 of {data.length} days
        </p>
      )}
    </div>
  );
}
