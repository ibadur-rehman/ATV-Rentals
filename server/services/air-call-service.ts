import axios from "axios";
import { templates } from "./templates";
import { ServiceType } from "server/enums/serviceType";
import { storage } from "server/storage";

const AGENT_TENANT_MAP: Record<string, number> = {
  agent_979a9e280ebe072e0e1974db18: 2,
};

function resolveLocationKey(agentId: string | undefined): "htown" | "dtown" {
  if (!agentId) return "htown";
  const tenantId = AGENT_TENANT_MAP[agentId] ?? 1;
  return tenantId === 2 ? "dtown" : "htown";
}

interface SendTextMessageInput {
  custom_template: string;
  user_number: string;
  language: string;
  template: string;
}
const AIRCALL_API = "https://api.aircall.io/v1";
const AIRCALL_BEARER_TOKEN = process.env.AIRCALL_TOKEN;
const NUMBER_ID = process.env.AIRCALL_NUMBER_ID;

const LOCATION_ADDRESSES: Record<string, string> = {
  htown: "807 Highway 90 Crosby, TX 77532",
  dtown: "5455 Everman Kennedale Rd, Fort Worth, TX 76140",
};

const authHeaders = () => ({
  Authorization: `Basic ${AIRCALL_BEARER_TOKEN}`,
  "Content-Type": "application/json",
});

function generateMessage(
  language: string,
  templateType: string,
  conversation_summary: string,
  locationKey: "htown" | "dtown",
): { ok: boolean; text?: string; error?: string } {
  const lang: string = (language || "en").toLowerCase();
  const locationTemplates = templates[locationKey] as Record<string, Record<string, string>>;
  const templatesByLang = locationTemplates[lang] || locationTemplates["en"];
  const address = LOCATION_ADDRESSES[locationKey];
  const locationName = locationKey === "dtown" ? "D-Town ATV Rentals" : "H-Town ATV Rentals";

  if (templateType === ServiceType.BookOnline && conversation_summary) {
    let text = `Hi! Thanks for contacting ${locationName}.`;
    text += "\n\n";
    text += conversation_summary;
    text += "\n\n";
    text +=
      "Thank you for your interest in booking with us. Please visit our website to book your tour: https://atv-rentals.replit.app";
    text += "\n\n";
    text += address;
    return { ok: true, text };
  } else if (templateType === ServiceType.BookOnline && !conversation_summary) {
    const text: string = templatesByLang[ServiceType.Pricing];
    return { ok: true, text };
  }
  {
    const text: string = templatesByLang[templateType];
    if (!text) {
      return { ok: false, error: "Unknown templateType or language" };
    }
    return { ok: true, text };
  }
}

export async function sendTextMessageEndpoint(
  input: SendTextMessageInput,
  call: any,
) {
  try {
    const { custom_template, user_number, language, template } = input;
    const locationKey = resolveLocationKey(call?.agent_id);

    const { ok, text, error } = generateMessage(
      language,
      template,
      custom_template,
      locationKey,
    );
    if (!ok) {
      return { error };
    }
    // Build payload
    const payload = { to: user_number, body: text };

    // Build URL (include number id if provided)
    const url = `${AIRCALL_API}/numbers/${NUMBER_ID}/messages/native/send`;

    console.log(url);

    // Call Aircall
    const response = await axios.post(url, payload, {
      headers: authHeaders(),
      timeout: 10000,
    });

    // Get the call record
    const callHistory = await storage.getCallHistoryByCallSid(call?.call_id);
    if (!callHistory) {
      console.error(`No call record found for ${call?.call_id}`, "retell");
      return;
    }

    let sentSmsMessages: any = callHistory?.sentSmsMessages || [];
    // ✅ Type check: if it's a string, parse it
    if (typeof sentSmsMessages === "string") {
      sentSmsMessages = JSON.parse(sentSmsMessages);
    }

    sentSmsMessages.push({
      text,
      sentAt: new Date().toISOString(),
    });

    await storage.updateCallHistory(callHistory.id, {
      sentSmsMessages: sentSmsMessages,
    });
    // You should save response.data (message id, status) in your DB here.
    return response.data;
  } catch (err) {
    throw new Error(`Aircall API error: ${err}`); // throw to be caught by caller
  }
}
