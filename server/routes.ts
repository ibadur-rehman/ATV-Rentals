import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { CheckAvailability } from "./services/wix-service";
import retellWebhookService from "./services/retell-webhook-service";;
import { AuthService } from "./services/auth-service";
import { ensureAuthenticated } from "./middlewares/ensure-authenticated";
import { z } from "zod";
import "./types/session";
import { sendTextMessageEndpoint } from "./services/air-call-service";
import { ServiceType } from "./enums/serviceType";
import { initWebSocketServer } from "./notification-ws";
import { sessionMiddleware } from "./session";

const authService = new AuthService(storage);

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  const registerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  });

  const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const validation = registerSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }

      const { name, email, password } = validation.data;
      const user = await authService.register(name, email, password);
      
      // Set session and save it explicitly
      req.session.userId = user.id;
      
      // Save session before responding to ensure it's persisted
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "Failed to create session" });
        }
        
        res.json({ 
          id: user.id, 
          name: user.name, 
          email: user.email 
        });
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.errors[0].message });
      }

      const { email, password } = validation.data;
      const user = await authService.login(email, password);
      
      // Set session and save it explicitly
      req.session.userId = user.id;
      
      // Save session before responding to ensure it's persisted
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "Failed to create session" });
        }
        
        res.json({ 
          id: user.id, 
          name: user.name, 
          email: user.email 
        });
      });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const user = await authService.getUserById(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      res.json({ 
        id: user.id, 
        name: user.name, 
        email: user.email 
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Dashboard metrics endpoint - returns static data (protected)
  app.get("/api/dashboard/metrics", ensureAuthenticated, async (req, res) => {
    try {
      const tenantId = req.query.tenantId ? parseInt(req.query.tenantId as string) : undefined;
      const calls = await storage.getAllCallHistory(undefined, tenantId);
      const totalCalls = calls.length;

      const callDurations = calls.map(call => call.callDuration || 0).filter(duration => duration > 0);
      const avgDuration = callDurations.length > 0
        ? Math.round(callDurations.reduce((sum, duration) => sum + duration, 0) / callDurations.length)
        : 0;
      const answered = calls.filter(call => call.status === "completed").length;

      // Escalations count - can be enhanced later when call summary contains escalation data
      const escalated = 0;

      const successRate = totalCalls > 0 ? Math.round((answered / totalCalls) * 100) : 0;

      res.json({
        totalCalls,
        successRatio: successRate,
        avgDuration: `${Math.floor(avgDuration / 60)}m ${avgDuration % 60}s`,
        escalations: escalated,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ error: "Failed to fetch dashboard metrics" });
    }
  });

  // Recent calls endpoint - returns static data (protected)
  app.get("/api/dashboard/recent-calls", ensureAuthenticated, async (req, res) => {
    try {
      const tenantId = req.query.tenantId ? parseInt(req.query.tenantId as string) : undefined;
      res.json(await storage.getAllCallHistory(10, tenantId));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent calls" });
    }
  });
  app.get("/api/calls", ensureAuthenticated, async (req, res) => {
    try {
      const tenantId = req.query.tenantId ? parseInt(req.query.tenantId as string) : undefined;
      res.json(await storage.getAllCallHistory(undefined, tenantId));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent calls" });
    }
  });

  // Call history paginated endpoint (protected) - for Call History page
  app.get("/api/call-history", ensureAuthenticated, async (req, res) => {
    try {
      const filters = {
        search: req.query.search as string | undefined,
        fromDate: req.query.fromDate as string | undefined,
        toDate: req.query.toDate as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        tenantId: req.query.tenantId ? parseInt(req.query.tenantId as string) : undefined,
      };

      const result = await storage.getCallHistoryPaginated(filters);
      res.json(result);
    } catch (error) {
      console.error("Call history paginated error:", error);
      res.status(500).json({ error: "Failed to fetch call history" });
    }
  });

  // CSV Export endpoint (protected)
  app.get("/api/export/call-history", ensureAuthenticated, async (req, res) => {
    try {
      const tenantId = req.query.tenantId ? parseInt(req.query.tenantId as string) : undefined;
      const calls = await storage.getAllCallHistory(undefined, tenantId);

      // Helper to escape CSV values
      const escapeCSV = (value: any): string => {
        if (value === null || value === undefined) return "";
        const str = String(value);
        if (str.includes('"') || str.includes(',') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      // Helper to format date
      const formatDate = (date: Date | null | undefined): string => {
        if (!date) return "";
        return new Date(date).toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });
      };

      // Helper to format duration
      const formatDuration = (seconds: number | null): string => {
        if (!seconds) return "0s";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
      };

      // CSV Headers
      const headers = [
        "Call ID",
        "Call SID",
        "From Number",
        "To Number",
        "Status",
        "Call Type",
        "Outcome",
        "Start Time",
        "End Time",
        "Duration",
        "Recording URL",
        "Summary",
        "Transcript",
        "Created At"
      ];

      // Build CSV rows
      const rows = calls.map(call => [
        escapeCSV(call.id),
        escapeCSV(call.callSid),
        escapeCSV(call.fromNumber),
        escapeCSV(call.toNumber),
        escapeCSV(call.status),
        escapeCSV(call.callType),
        escapeCSV(call.outcome),
        escapeCSV(formatDate(call.startTime)),
        escapeCSV(formatDate(call.endTime)),
        escapeCSV(formatDuration(call.callDuration)),
        escapeCSV(call.recordingUrl),
        escapeCSV(call.callSummary),
        escapeCSV(call.transcript),
        escapeCSV(formatDate(call.createdAt))
      ]);

      // Combine headers and rows
      const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

      // Set response headers for file download
      const timestamp = new Date().toISOString().split('T')[0];
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="call-history-${timestamp}.csv"`);
      res.send(csv);
    } catch (error) {
      console.error("CSV export error:", error);
      res.status(500).json({ error: "Failed to export call history" });
    }
  });

  // Notification routes

  // Get all notifications (protected)
  app.get("/api/notifications", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const tenantId = req.query.tenantId ? parseInt(req.query.tenantId as string) : undefined;
      const notifications = await storage.getNotifications(userId, limit, tenantId);
      res.json(notifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Get unread notification count (protected)
  app.get("/api/notifications/unread-count", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const tenantId = req.query.tenantId ? parseInt(req.query.tenantId as string) : undefined;
      const count = await storage.getUnreadCount(userId, tenantId);
      res.json({ count });
    } catch (error) {
      console.error("Get unread count error:", error);
      res.status(500).json({ error: "Failed to fetch unread count" });
    }
  });

  // Mark notification as read (protected)
  app.patch("/api/notifications/:id/read", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { id } = req.params;
      const notification = await storage.markAsRead(userId, id);
      
      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }

      res.json(notification);
    } catch (error) {
      console.error("Mark as read error:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // Mark all notifications as read (protected)
  app.patch("/api/notifications/mark-all-read", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const tenantId = req.query.tenantId ? parseInt(req.query.tenantId as string) : undefined;
      const count = await storage.markAllAsRead(userId, tenantId);
      res.json({ count, message: `Marked ${count} notification(s) as read` });
    } catch (error) {
      console.error("Mark all as read error:", error);
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  // Tools

  app.post('/api/tool/send_sms', async (req, res) => {
    console.log('RECV /send_sms', req.body);   
    const { call } = req.body;
    req.body.args.user_number = req.body.call.from_number //"+14632326939";
    if(!req.body.args) {
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        endpoint: '/api/tool/send_sms',
        errorType: 'validation_error',
        errorMessage: 'Missing args',
        requestBody: req.body
      }));
      return res.status(200).json({ ok: false, error: 'Missing args' });
    }
    if(!req.body.args.user_number) {
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        endpoint: '/api/tool/send_sms',
        errorType: 'validation_error',
        errorMessage: 'Missing user number',
        requestBody: req.body
      }));
      return res.status(200).json({ ok: false, error: 'Missing user number' });
    }
    if(!req.body.args.template) {
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        endpoint: '/api/tool/send_sms',
        errorType: 'validation_error',
        errorMessage: 'Missing template',
        requestBody: req.body
      }));
      return res.status(200).json({ ok: false, error: 'Missing template' });
    }
    if(!req.body.args.language) {
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        endpoint: '/api/tool/send_sms',
        errorType: 'validation_error',
        errorMessage: 'Missing language',
        requestBody: req.body
      }));
      return res.status(200).json({ ok: false, error: 'Missing language' });
    }
    if(!(Object.values(ServiceType).includes(req.body.args.template as ServiceType))) {
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        endpoint: '/api/tool/send_sms',
        errorType: 'validation_error',
        errorMessage: 'Invalid template - only supported templates are allowed',
        providedTemplate: req.body.args.template,
        allowedTemplates: Object.values(ServiceType),
        requestBody: req.body
      }));
      return res.status(200).json({ ok: false, error: 'Only supported templates are allowed. e.g. "pricing", "groupon", "available", "deposit", "transfer","location", "book-online"' });
    }
           
    try {

      const response = await sendTextMessageEndpoint(req.body.args, call);

      if (response.error) {
        console.error(JSON.stringify({
          timestamp: new Date().toISOString(),
          endpoint: '/api/tool/send_sms',
          errorType: 'api_error',
          errorMessage: 'SMS API returned error',
          apiError: response.error,
          requestBody: req.body
        }));
        return res.status(200).json({ ok: false, error: response.error });
      }

      return res.status(200).json({ ok: true, data: "Text sent successfully" });
    } catch (err: any) {
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        endpoint: '/api/tool/send_sms',
        errorType: 'internal_error',
        errorMessage: err?.message || 'Unknown error',
        errorStack: err?.stack || '',
        requestBody: req.body
      }));
      return res.status(200).json({ ok: false, error: 'internal_error' });
    }
  });
  
  app.post('/api/tool/check_availability', async (req, res) => {
    try {

      console.log('RECV /check_availability', req.body)
      const events = await CheckAvailability(req.body);

      return res.status(200).json({ ok: true, events });
    } catch (err) {
      console.error('ERROR /check_availability', err);
      return res.status(500).json({ ok: false, error: 'internal_error' });
    }
  });

  app.post('/api/aircall/webhook', async (req, res) => {
    const evt = req.body;

    console.log('RECV /aircall/webhook', evt);

    // Acknowledge immediately
    return res.sendStatus(200).json();

    // Process asynchronously (example)
    // setImmediate(() => handleEvent(evt));
    // or push to a queue/job worker
  });

  app.use('/api/retell/webhook', retellWebhookService);

  const httpServer = createServer(app);
  
  // Initialize WebSocket server for real-time notifications with session middleware
  initWebSocketServer(httpServer, sessionMiddleware);
  
  return httpServer;
}
