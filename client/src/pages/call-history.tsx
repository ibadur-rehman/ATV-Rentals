import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { CallHistory } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Search, Phone, Calendar, Clock, ChevronLeft, ChevronRight, X } from "lucide-react";
import CallDetailsModal from "@/components/CallDetailsModal";
import { useLocation2 } from "@/contexts/LocationContext";

interface PaginatedResponse {
  calls: CallHistory[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const getFirstDayOfMonth = () => {
  const date = new Date();
  date.setDate(1);
  return date.toISOString().split('T')[0];
};

const getLastDayOfMonth = () => {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  date.setDate(0);
  return date.toISOString().split('T')[0];
};

export default function CallHistoryPage() {
  const { tenantId } = useLocation2();
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState(getFirstDayOfMonth());
  const [toDate, setToDate] = useState(getLastDayOfMonth());
  const [page, setPage] = useState(1);
  const [selectedCall, setSelectedCall] = useState<CallHistory | null>(null);

  const queryParams = new URLSearchParams({
    ...(search && { search }),
    ...(fromDate && { fromDate }),
    ...(toDate && { toDate }),
    page: page.toString(),
    limit: "20",
    tenantId,
  });

  const { data, isLoading, isFetching, refetch } = useQuery<PaginatedResponse>({
    queryKey: ["/api/call-history", search, fromDate, toDate, page, tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/call-history?${queryParams}`);
      if (!response.ok) throw new Error("Failed to fetch call history");
      return response.json();
    },
  });

  const handleReset = () => {
    setSearch("");
    setFromDate(getFirstDayOfMonth());
    setToDate(getLastDayOfMonth());
    setPage(1);
  };

  const formatTime = (date: Date | string | null | undefined) => {
    if (!date) return "N/A";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "N/A";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (date: Date | string | null | undefined) => {
    if (!date) return "N/A";
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return "N/A";
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const seconds = String(dateObj.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const formatRelativeDate = (date: Date | string) => {
    const now = new Date();
    const callDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - callDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(callDate);
  };

  return (
    <div className="page-fade-in">
      <Card className="bg-charcoal shadow-2xl card-elevated border-0">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between mb-6">
            <CardTitle className="text-2xl font-bold text-white">All Calls</CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Phone className="w-4 h-4" />
              <span>{data?.total || 0} total calls</span>
            </div>
          </div>

          {/* Filters Section */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Search Input */}
              <div className="relative sm:col-span-2 lg:col-span-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search calls..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-primary focus:ring-primary"
                  data-testid="input-search"
                />
              </div>

              {/* From Date */}
              <div className="relative sm:col-span-2 lg:col-span-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                <Input
                  type="date"
                  placeholder="From Date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-primary focus:ring-primary"
                  data-testid="input-from-date"
                />
              </div>

              {/* To Date */}
              <div className="relative sm:col-span-2 lg:col-span-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                <Input
                  type="date"
                  placeholder="To Date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-primary focus:ring-primary"
                  data-testid="input-to-date"
                />
              </div>
          </div>

            {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <Button
                  onClick={() => refetch()}
                  disabled={isFetching}
                  variant="outline"
                  className="border-gray-700 text-gray-300 bg-gray-800 hover:text-black"
                  data-testid="button-refresh"
                >
                  <Clock className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                  {isFetching ? 'Refreshing...' : 'Refresh'}
                </Button>

                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="border-gray-700 text-gray-300 bg-gray-800 hover:text-white"
                  data-testid="button-reset"
                >
                  <X className="w-4 h-4 mr-2" />
                  Reset Filters
                </Button>
            </div>
          </div>  
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="spinner-red w-12 h-12"></div>
            </div>
          ) : data && data.calls.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-black/50 border-b border-gray-800">
                    <tr>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        From Number
                      </th>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        User Sentiment
                      </th>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Outcome
                      </th>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {data.calls.map((call, index) => (
                      <tr
                        key={call.id}
                        className={`transition-colors hover:bg-gray-900/30 ${
                          index % 2 === 0 ? "bg-black/20" : "bg-transparent"
                        }`}
                        data-testid={`row-call-${call.id}`}
                      >
                        <td className="py-4 px-4">
                          <span className="text-white font-medium" data-testid={`text-datetime-${call.id}`}>
                            {formatDateTime(call.startTime)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-300" data-testid={`text-type-${call.id}`}>
                            {call.callType || "General"}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-300" data-testid={`text-duration-${call.id}`}>
                            {formatDuration(call.callDuration)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-300" data-testid={`text-type-${call.id}`}>
                            {call.fromNumber || ""}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-300" data-testid={`text-type-${call.id}`}>
                            {call.userSentiment || ""}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                              call.outcome === "AI Handled" || call.outcome === "AI handled"
                                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                            }`}
                            data-testid={`text-outcome-${call.id}`}
                          >
                            {call.outcome || "Unknown"}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <Button
                            onClick={() => setSelectedCall(call)}
                            size="sm"
                            className="btn-red-gradient"
                            data-testid={`button-view-${call.id}`}
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="block md:hidden px-4 py-3 space-y-3">
                {data.calls.map((call, index) => (
                  <div
                    key={call.id}
                    className={`relative bg-gradient-to-br from-gray-900/40 to-black/20 rounded-lg p-4 border border-gray-800/50 ${
                      index % 2 === 0 ? "bg-black/10" : ""
                    }`}
                    data-testid={`card-call-${call.id}`}
                  >
                    {/* Date & Time Row */}
                    <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-800/50">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="font-semibold text-white text-sm">
                        {formatDateTime(call.startTime)}
                      </span>
                    </div>

                    {/* Call Type */}
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">Call Type</p>
                      <p className="text-white font-medium">{call.callType || "General"}</p>
                    </div>

                    {/* Duration and Outcome Row */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Duration</p>
                        <p className="text-gray-300 font-medium text-sm">{formatDuration(call.callDuration)}</p>
                      </div>
                      <span
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
                          call.outcome === "AI Handled" || call.outcome === "AI handled"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                        }`}
                      >
                        {call.outcome || "Unknown"}
                      </span>
                    </div>

                    {/* View Details Button */}
                    <Button
                      onClick={() => setSelectedCall(call)}
                      size="sm"
                      className="btn-red-gradient w-full"
                      data-testid={`button-view-mobile-${call.id}`}
                    >
                      View Details
                    </Button>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-800 px-4 sm:px-6 py-4 bg-black/20">
                <div className="text-xs sm:text-sm text-gray-400 text-center sm:text-left">
                  Showing {(data.page - 1) * data.limit + 1} to{" "}
                  {Math.min(data.page * data.limit, data.total)} of {data.total} calls
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    variant="outline"
                    size="sm"
                    className="border-gray-700 text-black-300 hover:bg-gray-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Previous</span>
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: data.totalPages }, (_, i) => i + 1)
                      .filter(
                        (p) =>
                          p === 1 ||
                          p === data.totalPages ||
                          Math.abs(p - page) <= 1
                      )
                      .map((p, i, arr) => (
                        <div key={p} className="contents">
                          {i > 0 && arr[i - 1] !== p - 1 && (
                            <span className="text-gray-500 px-1 sm:px-2">
                              ...
                            </span>
                          )}
                          <Button
                            onClick={() => setPage(p)}
                            variant={p === page ? "default" : "outline"}
                            size="sm"
                            className={
                              p === page
                                ? "btn-red-gradient min-w-[32px] sm:min-w-[40px] h-8 text-xs sm:text-sm"
                                : "border-gray-700 text-black-300 hover:bg-gray-800 hover:text-white min-w-[32px] sm:min-w-[40px] h-8 text-xs sm:text-sm"
                            }
                            data-testid={`button-page-${p}`}
                          >
                            {p}
                          </Button>
                        </div>
                      ))}
                  </div>
                  <Button
                    onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                    disabled={page === data.totalPages}
                    variant="outline"
                    size="sm"
                    className="border-gray-700 text-black-300 hover:bg-gray-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid="button-next-page"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-4 h-4 sm:ml-1" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Phone className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No calls found</p>
              <p className="text-gray-500 text-sm mt-2">
                {search || fromDate || toDate
                  ? "Try adjusting your filters"
                  : "Call history will appear here"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Call Details Modal */}
      <CallDetailsModal 
        call={selectedCall} 
        onClose={() => setSelectedCall(null)} 
      />
    </div>
  );
}
