import { Router } from "express";
import { storage } from "server/storage";
import { broadcastNotification } from "server/notification-ws";

const router = Router();

const AGENT_TENANT_MAP: Record<string, number> = {
  agent_979a9e280ebe072e0e1974db18: 2,
};

function resolveTenantId(agentId: string | undefined): number {
  if (!agentId) return 1;
  return AGENT_TENANT_MAP[agentId] ?? 1;
}

const log = (message: string, prefix = "post-call") => {
  console.log(`${new Date().toISOString()} [${prefix}] ${message}`);
}

router.post("/", async (req, res) => {
    try {
      log(`Received webhook: ${JSON.stringify(req.body).substring(0, 500)}`, 'webhook');
      const { event, call } = req.body;

      if (!event) {
        log('No event type provided in Retell webhook', 'webhook');
        return res.status(200).json({ error: 'Missing event' });
      }

      switch (event) {
        case 'call_started':
          await handleCallStarted(call, req.body);
          break;
        case 'call_analyzed':
        case 'call_ended':
          await handleCallEnded(call, req.body);
          break;
        default:
          log(`Unknown Retell webhook event: ${event}`, 'webhook');
      }

      return res.status(200).json({ success: true });

    } catch (error: any) {
      log(`Error processing Retell webhook: ${error.message}`, 'webhook');
      return res.status(200).json({
        error: 'Error processing webhook',
        message: error.message
      });
    }
});

async function handleCallStarted(callData: any, rawPayload: any) {
  const { call_id, agent_id, to_number, from_number, start_timestamp } = callData;
  const tenantId = resolveTenantId(agent_id);

  log(`Call started - ID: ${call_id}, Agent: ${agent_id}, Tenant: ${tenantId}, From: ${from_number}, To: ${to_number}`, 'retell');

  try {
    const startTime = start_timestamp ? new Date(start_timestamp) : new Date();
    await storage.createCallHistory({
      callSid: call_id,
      fromNumber: from_number || 'unknown',
      toNumber: to_number || 'unknown',
      status: 'in-progress',
      startTime,
      endTime: startTime,
      agentId: agent_id || null,
      rawPayload,
      tenantId,
    });

    log(`Created call record for Retell call ${call_id} (tenant: ${tenantId})`, 'retell');
  } catch (error) {
    log(`Error creating call record: ${error}`, 'retell');
  }
}

async function handleCallEnded(callData: any, rawPayload: any) {
  const {
    call_id,
    agent_id,
    to_number,
    from_number,
    transcript,
    start_timestamp,
    end_timestamp,
    disconnection_reason,
    recording_url,
    call_analysis,
  } = callData;

  const tenantId = resolveTenantId(agent_id);
  const startTime = start_timestamp ? new Date(start_timestamp) : new Date();
  const endTime = end_timestamp ? new Date(end_timestamp) : new Date();
  const duration = start_timestamp && end_timestamp
    ? Math.round((end_timestamp - start_timestamp) / 1000)
    : 0;

  const call_summary = call_analysis?.call_summary || '';
  const user_sentiment = call_analysis?.user_sentiment || 'Neutral';

  log(`Call ended - ID: ${call_id}, Agent: ${agent_id}, Tenant: ${tenantId}, Duration: ${duration}s, From: ${from_number}`, 'retell');

  let call = await storage.getCallHistoryByCallSid(call_id);
  if (!call) {
    log(`No call record found for ${call_id}, creating new record`, 'retell');
    call = await storage.createCallHistory({
      callSid: call_id,
      fromNumber: from_number || 'unknown',
      toNumber: to_number || 'unknown',
      status: 'in-progress',
      startTime,
      endTime,
      agentId: agent_id || null,
      rawPayload,
      tenantId,
    });
  }

  try {
    await storage.updateCallHistory(call.id, {
      status: 'completed',
      startTime,
      endTime,
      callDuration: duration,
      endReason: disconnection_reason || "",
      userSentiment: user_sentiment,
      callSummary: call_summary,
      transcript: typeof transcript === 'string' ? transcript : JSON.stringify(transcript),
      recordingUrl: recording_url || null,
      agentId: agent_id || call.agentId || null,
      rawPayload,
      tenantId,
    });

    log(`Updated call record for ${call_id} (tenant: ${tenantId})`, 'retell');

    if (call_analysis) {
      await processRetellCallAnalysis(call_analysis, call_id);
    }

    try {
      const users = await storage.getAllUsers();
      if (users.length === 0) {
        log('No users found to assign notification', 'retell');
        return;
      }

      for (const user of users) {
        const notification = await storage.createNotification({
          userId: user.id,
          callId: call.id,
          title: "New Call Completed",
          message: `Call from ${from_number || call.fromNumber} completed. Duration: ${formatDuration(duration)}`,
          isRead: 0,
          tenantId,
        });

        if (notification) {
          log(`Created notification for call ${call_id} for user ${user.email}`, 'retell');
          broadcastNotification(notification, user.id);
        } else {
          log(`Skipped duplicate notification for call ${call_id} for user ${user.email}`, 'retell');
        }
      }
    } catch (notificationError) {
      log(`Error creating/broadcasting notification: ${notificationError}`, 'retell');
    }
  } catch (error) {
    log(`Error updating call record: ${error}`, 'retell');
  }
}

function formatDuration(seconds: number): string {
  if (!seconds) return "0s";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

async function processRetellCallAnalysis(analysis: any, callId: string) {
  try {
    const { custom_analysis_data } = analysis;

    const callRecord = await storage.getCallHistoryByCallSid(callId);
    if (!callRecord) {
      log(`No call record found for analysis update: ${callId}`, 'retell');
      return;
    }

    const updates: any = {};
    if (custom_analysis_data?.call_type) {
      updates.callType = custom_analysis_data.call_type;
    }
    if (custom_analysis_data?.outcome) {
      updates.outcome = custom_analysis_data.outcome;
    }

    if (Object.keys(updates).length > 0) {
      await storage.updateCallHistory(callRecord.id, updates);
      log(`Updated call analysis for ${callId}: ${JSON.stringify(updates)}`, 'retell');
    }
  } catch (error) {
    log(`Error processing Retell call analysis: ${error}`, 'retell');
  }
}

export default router;
