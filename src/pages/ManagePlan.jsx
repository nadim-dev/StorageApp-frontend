import { useState, useEffect } from "react";
import {pauseSubscription,cancelSubscription,getCurrentUserPlan,resumeSubscription,fetchInvoices} from "../api/subcriptionApi.js";
import { useNavigate } from "react-router-dom";
import {formatBillingDate,getDaysRemaining,formatShortDate,getSubscriptionProgress} from "@/utils/formatDate.js";
import { useAuth } from "@/context/authContext";
import { formatFileSize } from "@/utils/formatFile.js";
import Toast from "@/components/Toast.jsx";
import useToast from "@/hooks/useToast.js";
import { Loader } from "@/components/common/Loadder.jsx";
import { Eye } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "../ManagePlan.css";

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
      className="manage-plan-page__modal"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="manage-plan-page__modal-content">
        <div className={`manage-plan-page__modal-icon ${iconBg}`}>{icon}</div>
        <h3 className="manage-plan-page__modal-title">{title}</h3>
        <p className="manage-plan-page__modal-desc">{desc}</p>
        <div className="manage-plan-page__modal-actions">
          <button onClick={onClose} className="manage-plan-page__modal-btn">
            Never mind
          </button>
          <button
            onClick={onConfirm}
            className={`manage-plan-page__modal-btn confirm`}
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
  const [isLoading, setIsLoading] = useState(true);
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
      Invoice_URL: inv.invoiceUrl,
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
      setIsLoading(true);
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
      } finally {
        setIsLoading(false);
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

  const filtered =
    filter === "all" ? invoices : invoices.filter((i) => i.status === filter);

  const MODALS = {
    pause: {
      icon: "⏸️",
      iconBg: "bg-amber-100",
      title: "Pause Subscription?",
      desc: "Your uploads will be blocked while paused, but you can still download and access all existing files. Resume anytime from this page.",
      confirmLabel: "Yes, Pause Plan",
      confirmCls: "bg-amber-500 text-slate-900 hover:bg-amber-400",
    },
    resume: {
      icon: "▶",
      iconBg: "bg-emerald-100",
      title: "Resume Subscription?",
      desc: "Recurring billing will resume and uploads will be available again for your current storage plan.",
      confirmLabel: "Resume Plan",
      confirmCls: "bg-emerald-500 text-slate-950 hover:bg-emerald-400",
    },
    cancel: {
      icon: "✕",
      iconBg: "bg-red-100",
      title: "Cancel Subscription?",
      desc: "Your plan will be cancelled and a 3-day grace period will begin. After that, all storage access will be removed. This action cannot be undone.",
      confirmLabel: "Cancel Anyway",
      confirmCls: "bg-red-500 text-white hover:bg-red-400",
    },
  };

  if (isLoading) {
    return (
      <div className="manage-plan-page__loading">
        <Loader label="Loading your subscription details..." />
      </div>
    );
  }

  if (!currentPlan) {
    return (
      <div className="manage-plan-page">
        <div className="manage-plan-page__blob" />
        <div className="manage-plan-page__content">
          <div className="manage-plan-page__card" style={{ marginTop: "4rem" }}>
            <span className="manage-plan-page__card-label manage-plan-page__badge-paused">
              No active subscription
            </span>
            <h2 className="manage-plan-page__card-title">
              You have no active plan
            </h2>
            <p className="manage-plan-page__card-subtitle">
              Buy a plan to continue uploading files, increase your storage
              limit, and keep your drive ready for everyday work.
            </p>
            <button
              onClick={() => navigate("/plan")}
              className="manage-plan-page__back-btn"
              style={{ background: "#0a66c2", color: "white", border: "none" }}
            >
              Buy Subscription Plan
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Page shell */}
      <div className="manage-plan-page">
        <div className="manage-plan-page__blob" />

        <div className="manage-plan-page__content">
          {/* ── Header ── */}
          <div className="manage-plan-page__header">
            <div className="manage-plan-page__title-block">
              <h1>Manage Plan</h1>
              <p>View and control your subscription &amp; billing</p>
            </div>
            <button
              className="manage-plan-page__back-btn"
              onClick={() => navigate("/")}
            >
              ← My Drive
            </button>
          </div>

          {/* ── Row 1: Plan + Billing ── */}
          <div className="manage-plan-page__grid">
            {/* Active Plan */}
            <div className="manage-plan-page__card">
              <p className="manage-plan-page__card-label">Active Plan</p>
              {currentPlan ? (
                <>
                  <h3
                    className="manage-plan-page__card-title"
                    style={{ marginBottom: "0.5rem" }}
                  >
                    {currentPlan.name} Storage
                  </h3>
                  <div style={{ marginBottom: "1rem" }}>
                    <span
                      className={`manage-plan-page__status-badge manage-plan-page__badge-${currentPlan?.status}`}
                    >
                      ●{" "}
                      {currentPlan?.status?.charAt(0).toUpperCase() +
                        currentPlan?.status?.slice(1)}
                    </span>
                  </div>
                  <p className="manage-plan-page__card-subtitle">
                    Billed monthly at{" "}
                    <span
                      style={{
                        color: "#0a66c2",
                        fontWeight: "600",
                        fontSize: "1.1rem",
                      }}
                    >
                      ₹{currentPlan?.subscriptionPrice}
                    </span>{" "}
                    / mo
                  </p>
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}
                  >
                    {currentPlan.features && currentPlan.features.length > 0 ? (
                      currentPlan.features.map((f) => (
                        <span
                          key={f}
                          style={{
                            background: "#f8fbff",
                            border: "1px solid #dbe7f4",
                            borderRadius: "0.4rem",
                            padding: "0.4rem 0.8rem",
                            fontSize: "0.8rem",
                            color: "#57708a",
                          }}
                        >
                          {f}
                        </span>
                      ))
                    ) : (
                      <span className="manage-plan-page__card-subtitle">
                        No features available
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <div className="manage-plan-page__card-subtitle">
                  Loading plan details...
                </div>
              )}
            </div>

            {/* Next Billing */}
            <div className="manage-plan-page__card">
              <p className="manage-plan-page__card-label">Next Billing Date</p>
              <h3 className="manage-plan-page__card-title">
                {formatBillingDate(currentPlan?.nextBillingAt)}
              </h3>
              <p
                className="manage-plan-page__card-subtitle"
                style={{ marginBottom: "1rem" }}
              >
                Auto-renews · ₹{currentPlan?.subscriptionPrice} will be charged
              </p>
              <div className="manage-plan-page__progress-bar">
                <div
                  className="manage-plan-page__progress-fill"
                  style={{
                    width: `${Math.round(
                      getSubscriptionProgress(
                        currentPlan?.currentPeriod,
                        currentPlan?.EndcurrentPeriodStart,
                      ),
                    )}%`,
                  }}
                />
              </div>
              <div className="manage-plan-page__progress-stats">
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
              <div
                style={{
                  marginTop: "1rem",
                  display: "flex",
                  alignItems: "baseline",
                  gap: "0.5rem",
                }}
              >
                <span
                  style={{
                    fontSize: "2.5rem",
                    fontWeight: "800",
                    color: "#f59e0b",
                  }}
                >
                  {getDaysRemaining(currentPlan?.EndcurrentPeriodStart)}
                </span>
                <span className="manage-plan-page__card-subtitle">
                  days remaining
                </span>
              </div>
            </div>
          </div>

          {/* ── Storage Usage ── */}
          <div className="manage-plan-page__storage-section">
            <div className="manage-plan-page__storage-header">
              <p className="manage-plan-page__storage-label">Storage Usage</p>
              <span className="manage-plan-page__storage-info">
                {formatFileSize(currentUser?.usedStorage)} of{" "}
                {formatFileSize(currentUser?.maxStorageInBytes)} used
              </span>
            </div>
            <div className="manage-plan-page__progress-bar">
              <div
                className="manage-plan-page__progress-fill"
                style={{
                  width: `${Math.round(usagePercent)}%`,
                  background:
                    "linear-gradient(90deg, #22c55e 0%, #0a66c2 100%)",
                }}
              />
            </div>
            <div className="manage-plan-page__progress-stats">
              <span>{Math.round(usagePercent)}% used</span>
              <span style={{ color: "#22c55e" }}>
                {formatFileSize(unusedSpace)} free
              </span>
            </div>
          </div>

          {/* ── Quick Actions ── */}
          <div className="manage-plan-page__actions">
            <p className="manage-plan-page__actions-title">Quick Actions</p>
            <div className="manage-plan-page__action-grid">
              <button
                onClick={() =>
                  setModal(isSubscriptionHalted ? "resume" : "pause")
                }
                disabled={actionLoading}
                className="manage-plan-page__action-btn"
              >
                <div
                  className={`manage-plan-page__action-icon ${
                    isSubscriptionHalted
                      ? "manage-plan-page__action-pause-active"
                      : "manage-plan-page__action-pause"
                  }`}
                >
                  {isSubscriptionHalted ? "▶" : "⏸"}
                </div>
                <div className="manage-plan-page__action-content">
                  <h3>{isSubscriptionHalted ? "Resume Plan" : "Pause Plan"}</h3>
                  <p>
                    {isSubscriptionHalted
                      ? "Restore billing and uploads"
                      : "Block uploads, keep downloads"}
                  </p>
                </div>
              </button>

              <button
                onClick={() => setModal("cancel")}
                disabled={actionLoading}
                className="manage-plan-page__action-btn"
              >
                <div className="manage-plan-page__action-icon manage-plan-page__action-cancel">
                  ✕
                </div>
                <div className="manage-plan-page__action-content">
                  <h3>Cancel Plan</h3>
                  <p>3-day grace period applies</p>
                </div>
              </button>

              <button
                onClick={() => navigate("/plan")}
                className="manage-plan-page__action-btn"
              >
                <div className="manage-plan-page__action-icon manage-plan-page__action-upgrade">
                  ⇅
                </div>
                <div className="manage-plan-page__action-content">
                  <h3>Change Plan</h3>
                  <p>Upgrade or downgrade your storage</p>
                </div>
              </button>

              <button
                onClick={handleExportInvoices}
                disabled={actionLoading || invoices.length === 0}
                className="manage-plan-page__action-btn"
              >
                <div className="manage-plan-page__action-icon manage-plan-page__action-export">
                  ⬇
                </div>
                <div className="manage-plan-page__action-content">
                  <h3>Export Invoices</h3>
                  <p>Download full billing history</p>
                </div>
              </button>
            </div>
          </div>

          {/* ── Invoice History ── */}
          <div className="manage-plan-page__invoices">
            {/* Header row */}
            <div className="manage-plan-page__invoices-header">
              <h2 className="manage-plan-page__invoices-title">
                Invoice History
              </h2>
              <div className="manage-plan-page__filter-group">
                {["all", "paid", "pending"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`manage-plan-page__filter-btn ${filter === f ? "active" : ""}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="manage-plan-page__table-wrapper">
              <table className="manage-plan-page__table">
                <thead>
                  <tr>
                    <th>Invoice ID</th>
                    <th>Period</th>
                    <th>Plan</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th style={{ textAlign: "center" }}>View</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inv) => (
                    <tr key={inv.id}>
                      <td className="manage-plan-page__invoice-id">
                        {inv.razorpayInvoiceId}
                      </td>
                      <td>{formatBillingDate(inv.invoiceDate * 1000)}</td>
                      <td>{inv.planName}</td>
                      <td>
                        <span
                          className={`manage-plan-page__invoice-status ${inv.status}`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td
                        style={{
                          fontWeight: "700",
                          color: "var(--text-primary)",
                        }}
                      >
                        ₹{inv.amount}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <a
                          href={inv.invoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="manage-plan-page__view-invoice"
                        >
                          <Eye size={18} />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filtered.length === 0 && (
                <p className="manage-plan-page__empty-state">
                  No invoices found
                </p>
              )}
            </div>
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
