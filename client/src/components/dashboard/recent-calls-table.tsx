import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Play, Phone, Clock, Calendar } from "lucide-react";
import type { CallHistory } from "@shared/schema";
import CallDetailsModal from "@/components/CallDetailsModal";

interface RecentCallsTableProps {
  calls: CallHistory[];
  loading?: boolean;
  title?: string;
  showPhoneNumber?: boolean;
}

const colorMap: Record<string, string> = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  amber: "bg-amber-500",
  purple: "bg-purple-500",
  red: "bg-red-500",
};

export default function RecentCallsTable({
  calls,
  loading = false,
  title = "Recent Call Details",
  showPhoneNumber = false,
}: RecentCallsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCall, setSelectedCall] = useState<CallHistory | null>(null);

  const formatTime = (date: Date | string | null | undefined) => {
    if (!date) return "N/A";
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return "N/A";
    return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatRelativeDate = (date: Date | string | null | undefined) => {
    if (!date) return "N/A";
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return "N/A";
    const now = new Date();

    const diffTime = now.getTime() - dateObj.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0m 0s";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const filteredCalls = calls.filter(
    (call) =>
      call.callType?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
      call.outcome?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
      call.callSid?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
      call.fromNumber?.includes(searchTerm) ||
      call.callSummary?.toLowerCase()?.includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <Card className="card-elevated bg-charcoal border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="h-6 skeleton-red rounded w-48"></div>
            <div className="h-9 w-64 skeleton-red rounded"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="skeleton-red h-16 rounded-lg"
                data-testid={`skeleton-${i}`}
              ></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="card-elevated bg-charcoal border-0">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-xl text-white">{title}</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search calls..."
                className="pl-10 bg-black/80 border-gray-700 text-white placeholder:text-gray-500 focus:border-primary focus:ring-1 focus:ring-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-calls"
                style={{ color: "white" }}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredCalls.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="text-left py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Call Type
                      </th>
                      <th className="text-left py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="text-left py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        From Number
                      </th>
                      <th className="text-left py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        User Sentiment
                      </th>
                      <th className="text-left py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Outcome
                      </th>
                      <th className="text-left py-4 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCalls.map((call, index) => (
                      <tr
                        key={call.id}
                        className={`border-b border-gray-800 transition-colors ${
                          index % 2 === 0 ? "bg-black/20" : "bg-transparent"
                        } hover:bg-gray-800/50`}
                        data-testid={`row-call-${call.id}`}
                      >
                        <td className="py-4 px-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-white">
                              {formatTime(call.startTime)}
                            </span>
                            <span className="text-gray-400 text-xs">
                              {formatRelativeDate(call.createdAt)}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-white">{call.callType}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-300">
                          {formatDuration(call.callDuration)}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-white">{call.fromNumber}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-white">{call.userSentiment}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-white">{call.callType}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              call.outcome === "AI Handled" || call.outcome === "AI handled"
                                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                            }`}
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
              <div className="block md:hidden space-y-3">
                {filteredCalls.map((call, index) => (
                  <div
                    key={call.id}
                    className={`relative bg-gradient-to-br from-gray-900/40 to-black/20 rounded-lg p-4 border border-gray-800/50 ${
                      index % 2 === 0 ? "bg-black/10" : ""
                    }`}
                    data-testid={`card-call-${call.id}`}
                  >
                    {/* Time and Date */}
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-800/50">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="font-semibold text-white text-base">
                            {formatTime(call.startTime)}
                          </span>
                        </div>
                        <span className="text-gray-400 text-xs ml-6">
                          {formatRelativeDate(call.createdAt)}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-0.5">Date</p>
                        <p className="text-gray-300 text-xs font-medium">
                          {new Date(call.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Call Type */}
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">Call Type</p>
                      <p className="text-white font-medium">{call.callType}</p>
                    </div>

                    {/* Duration and Outcome */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Duration</p>
                        <p className="text-gray-300 font-medium">{formatDuration(call.callDuration)}</p>
                      </div>
                      <span
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
                          call.outcome === "AI Handled" || call.outcome === "AI handled"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                        }`}
                      >
                        {call.outcome || "Unknown"}
                      </span>
                    </div>

                    {/* Action Button */}
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
            </>
          ) : (
            <div className="text-center py-12">
              <Phone className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No calls found</p>
              <p className="text-gray-500 text-sm mt-2">
                {searchTerm
                  ? "Try a different search term"
                  : "Recent calls will appear here"}
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
    </>
  );
}
