import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users schema
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Create insert schema for users
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Export types for users
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Call History schema
export const callHistory = pgTable("call_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  callSid: text("call_sid").notNull().unique(),
  fromNumber: text("from_number").notNull(),
  toNumber: text("to_number").notNull(),
  status: text("status").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  transcript: text("transcript"),
  callDuration: integer("call_duration"),
  recordingUrl: text("recording_url"),
  callSummary: text("call_summary"),
  callType: text("call_type"),
  outcome: text("outcome"),
  sentSmsMessages: jsonb("sent_sms_messages"),
  endReason: text("end_reason"),
  userSentiment: text("user_sentiment"),
  agentId: text("agent_id"),
  rawPayload: jsonb("raw_payload"),
  tenantId: integer("tenant_id").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Create insert schema for call history
export const insertCallHistorySchema = createInsertSchema(callHistory).omit({
  id: true,
  createdAt: true,
});

// Export types for call history
export type CallHistory = typeof callHistory.$inferSelect;
export type InsertCallHistory = z.infer<typeof insertCallHistorySchema>;

// Type definitions for static dashboard data (not stored in database)
export type DashboardMetrics = {
  id: string;
  totalCalls: number;
  successRatio: number;
  avgDuration: string;
  escalations: number;
  totalCallsChange: number;
  successRatioChange: number;
  avgDurationChange: string;
  escalationsChange: number;
  updatedAt: Date;
};

export type CallType = {
  id: string;
  name: string;
  percentage: number;
  color: string;
};

export type RecentCall = {
  id: string;
  startTime: string;
  createdAt: string;
  callType: string;
  callDuration: string;
  recordingUrl: string;
  callSummary: string;
  outcome: string;
};

export type ResponseTime = {
  id: string;
  average: string;
  fastest: string;
  slowest: string;
};

export type PeakHour = {
  id: string;
  timeRange: string;
  calls: number;
};

// Notifications schema
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  callId: varchar("call_id").references(() => callHistory.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: integer("is_read").notNull().default(0),
  tenantId: integer("tenant_id").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  uniqueUserCall: unique("notifications_user_call_unique").on(table.userId, table.callId),
}));

// Create insert schema for notifications
export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Export types for notifications
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
