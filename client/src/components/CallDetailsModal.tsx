import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Phone, X, MessageCircle, Download } from "lucide-react";
import type { CallHistory } from "@shared/schema";
import { parseSentSmsMessages } from "@/lib/utils";

interface CallDetailsModalProps {
  call: CallHistory | null;
  onClose: () => void;
}

export default function CallDetailsModal({ call, onClose }: CallDetailsModalProps) {
  if (!call) return null;

  const sentMessages = parseSentSmsMessages(call.sentSmsMessages);
  const smsCount = sentMessages.length;

  const formatTime = (date: Date | string | null | undefined) => {
    if (!date) return "N/A";
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return "N/A";
    return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "N/A";
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return "N/A";
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const parseTranscript = (transcript: string | null) => {
    if (!transcript) return [];
    
    const lines = transcript.split('\n').filter(line => line.trim());
    const messages: { speaker: 'agent' | 'user'; text: string }[] = [];
    
    for (const line of lines) {
      const agentMatch = line.match(/^Agent:\s*(.+)$/i);
      const userMatch = line.match(/^User:\s*(.+)$/i);
      
      if (agentMatch) {
        messages.push({ speaker: 'agent', text: agentMatch[1].trim() });
      } else if (userMatch) {
        messages.push({ speaker: 'user', text: userMatch[1].trim() });
      }
    }
    
    return messages;
  };

  const transcriptMessages = parseTranscript(call.transcript);

  const getStatusColor = (status: string | null) => {
    if (status === 'AI Handled') return 'text-green-400';
    if (status === 'Escalated') return 'text-yellow-400';
    return 'text-gray-400';
  };

  return (
    <Dialog open={!!call} onOpenChange={onClose}>
      <DialogContent
        className="bg-black max-w-5xl shadow-2xl modal-content-animated overflow-hidden p-0"
        data-testid="dialog-call-details"
        style={{ 
          maxHeight: "90vh"
        }}
      >
        {/* Simplified Header */}
        <DialogHeader className="bg-gradient-to-r from-primary/10 to-transparent p-6 pb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <DialogTitle className="text-xl font-bold text-white">
                Call Details
              </DialogTitle>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-all flex items-center justify-center"
              data-testid="button-close-modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 max-h-[calc(90vh-100px)] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Plain Text Metadata */}
            <div className="lg:col-span-1 space-y-5 pt-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">Date</p>
                <p className="text-white font-semibold" data-testid="text-call-date">
                  {formatDate(call.startTime)}
                </p>
                <p className="text-gray-400 text-sm mt-0.5" data-testid="text-call-time">
                  {formatTime(call.startTime)}
                </p>
              </div>

              {/* Audio Recording Section */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Recording</p>
                {call.recordingUrl ? (
                  <div className="space-y-2">
                    <audio 
                      controls 
                      className="w-full h-10" 
                      data-testid="audio-player"
                      style={{
                        filter: 'hue-rotate(330deg)',
                      }}
                    >
                      <source src={call.recordingUrl} type="audio/mpeg" />
                      <source src={call.recordingUrl} type="audio/wav" />
                      Your browser does not support the audio element.
                    </audio>
                    <a
                      href={call.recordingUrl}
                      download={`call-recording-${call.id}.mp3`}
                      className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                      data-testid="button-download-audio"
                    >
                      <Download className="w-4 h-4" />
                      Download Recording
                    </a>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm italic" data-testid="text-no-recording">
                    Recording unavailable
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">From</p>
                <p className="text-white font-semibold" data-testid="text-from-number">
                  {call.fromNumber}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">To</p>
                <p className="text-white font-semibold" data-testid="text-to-number">
                  {call.toNumber}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">Duration</p>
                <p className="text-white font-bold text-lg" data-testid="text-call-duration">
                  {formatDuration(call.callDuration)}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">Status</p>
                <p className={`font-bold ${getStatusColor(call.status)}`} data-testid="text-call-status">
                  {call.status || "Unknown"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">Call Type</p>
                <p className="text-white font-semibold" data-testid="text-call-type">
                  {call.callType || "General"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">Sentiment</p>
                <p className="text-white font-semibold" data-testid="text-user-sentiment">
                  {call.userSentiment || "Unknown"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">SMS Sent</p>
                <p className="text-pink-300 font-bold text-lg" data-testid="text-sms-count">
                  {smsCount}
                </p>
              </div>

              {call.callSummary && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">Summary</p>
                  <p className="text-gray-300 text-sm leading-relaxed" data-testid="text-call-summary">
                    {call.callSummary}
                  </p>
                </div>
              )}
            </div>

            {/* Right Column: Transcript & SMS Tabs */}
            <div className="lg:col-span-2 pt-4">
              <Tabs defaultValue="transcript" className="w-full">
                <TabsList className="w-full bg-gray-900/50">
                  <TabsTrigger value="transcript" className="flex-1">
                    💬 Transcript
                  </TabsTrigger>
                  <TabsTrigger value="sms" className="flex-1">
                    📱 SMS Messages ({smsCount})
                  </TabsTrigger>
                </TabsList>

                {/* Transcript Tab */}
                <TabsContent value="transcript" className="mt-4">
                  {transcriptMessages.length > 0 ? (
                    <div className="bg-gray-900/30 rounded-lg p-4 max-h-[500px] overflow-y-auto custom-scrollbar" data-testid="detail-transcript">
                      <div className="space-y-3">
                        {transcriptMessages.map((message, index) => (
                          <div 
                            key={index} 
                            className={`flex ${message.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[85%] ${message.speaker === 'user' ? 'ml-auto' : 'mr-auto'}`}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-bold uppercase tracking-wider ${
                                  message.speaker === 'agent' 
                                    ? 'text-primary' 
                                    : 'text-cyan-400'
                                }`}>
                                  {message.speaker === 'agent' ? '🤖 AI Agent' : '👤 Customer'}
                                </span>
                              </div>
                              <div className={`rounded-2xl px-4 py-3 ${
                                message.speaker === 'agent'
                                  ? 'bg-primary/20 text-gray-100'
                                  : 'bg-cyan-500/20 text-gray-100'
                              }`}>
                                <p className="text-sm leading-relaxed">
                                  {message.text}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-900/30 rounded-lg p-12 text-center">
                      <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">No transcript available</p>
                    </div>
                  )}
                </TabsContent>

                {/* SMS Tab */}
                <TabsContent value="sms" className="mt-4">
                  {smsCount > 0 ? (
                    <div className="bg-gray-900/30 rounded-lg p-4 max-h-[500px] overflow-y-auto custom-scrollbar space-y-3" data-testid="list-sms-messages">
                      {sentMessages.map((msg, index) => {
                        const messageText = msg.text || msg.content || '';
                        const timestamp = msg.timestamp || msg.dateSent || msg.date_sent;
                        
                        return (
                          <div 
                            key={index} 
                            className="bg-black/40 rounded-lg p-4"
                            data-testid={`sms-message-${index}`}
                          >
                            <div className="flex items-start justify-between mb-3 gap-2">
                              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                                💬 Message #{index + 1}
                              </span>
                              {timestamp && (
                                <div className="text-right">
                                  <div className="text-xs text-blue-300 font-semibold">
                                    {new Date(timestamp).toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric', 
                                      year: 'numeric' 
                                    })}
                                  </div>
                                  <div className="text-xs text-blue-200 mt-0.5">
                                    {new Date(timestamp).toLocaleTimeString('en-US', { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                            {msg.template && (
                              <div className="mb-3 pb-2 border-b border-gray-800">
                                <span className="text-xs text-gray-500">Template: </span>
                                <span className="text-xs text-primary font-medium">{msg.template}</span>
                              </div>
                            )}
                            <div className="bg-purple-500/10 rounded-lg p-3">
                              <p className="text-gray-100 text-sm leading-relaxed whitespace-pre-wrap">
                                {messageText || 'No message content available'}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-gray-900/30 rounded-lg p-12 text-center">
                      <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">No SMS messages sent</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
