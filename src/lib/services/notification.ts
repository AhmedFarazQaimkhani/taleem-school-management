/**
 * NotificationService — swappable provider.
 * Phase 1 will call this for absence alerts / fee reminders.
 * Phase 3 can wrap the same interface with an AI-drafted `body` without
 * changing callers.
 */
export type NotificationChannel = "WHATSAPP" | "SMS" | "EMAIL" | "IN_APP";

export type NotificationPayload = {
  schoolId: string;
  to: string;
  body: string;
  channel: NotificationChannel;
  metadata?: Record<string, string>;
};

export type NotificationResult = {
  ok: boolean;
  provider: string;
  providerId?: string;
  error?: string;
};

export interface NotificationService {
  send(payload: NotificationPayload): Promise<NotificationResult>;
}

export class ConsoleNotificationService implements NotificationService {
  async send(payload: NotificationPayload): Promise<NotificationResult> {
    console.info("[notification:console]", payload.channel, payload.to, payload.body.slice(0, 80));
    return { ok: true, provider: "console", providerId: `console-${Date.now()}` };
  }
}

export class WhatsAppCloudNotificationService implements NotificationService {
  constructor(private token: string) {}

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    if (payload.channel !== "WHATSAPP") {
      return { ok: false, provider: "whatsapp-cloud", error: "unsupported channel" };
    }
    if (!this.token) {
      return { ok: false, provider: "whatsapp-cloud", error: "WHATSAPP_TOKEN not configured" };
    }
    // Provider HTTP call is wired in Phase 1. Interface is stable.
    return { ok: false, provider: "whatsapp-cloud", error: "not_implemented" };
  }
}

export class TwilioSmsNotificationService implements NotificationService {
  constructor(
    private accountSid: string,
    private authToken: string,
  ) {}

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    if (payload.channel !== "SMS") {
      return { ok: false, provider: "twilio", error: "unsupported channel" };
    }
    if (!this.accountSid || !this.authToken) {
      return { ok: false, provider: "twilio", error: "Twilio credentials not configured" };
    }
    return { ok: false, provider: "twilio", error: "not_implemented" };
  }
}

export function getNotificationService(): NotificationService {
  return new ConsoleNotificationService();
}
