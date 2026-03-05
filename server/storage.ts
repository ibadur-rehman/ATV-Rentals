import { 
  type User,
  type InsertUser,
  type CallHistory,
  type InsertCallHistory,
  type Notification,
  type InsertNotification,
  users,
  callHistory,
  notifications
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, desc, or, like, and, gte, lte, sql } from "drizzle-orm";

export interface CallHistoryFilters {
  search?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  tenantId?: number;
}

export interface PaginatedCallHistory {
  calls: CallHistory[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IStorage {
  // User operations
  createUser(user: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | null>;
  getUserById(id: string): Promise<User | null>;
  getAllUsers(): Promise<User[]>;
  
  // Call history operations
  createCallHistory(call: InsertCallHistory): Promise<CallHistory>;
  getCallHistoryById(id: string): Promise<CallHistory | null>;
  getCallHistoryByCallSid(callSid: string): Promise<CallHistory | null>;
  getAllCallHistory(limit?: number, tenantId?: number): Promise<CallHistory[]>;
  getCallHistoryPaginated(filters: CallHistoryFilters): Promise<PaginatedCallHistory>;
  updateCallHistory(id: string, updates: Partial<InsertCallHistory>): Promise<CallHistory | null>;
  deleteCallHistory(id: string): Promise<boolean>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification | null>;
  getNotifications(userId: string, limit?: number, tenantId?: number): Promise<Notification[]>;
  getNotificationById(userId: string, id: string): Promise<Notification | null>;
  getUnreadCount(userId: string, tenantId?: number): Promise<number>;
  markAsRead(userId: string, id: string): Promise<Notification | null>;
  markAllAsRead(userId: string, tenantId?: number): Promise<number>;
}

// Database storage implementation using PostgreSQL
export class DBStorage implements IStorage {
  // User operations
  async createUser(userData: InsertUser): Promise<User> {
    if (!db) {
      throw new Error("Database connection not available");
    }
    const [user] = await db.insert(users).values({
      name: userData.name,
      email: userData.email,
      passwordHash: userData.passwordHash,
    }).returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    if (!db) {
      throw new Error("Database connection not available");
    }
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || null;
  }

  async getUserById(id: string): Promise<User | null> {
    if (!db) {
      throw new Error("Database connection not available");
    }
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  }

  async getAllUsers(): Promise<User[]> {
    if (!db) {
      throw new Error("Database connection not available");
    }
    return await db.select().from(users);
  }

  // Call history operations
  async createCallHistory(callData: InsertCallHistory): Promise<CallHistory> {
    if (!db) {
      throw new Error("Database connection not available");
    }
    try {
      const result = await db.insert(callHistory).values(callData).returning();
      if (result && result[0]) {
        return result[0];
      }
    } catch (err: any) {
      if (!err.message?.includes('unique constraint') && !err.message?.includes('duplicate key')) {
        throw err;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 200));
    const fallback = await db.select().from(callHistory).where(eq(callHistory.callSid, callData.callSid));
    if (fallback && fallback[0]) {
      return fallback[0];
    }
    throw new Error("Failed to create call history record");
  }

  async getCallHistoryById(id: string): Promise<CallHistory | null> {
    if (!db) {
      throw new Error("Database connection not available");
    }
    try {
      const [call] = await db.select().from(callHistory).where(eq(callHistory.id, id));
      return call || null;
    } catch (error: any) {
      if (error?.message?.includes("Cannot read properties of null")) {
        return null;
      }
      throw error;
    }
  }

  async getCallHistoryByCallSid(callSid: string): Promise<CallHistory | null> {
    if (!db) {
      throw new Error("Database connection not available");
    }
    try {
      const [call] = await db.select().from(callHistory).where(eq(callHistory.callSid, callSid));
      return call || null;
    } catch (error: any) {
      if (error?.message?.includes("Cannot read properties of null")) {
        return null;
      }
      throw error;
    }
  }

  async getAllCallHistory(limit?: number, tenantId?: number): Promise<CallHistory[]> {
    if (!db) {
      throw new Error("Database connection not available");
    }
    const whereClause = tenantId ? eq(callHistory.tenantId, tenantId) : undefined;
    try {
      if(limit) {
        return await db.select().from(callHistory).where(whereClause).orderBy(desc(callHistory.startTime)).limit(limit);
      } else {
        return await db.select().from(callHistory).where(whereClause).orderBy(desc(callHistory.startTime));
      }
    } catch (error: any) {
      if (error?.message?.includes("Cannot read properties of null")) {
        return [];
      }
      throw error;
    }
  }

  async updateCallHistory(id: string, updates: Partial<InsertCallHistory>): Promise<CallHistory | null> {
    if (!db) {
      throw new Error("Database connection not available");
    }
    for (let attempt = 0; attempt < 3; attempt++) {
      const result = await db.update(callHistory).set(updates).where(eq(callHistory.id, id)).returning();
      if (result && result[0]) {
        return result[0];
      }
      await new Promise(resolve => setTimeout(resolve, 150 * (attempt + 1)));
    }
    const fallback = await this.getCallHistoryById(id);
    return fallback;
  }

  async deleteCallHistory(id: string): Promise<boolean> {
    if (!db) {
      throw new Error("Database connection not available");
    }
    const result = await db.delete(callHistory).where(eq(callHistory.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getCallHistoryPaginated(filters: CallHistoryFilters): Promise<PaginatedCallHistory> {
    if (!db) {
      throw new Error("Database connection not available");
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (filters.tenantId) {
      conditions.push(eq(callHistory.tenantId, filters.tenantId));
    }

    if (filters.search) {
      conditions.push(
        or(
          like(callHistory.fromNumber, `%${filters.search}%`),
          like(callHistory.toNumber, `%${filters.search}%`),
          like(callHistory.callType, `%${filters.search}%`),
          like(callHistory.outcome, `%${filters.search}%`),
          like(callHistory.callSummary, `%${filters.search}%`)
        )
      );
    }

    if (filters.fromDate) {
      conditions.push(gte(callHistory.startTime, new Date(filters.fromDate)));
    }

    if (filters.toDate) {
      const toDate = new Date(filters.toDate);
      toDate.setHours(23, 59, 59, 999);
      conditions.push(lte(callHistory.startTime, toDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let calls: CallHistory[] = [];
    let total = 0;

    try {
      const [callsResult, totalResult] = await Promise.all([
        db
          .select()
          .from(callHistory)
          .where(whereClause)
          .orderBy(desc(callHistory.startTime))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)` })
          .from(callHistory)
          .where(whereClause)
      ]);
      calls = callsResult;
      total = Number(totalResult[0]?.count || 0);
    } catch (error: any) {
      if (!error?.message?.includes("Cannot read properties of null")) {
        throw error;
      }
    }

    const totalPages = Math.ceil(total / limit);

    return {
      calls,
      total,
      page,
      limit,
      totalPages
    };
  }

  // Notification operations
  async createNotification(notificationData: InsertNotification): Promise<Notification | null> {
    if (!db) {
      throw new Error("Database connection not available");
    }
    for (let attempt = 0; attempt < 3; attempt++) {
      const result = await db
        .insert(notifications)
        .values(notificationData)
        .onConflictDoNothing({ target: [notifications.userId, notifications.callId] })
        .returning();
      if (result && result[0]) {
        return result[0];
      }
      await new Promise(resolve => setTimeout(resolve, 150 * (attempt + 1)));
    }
    return null;
  }

  async getNotifications(userId: string, limit?: number, tenantId?: number): Promise<Notification[]> {
    if (!db) {
      throw new Error("Database connection not available");
    }
    const conditions = [eq(notifications.userId, userId)];
    if (tenantId) {
      conditions.push(eq(notifications.tenantId, tenantId));
    }
    const whereClause = and(...conditions);
    try {
      if (limit) {
        return await db
          .select()
          .from(notifications)
          .where(whereClause)
          .orderBy(desc(notifications.createdAt))
          .limit(limit);
      } else {
        return await db
          .select()
          .from(notifications)
          .where(whereClause)
          .orderBy(desc(notifications.createdAt));
      }
    } catch (error: any) {
      if (error?.message?.includes("Cannot read properties of null")) {
        return [];
      }
      throw error;
    }
  }

  async getNotificationById(userId: string, id: string): Promise<Notification | null> {
    if (!db) {
      throw new Error("Database connection not available");
    }
    try {
      const [notification] = await db
        .select()
        .from(notifications)
        .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
      return notification || null;
    } catch (error: any) {
      if (error?.message?.includes("Cannot read properties of null")) {
        return null;
      }
      throw error;
    }
  }

  async getUnreadCount(userId: string, tenantId?: number): Promise<number> {
    if (!db) {
      throw new Error("Database connection not available");
    }
    const conditions = [eq(notifications.userId, userId), eq(notifications.isRead, 0)];
    if (tenantId) {
      conditions.push(eq(notifications.tenantId, tenantId));
    }
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(...conditions));
    return Number(result[0]?.count || 0);
  }

  async markAsRead(userId: string, id: string): Promise<Notification | null> {
    if (!db) {
      throw new Error("Database connection not available");
    }
    for (let attempt = 0; attempt < 3; attempt++) {
      const result = await db
        .update(notifications)
        .set({ isRead: 1 })
        .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
        .returning();
      if (result && result[0]) {
        return result[0];
      }
      await new Promise(resolve => setTimeout(resolve, 150 * (attempt + 1)));
    }
    return await this.getNotificationById(userId, id);
  }

  async markAllAsRead(userId: string, tenantId?: number): Promise<number> {
    if (!db) {
      throw new Error("Database connection not available");
    }
    const conditions = [eq(notifications.userId, userId), eq(notifications.isRead, 0)];
    if (tenantId) {
      conditions.push(eq(notifications.tenantId, tenantId));
    }
    const result = await db
      .update(notifications)
      .set({ isRead: 1 })
      .where(and(...conditions));
    return result.rowCount || 0;
  }
}
// Use database storage when DATABASE_URL is present, otherwise fall back to memory storage
export const storage = new DBStorage();
