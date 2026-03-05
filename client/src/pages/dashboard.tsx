import { useQuery } from "@tanstack/react-query";
import MetricCard from "@/components/dashboard/metric-card";
import RecentCallsTable from "@/components/dashboard/recent-calls-table";
import { Button } from "@/components/ui/button";
import { Phone, Download, Clock, RotateCcw } from "lucide-react";
import type { DashboardMetrics, CallHistory } from "@shared/schema";
import { useLocation2 } from "@/contexts/LocationContext";

export default function Dashboard() {
  const { tenantId } = useLocation2();

  const { data: metrics, isLoading: metricsLoading, isFetching: metricsFetching, refetch: refetchMetrics } = useQuery<DashboardMetrics>({
    refetchOnMount: 'always',
    queryKey: ["/api/dashboard/metrics", tenantId],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/metrics?tenantId=${tenantId}`);
      if (!res.ok) throw new Error("Failed to fetch metrics");
      return res.json();
    },
  });

  const { data: recentCalls, isLoading: recentCallsLoading, isFetching: recentCallsFetching, refetch: refetchRecentCalls } = useQuery<CallHistory[]>({
    refetchOnMount: 'always',
    queryKey: ["/api/dashboard/recent-calls", tenantId],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/recent-calls?tenantId=${tenantId}`);
      if (!res.ok) throw new Error("Failed to fetch recent calls");
      return res.json();
    },
  });

  const isRefreshing = metricsFetching || recentCallsFetching;

  const handleRefresh = () => {
    refetchMetrics();
    refetchRecentCalls();
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/export/call-history?tenantId=${tenantId}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to export data");
      }

      // Get the filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || `call-history-${new Date().toISOString().split('T')[0]}.csv`;

      // Create blob and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export data. Please try again.");
    }
  };

  return (
    <div className="page-fade-in">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Performance Overview</h1>
            <p className="text-gray-400">Monitor AI receptionist metrics and call analytics</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleExport}
              className="bg-charcoal border-gray-700 text-white hover:bg-gray-800 hover:text-white"
              data-testid="button-export-report"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="btn-red-gradient"
              data-testid="button-refresh"
            >
              <RotateCcw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>
        
        {/* Last Updated */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mt-4">
          <Clock className="h-4 w-4" />
          <span data-testid="text-last-updated">Last updated: 2 minutes ago</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Calls"
          value={metrics?.totalCalls?.toString() || "0"}
          change={`${metrics?.totalCallsChange || 0}%`}
          changeType="increase"
          icon="phone"
          iconColor="blue"
          loading={metricsLoading}
          testId="card-total-calls"
        />
        <MetricCard
          title="Success Ratio"
          value={`${metrics?.successRatio || 0}%`}
          change={`${metrics?.successRatioChange || 0}%`}
          changeType="increase"
          icon="check-circle"
          iconColor="green"
          loading={metricsLoading}
          testId="card-success-ratio"
        />
        <MetricCard
          title="Avg Duration"
          value={metrics?.avgDuration || "0m 0s"}
          change={metrics?.avgDurationChange || "0s"}
          changeType="decrease"
          icon="clock"
          iconColor="amber"
          loading={metricsLoading}
          testId="card-avg-duration"
        />
        <MetricCard
          title="Escalations"
          value={metrics?.escalations?.toString() || "0"}
          change={`${metrics?.escalationsChange || 0}`}
          changeType="increase"
          icon="alert-triangle"
          iconColor="red"
          loading={metricsLoading}
          testId="card-escalations"
        />
      </div>

      {/* Recent Calls Table */}
      <RecentCallsTable 
        calls={recentCalls || []} 
        loading={recentCallsLoading} 
      />
    </div>
  );
}
