import { useState, useEffect } from "react";
import {
  pauseSubscription,
  cancelSubscription,
  getCurrentUserPlan,
  resumeSubscription,
  fetchInvoices,
} from "../api/subcriptionApi.js";
import { useNavigate } from "react-router-dom";
import {
  formatBillingDate,
  getDaysRemaining,
  formatShortDate,
  getSubscriptionProgress,
} from "@/utils/formatDate.js";
import { useAuth } from "@/context/authContext";
import { formatFileSize } from "@/utils/formatFile.js";
import Toast from "@/components/Toast.jsx";
import useToast from "@/hooks/useToast.js";
import { Eye } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const STATUS_STYLES = {
  active: {
    badge: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  paused: {
    badge: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    dot: "bg-amber-400",
  },
  halt: {
    badge: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    dot: "bg-amber-400",
  },
  cancelled: {
    badge: "bg-red-500/10 text-red-400 border border-red-500/20",
    dot: "bg-red-400",
  },
};

const INV_STATUS = {
  paid: { cls: "bg-emerald-500/10 text-emerald-400", label: "Paid" },
  pending: { cls: "bg-amber-500/10 text-amber-400", label: "Pending" },
  failed: { cls: "bg-red-500/10 text-red-400", label: "Failed" },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.active;
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${s.badge}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full pulse-dot ${s.dot}`} />
      {label}
    </span>
  );
}

function ProgressBar({ pct, gradient = "from-blue-500 to-violet-500" }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 400);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${gradient} bar-transition`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

function Modal({
  open,
  onClose,
  icon,
  iconBg,
  title,
  desc,
  confirmLabel,
  confirmCls,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-enter bg-[#111318] border border-white/[.09] rounded-2xl p-8 w-[420px] max-w-[92vw]">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-5 ${iconBg}`}
        >
          {icon}
        </div>
        <h3 className="font-display text-xl font-bold text-slate-100 mb-2">
          {title}
        </h3>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">{desc}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="btn-hover flex-1 py-3 rounded-xl border border-white/[.08] bg-white/[.04] text-slate-300 text-sm font-medium hover:border-blue-500/40"
          >
            Never mind
          </button>
          <button
            onClick={onConfirm}
            className={`btn-hover flex-1 py-3 rounded-xl text-sm font-semibold ${confirmCls}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ManagePlan() {
  const [modal, setModal] = useState(null); // 'pause' | 'cancel' | 'resume'
  const [filter, setFilter] = useState("all");
  const { toast, showToast, hideToast } = useToast();
  const [invoices, setInvoices] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  //* calculating user storage here
  const usagePercent = Math.min(
    100,
    (currentUser.usedStorage / currentUser.maxStorageInBytes) * 100,
  );
  const unusedSpace = Math.max(
    0,
    currentUser.maxStorageInBytes - currentUser.usedStorage,
  );
  const isSubscriptionHalted = currentPlan?.status === "halt";

  // ── Handle Export Invoices ──
  const handleExportInvoices = () => {
    if (invoices.length === 0) {
      showToast("No invoices to export", {
        type: "error",
        title: "Empty",
      });
      return;
    }

    const formattedData = invoices.map((inv) => ({
      Invoice_ID: inv.razorpayInvoiceId,
      Date: formatBillingDate(inv.invoiceDate),
      Plan: inv.planName,
      Status: inv.status,
      Amount: inv.amount,
      Invoice_URL:inv.invoiceUrl,
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const fileData = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(fileData, "invoice-history.xlsx");
    showToast("Invoices exported successfully", {
      type: "success",
      title: "Export complete",
    });
  };

  // ── Fetch Data on Mount ──
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getCurrentUserPlan();
        setCurrentPlan(data);
        if (data) {
          const { Invoices } = await fetchInvoices();
          setInvoices(Invoices || []);
        }
      } catch (err) {
        console.log("Error fetching plan:", err.message);
        setCurrentPlan(null);
      }
    };
    loadData();
  }, []);

  // ── Handle Subscription Actions ──
  const handleConfirm = async (type) => {
    setModal(null);
    setActionLoading(true);
    try {
      if (type === "pause") {
        await pauseSubscription();
        setCurrentPlan((plan) => (plan ? { ...plan, status: "halt" } : plan));
        showToast("Subscription paused successfully", {
          type: "warning",
          title: "Plan paused",
        });
      }
      if (type === "resume") {
        await resumeSubscription();
        setCurrentPlan((plan) => (plan ? { ...plan, status: "active" } : plan));
        showToast("Subscription resumed successfully", {
          type: "success",
          title: "Plan resumed",
        });
      }
      if (type === "cancel") {
        await cancelSubscription();
        setCurrentPlan((plan) =>
          plan ? { ...plan, status: "cancelled" } : plan,
        );
        showToast("Subscription cancelled. Grace period active.", {
          type: "warning",
          title: "Plan cancelled",
        });
      }
    } catch (err) {
      console.error(`${type} failed:`, err);
      showToast(`Failed to ${type} subscription`, {
        type: "error",
        title: "Action failed",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = filter === "all" ? invoices : invoices.filter((i) => i.status === filter);

const MODALS = {
    pause: {
      icon: "⏸️",
      iconBg: "bg-amber-500/10",
      title: "Pause Subscription?",
      desc: "Your uploads will be blocked while paused, but you can still download and access all existing files. Resume anytime from this page.",
      confirmLabel: "Yes, Pause Plan",
      confirmCls: "bg-amber-500 text-slate-900 hover:bg-amber-400",
    },
    resume: {
      icon: "▶",
      iconBg: "bg-emerald-500/10",
      title: "Resume Subscription?",
      desc: "Recurring billing will resume and uploads will be available again for your current storage plan.",
      confirmLabel: "Resume Plan",
      confirmCls: "bg-emerald-500 text-slate-950 hover:bg-emerald-400",
    },
    cancel: {
      icon: "✕",
      iconBg: "bg-red-500/10",
      title: "Cancel Subscription?",
      desc: "Your plan will be cancelled and a 3-day grace period will begin. After that, all storage access will be removed. This action cannot be undone.",
      confirmLabel: "Cancel Anyway",
      confirmCls: "bg-red-500 text-white hover:bg-red-400",
    },
  };

  if (!currentPlan) {
    return (
      <div className="min-h-screen bg-[#0a0b0f] grid-bg text-slate-200 relative overflow-hidden">
        <div
          className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[420px]
          bg-[radial-gradient(ellipse_at_center,rgba(79,124,255,.07),transparent_70%)]"
        />
        <div className="relative z-10 min-h-screen max-w-4xl mx-auto px-5 py-10 flex flex-col items-center justify-center">
          <div className="w-full max-w-2xl rounded-2xl border border-blue-500/20 bg-gradient-to-br from-[#111522] to-[#0f1320] p-8 md:p-10 relative overflow-hidden">
            <div className="pointer-events-none absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(circle,rgba(79,124,255,.12),transparent_70%)]" />
            <div className="relative">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-semibold uppercase tracking-wide mb-5">
                No active subscription
              </span>
              <h2 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight text-slate-100 mb-3">
                You have no active plan
              </h2>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-7">
                Buy a plan to continue uploading files, increase your storage
                limit, and keep your drive ready for everyday work.
              </p>
              <button
                onClick={() => navigate("/plan")}
                className="btn-hover inline-flex items-center justify-center px-5 py-3 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-400"
              >
                Buy Subscription Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Page shell */}
      <div className="min-h-screen bg-[#0a0b0f] grid-bg text-slate-200 relative overflow-x-hidden">
        {/* Radial glow top */}
        <div
          className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[420px]
          bg-[radial-gradient(ellipse_at_center,rgba(79,124,255,.07),transparent_70%)]"
        />

        <div className="relative z-10 max-w-4xl mx-auto px-5 py-10 pb-24">
          {/* ── Header ── */}
          <div className="anim-fade-up flex items-start justify-between mb-10">
            <div>
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-100">
                Manage Plan
              </h1>
              <p className="text-slate-500 text-sm mt-1 font-light">
                View and control your subscription &amp; billing
              </p>
            </div>
            <button
              className="flex items-center gap-2 text-slate-400 text-sm px-4 py-2 rounded-lg border border-white/[.08]
              bg-white/[.03] hover:border-blue-500/40 hover:text-slate-200 btn-hover"
              onClick={() => navigate("/")}
            >
              &larr; My Drive
            </button>
          </div>

          {/* ── Row 1: Plan + Billing ── */}
          <div className="anim-fade-up anim-delay-1 grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Active Plan */}
            <div className="card-hover relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-[#111522] to-[#0f1320] p-6">
              <div
                className="pointer-events-none absolute top-0 right-0 w-48 h-48
                bg-[radial-gradient(circle,rgba(79,124,255,.1),transparent_70%)]"
              />
              <p className="text-[11px] uppercase tracking-[1.5px] text-slate-600 font-semibold mb-3">
                Active Plan
              </p>
              {currentPlan ? (
                <>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-display text-2xl font-extrabold text-slate-100">
                      {currentPlan.name} Storage
                    </span>
                    <StatusBadge status={currentPlan?.status} />
                  </div>
                  <p className="text-slate-500 text-sm mb-5">
                    Billed monthly at{" "}
                    <span className="text-blue-400 font-semibold font-display text-base">
                      ₹{currentPlan?.subscriptionPrice}
                    </span>{" "}
                    / mo
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {currentPlan.features && currentPlan.features.length > 0 ? (
                      currentPlan.features.map((f) => (
                        <span
                          key={f}
                          className="bg-white/[.04] border border-white/[.07] rounded-md px-2.5 py-1 text-xs text-slate-400"
                        >
                          {f}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 text-xs">
                        No features available
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-slate-500 text-sm py-4">
                  Loading plan details...
                </div>
              )}
            </div>

            {/* Next Billing */}
            <div className="card-hover rounded-2xl border border-white/[.07] bg-[#111318] p-6">
              <p className="text-[11px] uppercase tracking-[1.5px] text-slate-600 font-semibold mb-3">
                Next Billing Date
              </p>
              <p className="font-display text-2xl font-bold text-slate-100 mb-1">
                {formatBillingDate(currentPlan?.nextBillingAt)}
              </p>
              <p className="text-slate-500 text-xs mb-5">
                Auto-renews · ₹{currentPlan?.subscriptionPrice} will be charged
              </p>
              <ProgressBar
                pct={Math.round(
                  getSubscriptionProgress(
                    currentPlan?.currentPeriod,
                    currentPlan?.EndcurrentPeriodStart,
                  ),
                )}
                gradient="from-blue-500 to-violet-500"
              />
              <div className="flex justify-between text-[11px] text-slate-600 mt-1.5 mb-4">
                <span>
                  Cycle started {formatShortDate(currentPlan?.currentPeriod)}
                </span>
                <span>
                  {Math.round(
                    getSubscriptionProgress(
                      currentPlan?.currentPeriod,
                      currentPlan?.EndcurrentPeriodStart,
                    ),
                  )}
                  % elapsed
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-4xl font-extrabold text-amber-400">
                  {getDaysRemaining(currentPlan?.EndcurrentPeriodStart)}
                </span>
                <span className="text-slate-500 text-sm">days remaining</span>
              </div>
            </div>
          </div>

          {/* ── Storage Usage ── */}
          <div className="anim-fade-up anim-delay-2 card-hover rounded-2xl border border-white/[.07] bg-[#111318] p-5 mb-4">
            <div className="flex justify-between items-center mb-3">
              <p className="text-[11px] uppercase tracking-[1.5px] text-slate-600 font-semibold">
                Storage Usage
              </p>
              <span className="text-xs text-slate-500">
                {formatFileSize(currentUser?.usedStorage)} of{" "}
                {formatFileSize(currentUser?.maxStorageInBytes)} used
              </span>
            </div>
            <ProgressBar
              pct={Math.round(usagePercent)}
              gradient="from-emerald-400 to-blue-500"
            />
            <div className="flex justify-between text-[11px] mt-2">
              <span className="text-slate-600">
                {Math.round(usagePercent)}% used
              </span>
              <span className="text-emerald-500">
                {formatFileSize(unusedSpace)} free
              </span>
            </div>
          </div>

          {/* ── Quick Actions ── */}
          <div className="anim-fade-up anim-delay-2 rounded-2xl border border-white/[.07] bg-[#111318] p-6 mb-4">
            <p className="text-[11px] uppercase tracking-[1.5px] text-slate-600 font-semibold mb-4">
              Quick Actions
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() =>
                  setModal(isSubscriptionHalted ? "resume" : "pause")
                }
                disabled={actionLoading}
                className="card-hover btn-hover flex items-center gap-3 p-4 rounded-xl bg-white/[.03] border border-white/[.07]
                  hover:border-amber-500/30 text-left w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0 ${
                    isSubscriptionHalted
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-amber-500/10"
                  }`}
                >
                  {isSubscriptionHalted ? "▶" : "⏸"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-100">
                    {isSubscriptionHalted ? "Resume Plan" : "Pause Plan"}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {isSubscriptionHalted
                      ? "Restore billing and uploads"
                      : "Block uploads, keep downloads"}
                  </p>
                </div>
              </button>

              <button
                onClick={() => setModal("cancel")}
                disabled={actionLoading}
                className="card-hover btn-hover flex items-center gap-3 p-4 rounded-xl bg-white/[.03] border border-white/[.07]
                  hover:border-red-500/30 text-left w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center text-base flex-shrink-0 text-red-400 font-bold">
                  ✕
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-100">
                    Cancel Plan
                  </p>
                  <p className="text-[11px] text-slate-500">
                    3-day grace period applies
                  </p>
                </div>
              </button>

              <button
                onClick={() => navigate("/plan")}
                className="card-hover btn-hover flex items-center gap-3 p-4 rounded-xl bg-white/[.03] border border-white/[.07]
                  hover:border-blue-500/30 text-left w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-base flex-shrink-0 text-blue-400">
                  ⇅
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-100">
                    Change Plan
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Upgrade or downgrade your storage
                  </p>
                </div>
              </button>

              <button
                onClick={handleExportInvoices}
                disabled={actionLoading || invoices.length === 0}
                className="card-hover btn-hover flex items-center gap-3 p-4 rounded-xl bg-white/[.03] border border-white/[.07]
                  hover:border-emerald-500/30 text-left w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-base flex-shrink-0 text-emerald-400">
                  ⬇
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-100">
                    Export Invoices
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Download full billing history
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* ── Invoice History ── */}
          <div className="anim-fade-up anim-delay-3 rounded-2xl border border-white/[.07] bg-[#111318] p-6">
            {/* Header row */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-bold text-slate-100">
                Invoice History
              </h2>
              <div className="flex gap-1 bg-white/[.04] p-1 rounded-lg">
                {["all", "paid", "pending"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize btn-hover
                      ${filter === f ? "bg-[#111318] text-slate-200 shadow" : "text-slate-500 hover:text-slate-300"}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            {
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[.06]">
                      {[
                        "INVOICE_ID",
                        "Period",
                        "Plan",
                        "Status",
                        "Amount",
                        "View",
                      ].map((h, i) => (
                        <th
                          key={i}
                          className={`pb-3 text-[11px] uppercase tracking-widest text-slate-600 font-semibold
                        ${i >= 4 ? "text-right" : "text-left"} ${i === 0 ? "" : "pl-4"}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((inv) => (
                      <tr
                        key={inv.id}
                        className="border-b border-white/[.04] last:border-0 hover:bg-white/[.015] transition-colors"
                      >
                        <td className="py-4 font-mono-dm text-xs text-slate-500">
                          {inv.razorpayInvoiceId}
                        </td>
                        <td className="py-4 pl-4 text-slate-400 text-xs hidden sm:table-cell">
                          {formatBillingDate(inv.invoiceDate * 1000)}
                        </td>
                        <td className="py-4 pl-4 text-slate-400 text-xs">
                          {inv.planName}
                        </td>
                        <td className="py-4 pl-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wide ${INV_STATUS[inv.status]?.cls || INV_STATUS.pending.cls}`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-4 pl-4 font-display font-bold text-right text-slate-200">
                          {inv.amount}
                        </td>
                        <td className="py-4 pl-4 text-right">
                          <a
                            href={inv.invoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 px-2 py-1 rounded-lg border border-white/[.07]
                             bg-white/[.03] text-slate-500 text-xs hover:text-emerald-400 
                             hover:border-emerald-500/30 btn-hover disabled:opacity-50 
                             disabled:cursor-not-allowed"
                          >
                            <Eye size={20} />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filtered.length === 0 && (
                  <p className="text-center text-slate-600 text-sm py-10">
                    No invoices found
                  </p>
                )}
              </div>
            }
          </div>
        </div>

        {/* ── Modals ── */}
        {Object.entries(MODALS).map(([type, cfg]) => (
          <Modal
            key={type}
            open={modal === type}
            onClose={() => setModal(null)}
            {...cfg}
            onConfirm={() => handleConfirm(type)}
          />
        ))}

        {/* ── Toast ── */}
        <Toast toast={toast} onClose={hideToast} />
      </div>
    </>
  );
}
