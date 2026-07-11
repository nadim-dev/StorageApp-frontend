import DriveUILayout from "@/components/DriveUILayout";
import { useAuth } from "@/context/authContext";
import { formatFileSize } from "@/utils/formatFile";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {ArrowRight,CalendarClock,ChartNoAxesCombined,CheckCircle2,ChevronDown,Copy,Eye,FileText,FolderOpen,ShieldCheck,Split,Trash2} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { storageBreakDown,showRecommendation} from "@/api/userApi";
import { useEffect, useMemo, useRef, useState } from "react";
import {fetchLargeFiles,temporaryDeleteFile,viewFile} from "@/api/fileApi";
import { permanentDeleteFile } from "@/api/trashApi";
import { renderFileIcon } from "@/components/common/getFileIcon";
import { formatDate } from "@/utils/formatDate";

const breakdownColors = {
  Videos: "#2563eb",
  Images: "#8b5cf6",
  Documents: "#2dd4bf",
  Archives: "#fb923c",
  Others: "#d1d5db",
};

const storageHealthSteps = [
  "Checking duplicate files",
  "Finding old unused files",
  "Scanning large files",
  "Reviewing trash",
  "Calculating storage health score",
];

const particlePositions = [
  "left-5 top-5 h-1.5 w-1.5",
  "right-7 top-8 h-2 w-2",
  "bottom-6 left-10 h-1 w-1",
  "bottom-8 right-12 h-1.5 w-1.5",
];

const MotionDiv = motion.div;
const MotionButton = motion.button;
const MotionSection = motion.section;
const MotionSpan = motion.span;

function StorageHealthEntryCard() {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(0);
  const routeTimerRef = useRef(null);

  useEffect(() => {
    return () => window.clearTimeout(routeTimerRef.current);
  }, []);

  useEffect(() => {
    if (!isAnalyzing) {
      return undefined;
    }

    if (completedSteps < storageHealthSteps.length) {
      const stepTimer = window.setTimeout(() => {
        setCompletedSteps((currentStep) => currentStep + 1);
      }, 450);

      return () => window.clearTimeout(stepTimer);
    }

    const navigationTimer = window.setTimeout(() => {
      setIsAnalyzing(false);

      routeTimerRef.current = window.setTimeout(() => {
        navigate("/storage-health");
      }, shouldReduceMotion ? 0 : 220);
    }, 550);

    return () => window.clearTimeout(navigationTimer);
  }, [completedSteps, isAnalyzing, navigate, shouldReduceMotion]);

  const startAnalysis = () => {
    setCompletedSteps(0);
    setIsAnalyzing(true);
  };

  return (
    <>
      <MotionSection
        initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
        animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
        whileHover={shouldReduceMotion ? {} : { y: -5, scale: 1.02 }}
        transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
        className="rounded-2xl bg-gradient-to-r from-blue-500/70 via-violet-500/70 to-purple-500/70 p-[1px] shadow-[0_18px_45px_rgba(15,23,42,0.10)]"
        aria-labelledby="storage-health-title"
      >
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="relative shrink-0">
                {particlePositions.map((position) => (
                  <MotionSpan
                    key={position}
                    aria-hidden="true"
                    className={`absolute rounded-full bg-blue-400/50 ${position}`}
                    animate={
                      shouldReduceMotion
                        ? {}
                        : { opacity: [0.25, 0.8, 0.25], y: [0, -6, 0] }
                    }
                    transition={{
                      duration: 2.8,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                ))}

                <MotionDiv
                  className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600 shadow-inner"
                  animate={shouldReduceMotion ? {} : { y: [0, -6, 0] }}
                  transition={{
                    duration: 3.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <ShieldCheck size={31} strokeWidth={2.2} />
                </MotionDiv>
              </div>

              <div className="min-w-0">
                <h2
                  id="storage-health-title"
                  className="text-xl font-bold text-slate-950"
                >
                  Storage Health
                </h2>
                <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-slate-500">
                  Analyze how efficiently your storage is being used.
                </p>
              </div>
            </div>

            <MotionButton
              type="button"
              onClick={startAnalysis}
              aria-label="Analyze Storage"
              whileHover={shouldReduceMotion ? {} : { scale: 1.04 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.96 }}
              animate={
                shouldReduceMotion
                  ? {}
                  : {
                      boxShadow: [
                        "0 12px 24px rgba(59, 130, 246, 0.24)",
                        "0 16px 34px rgba(124, 58, 237, 0.34)",
                        "0 12px 24px rgba(59, 130, 246, 0.24)",
                      ],
                    }
              }
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#2563EB] px-6 text-sm font-bold text-white shadow-lg shadow-blue-500/25 outline-none transition hover:bg-[#1D4ED8] focus-visible:ring-4 focus-visible:ring-blue-200 sm:w-auto"
            >
              Analyze Storage
              <ArrowRight
                size={18}
                className="transition-transform duration-200 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </MotionButton>
          </div>
        </div>
      </MotionSection>

      <AnimatePresence>
        {isAnalyzing && (
          <MotionDiv
            className="fixed inset-0 z-[1400] flex items-center justify-center overflow-y-auto bg-white/60 px-4 pb-24 pt-4 backdrop-blur-sm sm:pb-24"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="status"
            aria-live="polite"
            aria-label="Analyzing your storage"
          >
            <MotionDiv
              className="w-full max-w-sm rounded-2xl border border-white/15 bg-white p-4 text-center shadow-2xl sm:p-5"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
              animate={shouldReduceMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
              exit={shouldReduceMotion ? {} : { opacity: 0, y: 10, scale: 0.98 }}
            >
              <MotionDiv
                className="mx-auto h-12 w-12 rounded-full border-4 border-blue-100 border-t-blue-600 border-r-purple-600 sm:h-14 sm:w-14"
                animate={shouldReduceMotion ? {} : { rotate: 360 }}
                transition={{ duration: 0.95, repeat: Infinity, ease: "linear" }}
                aria-hidden="true"
              />

              <h2 className="mt-3 text-lg font-bold text-slate-950 sm:text-xl">
                Analyzing Your Storage
              </h2>

              <div className="mt-4 max-h-[46vh] space-y-2 overflow-y-auto pr-1 text-left">
                <AnimatePresence initial={false}>
                  {storageHealthSteps.slice(0, completedSteps).map((step) => (
                    <MotionDiv
                      key={step}
                      initial={shouldReduceMotion ? false : { opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ duration: 0.25 }}
                      className="flex items-center gap-2.5 rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600"
                    >
                      <MotionSpan
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
                        initial={false}
                        animate={shouldReduceMotion ? {} : { scale: [0.8, 1.15, 1] }}
                        transition={{ duration: 0.28 }}
                      >
                        <CheckCircle2 size={13} aria-hidden="true" />
                      </MotionSpan>
                      <span>{step}</span>
                    </MotionDiv>
                  ))}
                </AnimatePresence>
              </div>
            </MotionDiv>
          </MotionDiv>
        )}
      </AnimatePresence>
    </>
  );
}

const recommendationMeta = {
  duplicate: {
    helper: (count) =>
      `${count} ${count === 1 ? "group" : "groups"} of duplicate files found`,
    icon: Copy,
    iconClass: "bg-violet-100 text-violet-600",
    redirectTo: "/duplicate-resource",
  },
  old: {
    helper: () => "Not opened in more than 1 year",
    icon: CalendarClock,
    iconClass: "bg-amber-100 text-amber-600",
    redirectTo: "/old-resource",
  },
  large: {
    helper: (count) =>
      `${count} ${count === 1 ? "file" : "files"} larger than 500 MB`,
    icon: FileText,
    iconClass: "bg-rose-100 text-rose-600",
  },
  trash: {
    helper: (count) =>
      `${count} ${count === 1 ? "item" : "items"} currently in trash`,
    icon: Trash2,
    iconClass: "bg-teal-100 text-teal-600",
    redirectTo: "/trash",
  },
};


export const StorageIntelligence = () => {
  const {currentUser}=useAuth();
  const largeFilesSectionRef = useRef(null);
  const [largeFilesList,setLargeFilesList]=useState([]);
  const [selectedLargeFileIds, setSelectedLargeFileIds] = useState([]);
  const {usedStorage = 0,maxStorageInBytes = 1}=currentUser || {};
  const [storageBreakdown, setStorageBreakdown] = useState({totalUsedStorage: 0,categories: [],});
  const [expanding,setExpanding]=useState(false);
  const [isLargeFilesLoading, setIsLargeFilesLoading] = useState(false);
  const [recommendations,setRecommendation]=useState([]);
  const [breakdownError, setBreakdownError] = useState("");
  const [recommendationError, setRecommendationError] = useState("");
  const [largeFilesError, setLargeFilesError] = useState("");
  const consumedStorage=formatFileSize(usedStorage) 
  const totalStorage=formatFileSize(maxStorageInBytes)
  const percentageUsed=Math.min(100, Math.round((usedStorage/maxStorageInBytes)*100))
  const totalRecommendationSize = recommendations.reduce(
    (sum, item) => sum + (Number(item.size) || 0),
    0,
  );
  const duplicateRecommendation =
    recommendations.find((item) => item.type === "duplicate") || {};
  const oldRecommendation =
    recommendations.find((item) => item.type === "old") || {};
  const insightCards = [
  {
    label: "Total Used",
    value: `${consumedStorage}`,
    helper: `of ${totalStorage}`,
    action: `${percentageUsed}% used`, 
    progress: percentageUsed,
    icon: FolderOpen,
    iconClass: "bg-blue-100 text-blue-600",
    actionClass: "text-blue-600",
  },
  {
    label: "Can be Freed",
    value: formatFileSize(totalRecommendationSize),
    helper: `${recommendations.length} ${recommendations.length === 1 ? "recommendation" : "recommendations"}`,
    action: "View all",
    icon: ChartNoAxesCombined,
    iconClass: "bg-emerald-100 text-emerald-600",
    actionClass: "text-violet-600",
  },
  {
    label: "Duplicate Files",
    value: formatFileSize(Number(duplicateRecommendation.size) || 0),
    helper: `${duplicateRecommendation.count || 0} ${
      duplicateRecommendation.count === 1 ? "duplicate group" : "duplicate groups"
    }`,
    action: "View duplicates",
    redirectTo:"/duplicate-resource",
    icon: Copy,
    iconClass: "bg-amber-100 text-amber-600",
    actionClass: "text-violet-600",
  },
  {
    label: "Old & Unused Files",
    value: formatFileSize(Number(oldRecommendation.size) || 0),
    helper: "Not opened in 1+ year",
    action: "Review files",
    redirectTo:"/old-resource",
    icon: CalendarClock,
    iconClass: "bg-rose-100 text-rose-600",
    actionClass: "text-violet-600",
  },
  ];
  
  useEffect(()=>{
    const fetchBreakDownStorage=async ()=>{
      try {

        const response = await storageBreakDown();

        setStorageBreakdown({
          totalUsedStorage: response.totalUsedStorage,
          categories: response.categories
        });
      } catch (error) {
        console.error("Failed to fetch storage breakdown", error);
        setBreakdownError("Storage breakdown is unavailable right now.");
      }
    }
    fetchBreakDownStorage()

  },[])

  useEffect(()=>{
   const fetchAllRecommendations=async ()=>{
      try {
        console.log("fetchAllRecommendation is running");
        const data=await showRecommendation();
        console.log("data",data);
        setRecommendation(data?.recommendations || []);
      } catch (error) {
        console.error("Failed to fetch recommendations", error);
        setRecommendationError("Recommendations are unavailable right now.");
      }
   }
   fetchAllRecommendations();
  },[])

  useEffect(() => {
    if (!expanding) return;

    requestAnimationFrame(() => {
      largeFilesSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [expanding]);
             
  const breakdownCategories = useMemo(() => {
    return storageBreakdown.categories.map((category, index) => ({
      ...category,
      color:
        breakdownColors[category.name] ||
        ["#2563eb", "#8b5cf6", "#2dd4bf", "#fb923c", "#d1d5db"][index % 5],
    }));
  }, [storageBreakdown.categories]);

  const donutBackground = useMemo(() => {
    if (breakdownCategories.length === 0) {
      return "conic-gradient(#e5e7eb 0% 100%)";
    }

    let start = 0;
    const segments = breakdownCategories.map((category) => {
      const end = start + Number(category.percentage || 0);
      const segment = `${category.color} ${start}% ${end}%`;
      start = end;
      return segment;
    });

    if (start < 100) {
      segments.push(`#e5e7eb ${start}% 100%`);
    }

    return `conic-gradient(${segments.join(", ")})`;
  }, [breakdownCategories]);

  const navigate=useNavigate();
  const hasLargeFiles = largeFilesList.length > 0;
  const allLargeFilesSelected =
    hasLargeFiles && selectedLargeFileIds.length === largeFilesList.length;
  const totalLargeFilesSize = largeFilesList.reduce(
    (sum, file) => sum + (Number(file.size) || 0),
    0,
  );

  const toggleLargeFileSelection = (fileId) => {
    setSelectedLargeFileIds((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId],
    );
  };

  const toggleAllLargeFiles = () => {
    setSelectedLargeFileIds(
      allLargeFilesSelected ? [] : largeFilesList.map((file) => file._id),
    );
  };

  const removeLargeFilesFromUi = (fileIds) => {
    const selectedIds = new Set(fileIds);
    setLargeFilesList((prev) =>
      prev.filter((file) => !selectedIds.has(file._id)),
    );
    setSelectedLargeFileIds((prev) =>
      prev.filter((id) => !selectedIds.has(id)),
    );
  };

  const handleLargeFileAction = async (action) => {
    if (selectedLargeFileIds.length === 0) return;

    const fileIds = [...selectedLargeFileIds];
    removeLargeFilesFromUi(fileIds);

    try {
      await Promise.all(fileIds.map((fileId) => action(fileId)));
    } catch (error) {
      console.error("Failed to update large files", error);
      setLargeFilesError(error.message || "Failed to update large files");
    }
  };

  const viewLargeFile=async ()=>{
     try{
      setExpanding(true);
      setIsLargeFilesLoading(true);
      setLargeFilesError("");
      const {largeFileList}=await fetchLargeFiles();
      setLargeFilesList(largeFileList);
     }catch(err){
      console.error("Failed to fetch large files", err);
      setLargeFilesError(err.message || "Failed to fetch large files");
     } finally {
      setIsLargeFilesLoading(false);
     }
  }
  return (
    <DriveUILayout
        active="storage-intelligence"
        headerMode="storage-intelligence"
        // query={query}
        // setQuery={setQuery}
    >
      <div className="space-y-8 p-4 md:p-1">
        <div className="flex items-start gap-3">

          <div className="mt-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 text-violet-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3zm6 9l.75 2.25L21 15l-2.25.75L18 18l-.75-2.25L15 15l2.25-.75L18 12zM6 15l.75 2.25L9 18l-2.25.75L6 21l-.75-2.25L3 18l2.25-.75L6 15z"
              />
            </svg>
          </div>


          <div>
            <h1 className="text-4xl mt-1 font-bold text-gray-900">
              Storage Intelligence
            </h1>

            <p className="mt-2 text-lg text-gray-500">
              AI-powered insights to help you free up space and keep your drive organized.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {insightCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className="rounded-lg border border-slate-100 bg-white p-2 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${card.iconClass}`}
                  >
                    <Icon size={26} strokeWidth={2.2} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-400">
                      {card.label}
                    </p>
                    <h2 className="mt-1 text-3xl font-bold leading-none text-slate-900 lg:text-[20px]">
                      {card.value}
                    </h2>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      {card.helper}
                    </p>
                  </div>
                </div>

                {typeof card.progress === "number" ? (
                  <div className="mt-5 flex items-center gap-3">
                    <span className={`shrink-0 text-sm font-semibold ${card.actionClass}`}>
                      {card.action}
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{ width: `${card.progress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={`mt-5 text-sm font-semibold ${card.actionClass} cursor-pointer`}
                    onClick={() => {
                      if (card.redirectTo) {
                        navigate(card.redirectTo);
                      }
                    }}
                  >
                    {card.action}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <StorageHealthEntryCard />

        <section className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm lg:w-3/4 xl:w-2/3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Storage Breakdown
            </h2>

            <div className="relative w-full sm:w-28">
              <select
                className="h-9 w-full appearance-none rounded-md border border-slate-200 bg-white px-3 pr-8 text-xs font-semibold text-slate-600 shadow-sm outline-none"
                defaultValue="all-time"
                aria-label="Storage breakdown period"
              >
                <option value="all-time">All Time</option>
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>

          {breakdownError ? (
            <p className="mt-8 rounded-md bg-slate-50 px-4 py-6 text-center text-sm font-medium text-slate-500">
              {breakdownError}
            </p>
          ) : (
            <div className="mt-8 grid gap-8 xl:grid-cols-[220px_minmax(0,1fr)] xl:items-center">
              <div className="flex justify-center xl:justify-start">
                <div
                  className="relative h-52 w-52 rounded-full"
                  style={{ background: donutBackground }}
                  aria-label="Storage breakdown chart"
                >
                  <div className="absolute inset-10 flex flex-col items-center justify-center rounded-full bg-white shadow-inner">
                    <span className="text-2xl font-bold leading-tight text-slate-900">
                      {formatFileSize(storageBreakdown.totalUsedStorage)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {breakdownCategories.length === 0 ? (
                  <p className="rounded-md bg-slate-50 px-4 py-6 text-center text-sm font-medium text-slate-500">
                    No storage categories found.
                  </p>
                ) : (
                  breakdownCategories.map((category) => (
                    <div
                      key={category.name}
                      className="grid grid-cols-[minmax(0,1fr)_80px_56px] items-center gap-4 text-sm"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="truncate font-semibold text-slate-600">
                          {category.name}
                        </span>
                      </div>
                      <span className="text-right font-bold text-slate-700">
                        {formatFileSize(category.size)}
                      </span>
                      <span className="text-right font-semibold text-slate-400">
                        {Number(category.percentage || 0).toFixed(1)}%
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm lg:w-3/4 xl:w-2/3">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-bold text-slate-900">
              Smart Recommendations
            </h2>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600">
              {recommendations.length} {recommendations.length === 1 ? "item" : "items"}
            </span>
          </div>

          {recommendationError ? (
            <p className="px-5 py-8 text-center text-sm font-medium text-slate-500">
              {recommendationError}
            </p>
          ) : recommendations.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm font-medium text-slate-500">
              No cleanup recommendations found.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recommendations.map((item) => {
                const meta = recommendationMeta[item.type] || {};
                const Icon = meta.icon || FileText;
                const helper =
                  typeof meta.helper === "function"
                    ? meta.helper(item.count)
                    : `${item.count} files found`;
                const isLargeFile = item.type === "large";

                return (
                  <div
                    key={item.type}
                    className="grid gap-4 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_110px_auto] sm:items-center"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${meta.iconClass || "bg-slate-100 text-slate-600"}`}
                      >
                        <Icon size={22} strokeWidth={2.2} />
                      </span>

                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-slate-900">
                          {item.title}
                        </h3>
                        <p className="mt-1 truncate text-xs font-medium text-slate-500">
                          {helper}
                        </p>
                      </div>
                    </div>

                    <p className="text-left text-sm font-bold text-slate-900 sm:text-right">
                      {formatFileSize(item.size)}
                    </p>

                    {isLargeFile ? (
                      <button
                        type="button"
                        className="inline-flex cursor-pointer h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-700"
                        aria-label="Split large files"
                        title="Split large files"
                        onClick={async (e)=>{e.preventDefault();
                          await viewLargeFile();
                        }}
                      >
                        <Split size={18} strokeWidth={2.2} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="inline-flex h-10 items-center  justify-center cursor-pointer rounded-md border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                        onClick={() => {
                          if (meta.redirectTo) {
                            navigate(meta.redirectTo);
                          }
                        }}
                      >
                        Review
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {expanding && (
          <section
            ref={largeFilesSectionRef}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                    <FileText size={22} />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-slate-900">
                      Large files
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Review files taking the most storage space.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500">
                      Large files
                    </p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">
                      {largeFilesList.length}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500">
                      Storage used
                    </p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">
                      {formatFileSize(totalLargeFilesSize)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {isLargeFilesLoading ? (
              <p className="px-5 py-8 text-center text-sm font-medium text-slate-500">
                Loading large files...
              </p>
            ) : largeFilesError ? (
              <p className="px-5 py-8 text-center text-sm font-medium text-red-500">
                {largeFilesError}
              </p>
            ) : !hasLargeFiles ? (
              <div className="px-5 py-8">
                <div className="mx-auto flex max-w-xl items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-600">
                    <CheckCircle2 size={22} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-slate-900">
                      No large files found
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Your drive does not have files over the large-file threshold right now.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 sm:p-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <label className="inline-flex h-10 w-fit items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-800">
                    <input
                      type="checkbox"
                      checked={allLargeFilesSelected}
                      onChange={toggleAllLargeFiles}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                      aria-label="Select all large files"
                    />
                    Select All
                  </label>
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
                    <RefreshCcw size={14} />
                    {formatFileSize(totalLargeFilesSize)} can be reviewed
                  </div>
                </div>

                <div className="space-y-2">
                  {largeFilesList.map((file) => (
                    <div
                      key={file._id}
                      className="grid min-w-0 grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-3 lg:grid-cols-[minmax(0,1fr)_120px_160px_100px] lg:items-center lg:gap-4"
                    >
                      <div className="flex min-w-0 items-start gap-3 sm:items-center">
                        <input
                          type="checkbox"
                          checked={selectedLargeFileIds.includes(file._id)}
                          onChange={() => toggleLargeFileSelection(file._id)}
                          className="mt-2 h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 sm:mt-0"
                          aria-label={`Select ${file.name}`}
                        />
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                          {renderFileIcon(file.extension)}
                        </div>
                        <div className="min-w-0">
                          <p className="break-words text-sm font-semibold text-slate-900 sm:truncate">
                            {file.name}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {file.extension
                              ? file.extension.toUpperCase()
                              : "Unknown type"}
                          </p>
                        </div>
                      </div>

                      <p className="flex items-center justify-between gap-3 text-sm text-slate-500 lg:block lg:text-right">
                        <span className="font-medium text-slate-400 lg:hidden">
                          Size
                        </span>
                        {formatFileSize(file.size)}
                      </p>

                      <p className="flex min-w-0 items-center justify-between gap-3 text-sm text-slate-500 lg:block lg:truncate lg:text-right">
                        <span className="shrink-0 font-medium text-slate-400 lg:hidden">
                          Updated
                        </span>
                        <span className="min-w-0 truncate">
                          {file.updatedAt ? formatDate(file.updatedAt) : "-"}
                        </span>
                      </p>

                      <button
                        type="button"
                        className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                        onClick={async () => {
                          const { url } = await viewFile(file._id);
                          window.open(url, "_blank");
                        }}
                      >
                        <Eye size={14} />
                        Preview
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">
                    Select large files you no longer need.
                  </p>
                  <div className="grid gap-3 sm:flex sm:shrink-0">
                    <button
                      type="button"
                      disabled={selectedLargeFileIds.length === 0}
                      onClick={() => handleLargeFileAction(temporaryDeleteFile)}
                      className="rounded-md border border-red-300 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Move to Trash
                    </button>
                    <button
                      type="button"
                      disabled={selectedLargeFileIds.length === 0}
                      onClick={() => handleLargeFileAction(permanentDeleteFile)}
                      className="rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Delete Files
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

      </div>
    </DriveUILayout>
  );
};
