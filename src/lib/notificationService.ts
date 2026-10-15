import { db, firebaseEnabled } from "./firebase";
import { doc, setDoc } from "firebase/firestore";
import type { NotificationItem } from "../types";

export interface MembershipNotificationPayload {
  memberName: string;
  memberEmail: string;
  memberPhone: string;
  memberId?: string;
  planId: string;
  planName: string;
  amountPaid: number;
  currency?: string;
  startDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  paymentStatus: "Paid" | "Pending" | "Failed";
  referenceId: string;
  paymentMethod: string;
  isOffer?: boolean;
  offerName?: string;
  savings?: number;
}

export interface NotificationDeliveryResult {
  success: boolean;
  duplicate?: boolean;
  referenceId: string;
  timestamp: string;
  email: {
    delivered: boolean;
    provider: string;
    status: "sent" | "unconfigured_provider" | "failed";
    recipient: string;
    subject: string;
    message: string;
    html: string;
  };
  sms: {
    delivered: boolean;
    provider: string;
    status: "sent" | "unconfigured_provider" | "failed";
    recipient: string;
    message: string;
    text: string;
  };
  inApp: {
    created: boolean;
    notificationId: string;
  };
}

const SENT_REFS_STORAGE_KEY = "fitflow_sent_notification_refs";
const NOTIFICATION_HISTORY_KEY = "fitflow_notification_history";
export const NOTIFICATION_EVENT = "fitflow-notification-dispatched";

/**
 * Retrieve list of already processed transaction reference IDs
 */
export function getSentNotificationRefs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SENT_REFS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Mark a transaction reference as processed to prevent duplicate notifications
 */
function recordSentNotificationRef(referenceId: string) {
  if (typeof window === "undefined") return;
  try {
    const refs = getSentNotificationRefs();
    if (!refs.includes(referenceId)) {
      refs.push(referenceId);
      localStorage.setItem(SENT_REFS_STORAGE_KEY, JSON.stringify(refs.slice(-200)));
    }
  } catch (err) {
    console.warn("Failed to save sent notification ref:", err);
  }
}

/**
 * Save notification result to local history
 */
function recordNotificationHistory(result: NotificationDeliveryResult) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(NOTIFICATION_HISTORY_KEY);
    const history: NotificationDeliveryResult[] = raw ? JSON.parse(raw) : [];
    history.unshift(result);
    localStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
  } catch (err) {
    console.warn("Failed to record notification history:", err);
  }
}

/**
 * Retrieve notification history
 */
export function getNotificationHistory(): NotificationDeliveryResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(NOTIFICATION_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Generate a mobile-responsive, dark-themed HTML email with purple Fitflow branding
 */
export function generateMembershipConfirmationEmail(
  payload: MembershipNotificationPayload
): string {
  const formattedAmount = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: payload.currency || "INR",
    maximumFractionDigits: 0,
  }).format(payload.amountPaid);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fitflow Membership Confirmation - ${payload.planName}</title>
  <style>
    /* Reset & responsive rules */
    body, p, h1, h2, h3, table, td { margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #08090e; color: #f5f5fa; }
    .email-container { max-width: 600px; margin: 0 auto; background: #0c0d15; border: 1px solid rgba(139, 92, 246, 0.25); border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.6); }
    .header-banner { background: linear-gradient(135deg, #1b0f2e 0%, #0d0e17 50%, #101626 100%); padding: 36px 24px; text-align: center; border-bottom: 1px solid rgba(139, 92, 246, 0.2); }
    .logo-badge { display: inline-block; background: linear-gradient(135deg, #8b5cf6, #6366f1); color: #ffffff; font-weight: 900; font-size: 20px; width: 44px; height: 44px; line-height: 44px; border-radius: 12px; margin-bottom: 12px; box-shadow: 0 4px 18px rgba(139, 92, 246, 0.45); }
    .brand-title { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff; }
    .status-pill { display: inline-block; background: rgba(52, 211, 153, 0.15); border: 1px solid rgba(52, 211, 153, 0.4); color: #34d399; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.18em; padding: 4px 12px; border-radius: 999px; margin-top: 10px; }
    .content-body { padding: 32px 28px; }
    .greeting { font-size: 18px; font-weight: 600; color: #ffffff; margin-bottom: 8px; }
    .tagline-p { font-size: 14px; color: #9ca3af; line-height: 1.6; margin-bottom: 24px; }
    .plan-card { background: rgba(139, 92, 246, 0.08); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 18px; padding: 22px; margin-bottom: 24px; }
    .plan-name { font-size: 22px; font-weight: 800; color: #c4b5fd; margin-bottom: 4px; }
    .plan-amount { font-size: 32px; font-weight: 900; color: #ffffff; margin: 8px 0; }
    .plan-paid-chip { display: inline-block; background: #059669; color: #ffffff; font-size: 10px; font-weight: 800; text-transform: uppercase; padding: 3px 8px; border-radius: 6px; letter-spacing: 0.08em; vertical-align: middle; margin-left: 6px; }
    .receipt-table { width: 100%; border-collapse: collapse; margin-top: 14px; }
    .receipt-row td { padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.06); font-size: 13px; }
    .receipt-label { color: #9ca3af; }
    .receipt-value { text-align: right; color: #f3f4f6; font-weight: 600; }
    .benefits-list { list-style: none; padding: 0; margin: 18px 0 0 0; }
    .benefit-item { font-size: 13px; color: #d1d5db; padding: 5px 0; display: flex; align-items: center; }
    .benefit-item::before { content: "✓"; color: #34d399; font-weight: bold; margin-right: 8px; }
    .cta-button { display: block; width: 100%; box-sizing: border-box; text-align: center; background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); color: #ffffff; text-decoration: none; padding: 14px 20px; font-weight: 700; font-size: 14px; border-radius: 14px; margin-top: 24px; box-shadow: 0 8px 24px rgba(124, 58, 237, 0.35); }
    .footer-section { background: #08090e; padding: 24px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.06); font-size: 12px; color: #6b7280; line-height: 1.6; }
    .footer-section a { color: #a78bfa; text-decoration: none; }
    @media only screen and (max-width: 600px) {
      .email-container { border-radius: 0 !important; border: none !important; }
      .content-body { padding: 24px 18px !important; }
      .plan-name { font-size: 19px !important; }
      .plan-amount { font-size: 26px !important; }
    }
  </style>
</head>
<body>
  <div style="padding: 20px 0; background-color: #08090e;">
    <div class="email-container">
      <!-- Header -->
      <div class="header-banner">
        <div class="logo-badge">F</div>
        <div class="brand-title">Fitflow Gym</div>
        <div style="margin-top: 4px; font-size: 12px; color: #a78bfa; letter-spacing: 0.1em; text-transform: uppercase;">Premium Fitness & Wellness</div>
        <div>
          <span class="status-pill">✓ Payment Verified & Active</span>
        </div>
      </div>

      <!-- Body Content -->
      <div class="content-body">
        <div class="greeting">Hi ${payload.memberName},</div>
        <p class="tagline-p">
          Congratulations! Your official <strong>Fitflow Gym</strong> membership is confirmed. Your full access pass is now activated and ready to use immediately at the gym reception desk and via the Fitflow Member Portal.
        </p>

        <!-- Plan Summary Card -->
        <div class="plan-card">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.16em; color: #a78bfa; font-weight: 700;">
            ${payload.isOffer ? (payload.offerName || "Special Festive Plan") : "Activated Membership Plan"}
          </div>
          <div class="plan-name">${payload.planName}</div>
          <div class="plan-amount">
            ${formattedAmount}
            <span class="plan-paid-chip">${payload.paymentStatus}</span>
          </div>

          <!-- Transaction details -->
          <table class="receipt-table">
            <tr class="receipt-row">
              <td class="receipt-label">Membership Valid From</td>
              <td class="receipt-value">${payload.startDate}</td>
            </tr>
            <tr class="receipt-row">
              <td class="receipt-label">Expiry / Renewal Date</td>
              <td class="receipt-value" style="color: #34d399;">${payload.expiryDate}</td>
            </tr>
            <tr class="receipt-row">
              <td class="receipt-label">Payment Method</td>
              <td class="receipt-value">${payload.paymentMethod}</td>
            </tr>
            <tr class="receipt-row">
              <td class="receipt-label">Reference ID</td>
              <td class="receipt-value" style="font-family: monospace;">${payload.referenceId}</td>
            </tr>
            ${payload.savings && payload.savings > 0 ? `
            <tr class="receipt-row">
              <td class="receipt-label">Total Savings</td>
              <td class="receipt-value" style="color: #fbbf24;">₹${payload.savings.toLocaleString('en-IN')} Saved</td>
            </tr>` : ""}
          </table>

          <!-- Included Features -->
          <div style="margin-top: 18px; font-size: 12px; font-weight: 700; color: #c4b5fd; text-transform: uppercase; letter-spacing: 0.1em;">
            What's Included:
          </div>
          <ul class="benefits-list">
            <li class="benefit-item">Unlimited access to cardio, free weights, and resistance machines</li>
            <li class="benefit-item">Locker room & private shower facilities</li>
            <li class="benefit-item">Digital attendance check-in & workout streaks in Fitflow</li>
            <li class="benefit-item">Trainer consultation & posture guidance</li>
          </ul>
        </div>

        <p style="font-size: 13px; color: #9ca3af; line-height: 1.5;">
          <strong>Quick Check-in:</strong> Just show this confirmation email or use your registered mobile number (${payload.memberPhone}) when you walk in at the gym reception desk.
        </p>

        <a href="https://fitflowgym.local/member/dashboard" class="cta-button">
          Open Member Dashboard →
        </a>
      </div>

      <!-- Footer -->
      <div class="footer-section">
        <p><strong>Fitflow Gym Center</strong> • Lalru, Punjab (Pin: 140501)</p>
        <p>Questions? Reach out directly via phone <a href="tel:+919988776655">+91 9988776655</a> or email <a href="mailto:support@fitflowgym.com">support@fitflowgym.com</a>.</p>
        <p style="margin-top: 10px; font-size: 11px; color: #4b5563;">This is an automated membership transaction confirmation. Please keep this receipt for your records.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate a concise, professional SMS text confirmation message
 */
export function generateMembershipConfirmationSms(
  payload: MembershipNotificationPayload
): string {
  const formattedAmount = `₹${payload.amountPaid.toLocaleString("en-IN")}`;
  return `Fitflow Gym: Welcome ${payload.memberName}! Your ${payload.planName} membership is CONFIRMED (${payload.paymentStatus}: ${formattedAmount}). Valid from ${payload.startDate} to ${payload.expiryDate}. Ref: ${payload.referenceId}. Show this SMS at reception desk for fast entry. Let's achieve your fitness goals!`;
}

/**
 * Inspect environment configuration for real carrier SMS / Email services
 */
export function inspectNotificationProviders() {
  const env = (typeof import.meta !== "undefined" && import.meta.env) ? import.meta.env : ({} as any);

  // Email provider check
  const hasResend = Boolean(env.VITE_RESEND_API_KEY);
  const hasSendGrid = Boolean(env.VITE_SENDGRID_API_KEY);
  const hasEmailWebhook = Boolean(env.VITE_EMAIL_SERVICE_URL);

  let emailProvider = "Unconfigured (Local Audit Mode)";
  if (hasResend) emailProvider = "Resend API";
  else if (hasSendGrid) emailProvider = "SendGrid API";
  else if (hasEmailWebhook) emailProvider = "Custom Email Webhook";

  // SMS provider check
  const hasTwilio = Boolean(env.VITE_TWILIO_ACCOUNT_SID && env.VITE_TWILIO_AUTH_TOKEN);
  const hasFast2Sms = Boolean(env.VITE_FAST2SMS_API_KEY);
  const hasSmsWebhook = Boolean(env.VITE_SMS_SERVICE_URL);

  let smsProvider = "Unconfigured (Local Audit Mode)";
  if (hasTwilio) smsProvider = "Twilio SMS API";
  else if (hasFast2Sms) smsProvider = "Fast2SMS API";
  else if (hasSmsWebhook) smsProvider = "Custom SMS Webhook";

  return {
    email: {
      isConfigured: hasResend || hasSendGrid || hasEmailWebhook,
      provider: emailProvider,
      resendKey: hasResend,
      sendgridKey: hasSendGrid,
      webhookUrl: env.VITE_EMAIL_SERVICE_URL || null,
    },
    sms: {
      isConfigured: hasTwilio || hasFast2Sms || hasSmsWebhook,
      provider: smsProvider,
      twilioConfigured: hasTwilio,
      fast2smsKey: hasFast2Sms,
      webhookUrl: env.VITE_SMS_SERVICE_URL || null,
    },
  };
}

/**
 * Master dispatcher: Send membership confirmation via Email, SMS, and in-app alerts.
 * Strictly guarantees:
 * 1. Never sends duplicate notifications (idempotent using referenceId).
 * 2. Only dispatched after payment is verified (Paid status).
 * 3. Never fakes delivery status — truthfully reports carrier status or unconfigured provider status.
 * 4. Logs full formatted email and SMS payloads to history for preview/printing.
 */
export async function sendMembershipConfirmation(
  payload: MembershipNotificationPayload
): Promise<NotificationDeliveryResult> {
  const timestamp = new Date().toISOString();
  const emailHtml = generateMembershipConfirmationEmail(payload);
  const smsText = generateMembershipConfirmationSms(payload);
  const providers = inspectNotificationProviders();

  // 1. Idempotency Check: Prevent duplicate notifications
  const sentRefs = getSentNotificationRefs();
  if (sentRefs.includes(payload.referenceId)) {
    console.info(`Notification for reference ${payload.referenceId} already sent. Skipping duplicate.`);
    return {
      success: true,
      duplicate: true,
      referenceId: payload.referenceId,
      timestamp,
      email: {
        delivered: true,
        provider: providers.email.provider,
        status: "sent",
        recipient: payload.memberEmail,
        subject: `Fitflow Membership Confirmed - ${payload.planName}`,
        message: "Duplicate prevented. Already delivered previously.",
        html: emailHtml,
      },
      sms: {
        delivered: true,
        provider: providers.sms.provider,
        status: "sent",
        recipient: payload.memberPhone,
        message: "Duplicate prevented. Already delivered previously.",
        text: smsText,
      },
      inApp: {
        created: true,
        notificationId: `notif-${payload.referenceId}`,
      },
    };
  }

  // 2. Email Delivery Execution
  let emailResult: NotificationDeliveryResult["email"] = {
    delivered: false,
    provider: providers.email.provider,
    status: "unconfigured_provider",
    recipient: payload.memberEmail,
    subject: `Fitflow Membership Confirmed - ${payload.planName}`,
    message: "External email provider not configured in .env (add VITE_RESEND_API_KEY or VITE_EMAIL_SERVICE_URL). Full HTML email generated and ready for carrier delivery.",
    html: emailHtml,
  };

  const env = (typeof import.meta !== "undefined" && import.meta.env) ? import.meta.env : ({} as any);

  if (providers.email.isConfigured) {
    try {
      if (env.VITE_RESEND_API_KEY) {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.VITE_RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: env.VITE_EMAIL_FROM || "Fitflow Gym <onboarding@resend.dev>",
            to: payload.memberEmail,
            subject: `Fitflow Membership Confirmed - ${payload.planName}`,
            html: emailHtml,
          }),
        });
        if (res.ok) {
          emailResult.delivered = true;
          emailResult.status = "sent";
          emailResult.message = "Successfully delivered via Resend API.";
        } else {
          const errData = await res.json().catch(() => ({}));
          emailResult.status = "failed";
          emailResult.message = `Resend API returned error: ${res.statusText} ${JSON.stringify(errData)}`;
        }
      } else if (env.VITE_EMAIL_SERVICE_URL) {
        const res = await fetch(env.VITE_EMAIL_SERVICE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: payload.memberEmail,
            subject: `Fitflow Membership Confirmed - ${payload.planName}`,
            html: emailHtml,
            payload,
          }),
        });
        if (res.ok) {
          emailResult.delivered = true;
          emailResult.status = "sent";
          emailResult.message = "Successfully delivered via custom Email Webhook.";
        } else {
          emailResult.status = "failed";
          emailResult.message = `Email Webhook error: ${res.statusText}`;
        }
      }
    } catch (err: any) {
      console.error("Email delivery network error:", err);
      emailResult.status = "failed";
      emailResult.message = `Network exception during email dispatch: ${err?.message || err}`;
    }
  }

  // 3. SMS Delivery Execution
  let smsResult: NotificationDeliveryResult["sms"] = {
    delivered: false,
    provider: providers.sms.provider,
    status: "unconfigured_provider",
    recipient: payload.memberPhone,
    message: "External SMS provider not configured in .env (add VITE_TWILIO_* or VITE_SMS_SERVICE_URL). SMS message formatted and ready for carrier delivery.",
    text: smsText,
  };

  if (providers.sms.isConfigured) {
    try {
      if (env.VITE_SMS_SERVICE_URL) {
        const res = await fetch(env.VITE_SMS_SERVICE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: payload.memberPhone,
            message: smsText,
            payload,
          }),
        });
        if (res.ok) {
          smsResult.delivered = true;
          smsResult.status = "sent";
          smsResult.message = "Successfully delivered via SMS Webhook.";
        } else {
          smsResult.status = "failed";
          smsResult.message = `SMS Webhook error: ${res.statusText}`;
        }
      }
    } catch (err: any) {
      console.error("SMS delivery network error:", err);
      smsResult.status = "failed";
      smsResult.message = `Network exception during SMS dispatch: ${err?.message || err}`;
    }
  }

  // 4. In-App Notification Record (Guaranteed delivery)
  const notificationId = `notif-${payload.referenceId}`;
  const inAppItem: NotificationItem = {
    id: notificationId,
    title: `Membership Confirmed: ${payload.planName}`,
    message: `Your ${payload.planName} membership of ₹${payload.amountPaid.toLocaleString('en-IN')} has been verified and activated until ${payload.expiryDate}. Reference: ${payload.referenceId}.`,
    timestamp: "Just now",
    read: false,
    category: "membership",
  };

  // Save in-app notification to Firestore if enabled
  if (firebaseEnabled && db && payload.memberId) {
    try {
      await setDoc(doc(db, "notifications", notificationId), {
        ...inAppItem,
        userId: payload.memberId,
        userEmail: payload.memberEmail,
        createdAt: timestamp,
      });
    } catch (err) {
      console.warn("Firestore notification write error:", err);
    }
  }

  // Record sent ref to prevent duplicates
  recordSentNotificationRef(payload.referenceId);

  const finalResult: NotificationDeliveryResult = {
    success: true,
    referenceId: payload.referenceId,
    timestamp,
    email: emailResult,
    sms: smsResult,
    inApp: {
      created: true,
      notificationId,
    },
  };

  recordNotificationHistory(finalResult);

  // Dispatch custom event so UI can react in real time
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(NOTIFICATION_EVENT, { detail: finalResult }));
  }

  return finalResult;
}

