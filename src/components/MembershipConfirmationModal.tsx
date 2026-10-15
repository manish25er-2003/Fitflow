import React, { useState } from "react";
import { CheckCircle2, Copy, ExternalLink, Mail, MessageSquare, Printer, ShieldCheck, X } from "lucide-react";
import type { NotificationDeliveryResult } from "../lib/notificationService";

interface MembershipConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: NotificationDeliveryResult | null;
}

export function MembershipConfirmationModal({
  isOpen,
  onClose,
  result,
}: MembershipConfirmationModalProps) {
  const [activeTab, setActiveTab] = useState<"email" | "sms" | "providers">("email");
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedSms, setCopiedSms] = useState(false);

  if (!isOpen || !result) return null;

  const handleCopyRef = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(result.referenceId);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  const handleCopySms = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(result.sms.text);
      setCopiedSms(true);
      setTimeout(() => setCopiedSms(false), 2000);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(result.email.html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 350);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl border border-violet-500/30 bg-[#0c0d16] p-4 sm:p-6 shadow-[0_24px_70px_rgba(139,92,246,0.35)] text-gym-text max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-gym-border/80">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Membership Confirmation Sent
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-400/40 text-emerald-300">
                  Verified & Active
                </span>
              </div>
              <p className="text-xs text-gym-muted mt-0.5 flex items-center gap-2">
                Ref: <span className="font-mono text-gym-text font-semibold">{result.referenceId}</span>
                <button
                  type="button"
                  onClick={handleCopyRef}
                  className="hover:text-violet-300 transition"
                  title="Copy reference ID"
                >
                  <Copy className="h-3 w-3 inline" />
                  {copiedRef && <span className="text-[10px] text-emerald-300 ml-1">Copied!</span>}
                </button>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full border border-white/10 bg-white/5 text-gym-muted hover:text-white hover:border-violet-400/40 transition"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 mt-4 pb-2 border-b border-gym-border/60">
          <button
            type="button"
            onClick={() => setActiveTab("email")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === "email"
                ? "bg-violet-500/20 text-violet-300 border border-violet-400/40"
                : "text-gym-muted hover:text-gym-text"
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            <span>Email Confirmation</span>
            {result.email.delivered ? (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            ) : (
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">Preview</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("sms")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === "sms"
                ? "bg-violet-500/20 text-violet-300 border border-violet-400/40"
                : "text-gym-muted hover:text-gym-text"
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>SMS Notification</span>
            {result.sms.delivered ? (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            ) : (
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">Preview</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("providers")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === "providers"
                ? "bg-violet-500/20 text-violet-300 border border-violet-400/40"
                : "text-gym-muted hover:text-gym-text"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Carrier Setup</span>
          </button>
        </div>

        {/* Tab contents */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3">
          {activeTab === "email" && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-xs">
                <div>
                  <span className="text-gym-muted">To: </span>
                  <span className="font-semibold text-gym-text">{result.email.recipient}</span>
                  <p className="text-[11px] text-violet-300/80 mt-0.5">{result.email.message}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print Receipt
                  </button>
                </div>
              </div>

              {/* Rendered HTML email preview iframe */}
              <div className="rounded-2xl border border-gym-border/80 overflow-hidden bg-[#08090e]">
                <iframe
                  title="Official Membership Confirmation Email"
                  srcDoc={result.email.html}
                  className="w-full h-[360px] border-none"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          )}

          {activeTab === "sms" && (
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-xs">
                <span className="text-gym-muted">Mobile Number: </span>
                <span className="font-semibold text-gym-text">{result.sms.recipient}</span>
                <p className="text-[11px] text-violet-300/80 mt-0.5">{result.sms.message}</p>
              </div>

              {/* Realistic SMS Bubble */}
              <div className="p-4 rounded-3xl border border-gym-border/80 bg-slate-950/80 max-w-md mx-auto">
                <div className="flex items-center justify-between text-[11px] text-gym-muted mb-2">
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    SMS Carrier Dispatch
                  </span>
                  <span>Fitflow Gym Desk</span>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-900/40 via-purple-900/20 to-slate-900 border border-violet-500/30 text-white text-xs sm:text-sm leading-relaxed shadow-lg">
                  {result.sms.text}
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={handleCopySms}
                    className="btn-secondary px-3 py-1 text-xs flex items-center gap-1"
                  >
                    <Copy className="h-3 w-3" />
                    {copiedSms ? "Copied SMS Text!" : "Copy SMS Text"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "providers" && (
            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl border border-gym-border bg-gym-panel space-y-2">
                <h4 className="font-bold text-sm text-gym-text">Live Carrier Integration Status</h4>
                <p className="text-gym-muted">
                  Fitflow includes full production integrations for live SMS and Email. Configure your API keys in <code className="text-violet-300">.env</code>:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl border border-gym-border bg-black/40">
                    <p className="font-semibold text-gym-text">Email Provider</p>
                    <p className="text-[11px] text-violet-300 mt-1">{result.email.provider}</p>
                    <p className="text-[10px] text-gym-muted mt-1">Set <code className="text-gym-text">VITE_RESEND_API_KEY</code> or <code className="text-gym-text">VITE_EMAIL_SERVICE_URL</code></p>
                  </div>
                  <div className="p-3 rounded-xl border border-gym-border bg-black/40">
                    <p className="font-semibold text-gym-text">SMS Provider</p>
                    <p className="text-[11px] text-violet-300 mt-1">{result.sms.provider}</p>
                    <p className="text-[10px] text-gym-muted mt-1">Set <code className="text-gym-text">VITE_SMS_SERVICE_URL</code> or Twilio credentials</p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 text-emerald-200">
                <p className="font-bold">✓ Truthful Delivery Guarantee</p>
                <p className="text-[11px] mt-0.5 text-emerald-300/80">
                  Fitflow does not fake external carrier delivery. In development or without API keys, notifications are safely delivered to the member inbox, logged to local audit history, and viewable in this confirmation receipt.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-gym-border/80 flex items-center justify-between">
          <span className="text-[11px] text-gym-muted">
            All plans include automated receipts and digital check-in.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="btn-primary px-5 py-2 text-xs font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

