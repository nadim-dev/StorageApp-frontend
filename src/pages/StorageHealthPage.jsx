import DriveUILayout from "@/components/DriveUILayout";
import { storageHealthCalculator } from "@/api/userApi";
import { formatFileSize } from "@/utils/formatFile";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  Copy,
  FileText,
  HardDrive,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const normalizeStorageHealthData = (payload) => payload?.data ?? payload ?? {};

const getHealthScore = (healthData) => {
  const rawScore = healthData?.score ?? 0;
  return Math.max(0, Math.min(100, Math.round(Number(rawScore) || 0)));
};

const getHealthStatus = (score) => {
  if (score >= 85) {
    return {
      label: "Excellent",
      description: "Your storage is clean, balanced, and easy to maintain.",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
    };
  }

  if (score >= 65) {
    return {
      label: "Good",
      description: "A few cleanup actions can make your drive healthier.",
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
    };
  }

  if (score >= 40) {
    return {
      label: "Needs Attention",
      description: "Old, duplicate, or large files are using meaningful space.",
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100",
    };
  }

  return {
    label: "Critical",
    description: "Your storage is heavily cluttered.",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-100",
  };
};

const recommendationMeta = {
  duplicate: {
    label: "Duplicate Files",
    icon: Copy,
    iconClass: "bg-violet-100 text-violet-600",
    redirectTo: "/duplicate-resource",
  },
  old: {
    label: "Old & Unused Files",
    icon: CalendarClock,
    iconClass: "bg-amber-100 text-amber-600",
    redirectTo: "/old-resource",
  },
  large: {
    label: "Large Unused Files",
    icon: FileText,
    iconClass: "bg-rose-100 text-rose-600",
    redirectTo: "/storage-intelligence",
  },
  trash: {
    label: "Trash",
    icon: Trash2,
    iconClass: "bg-teal-100 text-teal-600",
    redirectTo: "/trash",
  },
};

const statusClasses = {
  good: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  critical: "bg-red-50 text-red-700",
};

function StorageHealthDashboard() {
  const navigate = useNavigate();
  const [healthData, setHealthData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStorageHealth = async () => {
    try {
      setIsLoading(true);
      setError("");
      const data = await storageHealthCalculator();
      setHealthData(normalizeStorageHealthData(data));
    } catch (err) {
      console.error("Failed to calculate storage health", err);
      setError(err.message || "Storage health is unavailable right now.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadStorageHealth = async () => {
      try {
        setIsLoading(true);
        setError("");
        const data = await storageHealthCalculator();
        if (isMounted) {
          setHealthData(normalizeStorageHealthData(data));
        }
      } catch (err) {
        console.error("Failed to calculate storage health", err);
        if (isMounted) {
          setError(err.message || "Storage health is unavailable right now.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadStorageHealth();

    return () => {
      isMounted = false;
    };
  }, []);

  const score = getHealthScore(healthData);
  const status = getHealthStatus(score);
  const healthRecommendations = Array.isArray(healthData?.recommendations)
    ? healthData.recommendations
    : [];
  const circumference = 2 * Math.PI * 45;
  const scoreOffset = circumference - (score / 100) * circumference;
  const totalRecoverableSize = healthRecommendations.reduce(
    (sum, item) => sum + (Number(item.size) || 0),
    0,
  );
  const warningRecommendations = healthRecommendations.filter(
    (item) => item.status !== "good" && Number(item.size) > 0,
  );

  const metrics = healthRecommendations.map((item) => {
    const meta = recommendationMeta[item.type] || {};

    return {
      type: item.type,
      label: item.title || meta.label || "Storage Item",
      value: formatFileSize(Number(item.size) || 0),
      helper: item.status === "good" ? "No cleanup needed" : "Needs review",
      status: item.status || "warning",
      icon: meta.icon || FileText,
      iconClass: meta.iconClass || "bg-slate-100 text-slate-600",
      route: meta.redirectTo || "/storage-intelligence",
    };
  });

  const habits = [
    {
      label: "Recoverable space",
      value: formatFileSize(totalRecoverableSize),
      helper: "Across storage health recommendations",
      icon: TrendingUp,
      iconClass: "bg-emerald-100 text-emerald-600",
    },
    {
      label: "Review cadence",
      value: score >= 85 ? "Monthly" : score >= 65 ? "Biweekly" : "Weekly",
      helper: "Suggested cleanup rhythm",
      icon: CalendarClock,
      iconClass: "bg-blue-100 text-blue-600",
    },
  ];

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate("/storage-intelligence")}
            className="mb-4 inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Storage Health
          </h1>
          <p className="mt-2 max-w-2xl text-base text-slate-500">
            A focused scan of cleanup risks, recoverable space, and storage habits.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchStorageHealth}
          disabled={isLoading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-violet-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
        >
          <RefreshCcw size={16} className={isLoading ? "animate-spin" : ""} />
          {isLoading ? "Scanning" : "Recalculate"}
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center shadow-sm">
          <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-slate-100 border-t-violet-600" />
          <p className="mt-5 text-sm font-semibold text-slate-500">
            Loading storage health result...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm font-semibold text-red-600">
          {error}
        </div>
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
            <div className={`rounded-xl border ${status.border} ${status.bg} p-5 shadow-sm`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500">
                    Health Score
                  </p>
                  <h2 className={`mt-1.5 text-xl font-bold ${status.color}`}>
                    {status.label}
                  </h2>
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm">
                  <ShieldCheck size={21} />
                </span>
              </div>

              <div className="mt-5 flex justify-center">
                <div className="relative h-40 w-40">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-white/80"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={scoreOffset}
                      className={status.color}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-slate-950">{score}</span>
                    <span className="mt-0.5 text-xs font-semibold text-slate-500">
                      out of 100
                    </span>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-center text-sm leading-5 text-slate-600">
                {healthData?.message || status.description}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {metrics.map((metric) => {
                const Icon = metric.icon;

                return (
                  <button
                    key={metric.type}
                    type="button"
                    onClick={() => navigate(metric.route)}
                    className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-violet-200 hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${metric.iconClass}`}
                      >
                        <Icon size={20} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-500">
                          {metric.label}
                        </p>
                        <p className="mt-1 text-2xl font-bold text-slate-950">
                          {metric.value}
                        </p>
                        <p className="mt-0.5 text-sm font-medium text-slate-400">
                          {metric.helper}
                        </p>
                        <span
                          className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${
                            statusClasses[metric.status] || "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {metric.status}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Activity size={18} />
                </span>
                <h2 className="text-lg font-bold text-slate-950">
                  Cleanup Priorities
                </h2>
              </div>

              {warningRecommendations.length === 0 ? (
                <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
                  No urgent cleanup recommendations found.
                </div>
              ) : (
                <div className="mt-4 space-y-2.5">
                  {warningRecommendations.map((item) => {
                    const meta = recommendationMeta[item.type] || {};
                    const Icon = meta.icon || AlertTriangle;

                    return (
                      <div
                        key={item.type}
                        className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.iconClass || "bg-slate-100 text-slate-600"}`}
                          >
                            <Icon size={17} />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-900">
                              {item.title}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              {formatFileSize(item.size)} recoverable
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate(meta.redirectTo || "/storage-intelligence")}
                          className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:border-violet-200 hover:text-violet-700"
                        >
                          Review
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <HardDrive size={18} />
              </span>
              <h2 className="mt-3 text-lg font-bold text-slate-950">
                Health Guidance
              </h2>
              <p className="mt-1.5 text-sm leading-5 text-slate-500">
                Prioritize warning items first, then review storage health again after cleanup.
              </p>

              <div className="mt-4 space-y-2.5">
                {habits.map((habit) => {
                  const Icon = habit.icon;

                  return (
                    <div
                      key={habit.label}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-2.5"
                    >
                      <span
                        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${habit.iconClass}`}
                      >
                        <Icon size={16} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900">
                          {habit.value}
                        </p>
                        <p className="text-xs font-semibold text-slate-500">
                          {habit.helper}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export function StorageHealthPage() {
  return (
    <DriveUILayout
      active="storage-intelligence"
      headerMode="storage-intelligence"
    >
      <div className="p-4 md:p-1">
        <StorageHealthDashboard />
      </div>
    </DriveUILayout>
  );
}
