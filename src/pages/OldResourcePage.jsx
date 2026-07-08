import DriveUILayout from "@/components/DriveUILayout";
import {ArrowDown,CalendarClock,ChevronDown,Download,FileText,PieChart} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { fetchOldResources, temporaryDeleteFile, viewFile,downloadFile } from "@/api/fileApi";
import { permanentDeleteFile } from "@/api/trashApi";
import { formatFileSize } from "@/utils/formatFile";
import { renderFileIcon } from "@/components/common/getFileIcon";
import { formatDate } from "@/utils/formatDate";


export const OldResourcePage = () => {
  const [oldResources, setOldResources] = useState([]);
  const [summary, setSummary] = useState({});
  const [selectedFileIds, setSelectedFileIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortOrder, setSortOrder] = useState("oldest");
  

  useEffect(() => {
    const fetchOldResource = async () => {
      try {
        const { oldFilesList, summary } = await fetchOldResources();
        console.log("oldFilesList", oldFilesList);
        console.log("summary", summary);
        setOldResources(oldFilesList || []);
        setSummary(summary || {});
      } catch (err) {
        console.error("Failed to fetch old resources", err);
        setError(err.message || "Failed to fetch old resources");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOldResource();
  }, []);

  const allSelected =
    oldResources.length > 0 && selectedFileIds.length === oldResources.length;

  const sortedOldResources = useMemo(() => {
    return [...oldResources].sort((a, b) => {
      const aTime = a.lastAccessedAt
        ? new Date(a.lastAccessedAt).getTime()
        : Number.POSITIVE_INFINITY;
      const bTime = b.lastAccessedAt
        ? new Date(b.lastAccessedAt).getTime()
        : Number.POSITIVE_INFINITY;

      return sortOrder === "oldest" ? aTime - bTime : bTime - aTime;
    });
  }, [oldResources, sortOrder]);

  const toggleAllFiles = () => {
    setSelectedFileIds(allSelected ? [] : oldResources.map((file) => file._id));
  };

  const toggleFileSelection = (fileId) => {
    setSelectedFileIds((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId],
    );
  };

  const removeSelectedFilesFromUi = (fileIds) => {
    const selectedIds = new Set(fileIds);
    const removedSize = oldResources.reduce(
      (sum, file) => (selectedIds.has(file._id) ? sum + (file.size || 0) : sum),
      0,
    );

    setOldResources((prev) =>
      prev.filter((file) => !selectedIds.has(file._id)),
    );
    setSelectedFileIds((prev) => prev.filter((id) => !selectedIds.has(id)));
    setSummary((prev) => ({
      ...prev,
      totalFiles: Math.max(0, (prev.totalFiles || 0) - fileIds.length),
      removableSize: Math.max(0, (prev.removableSize || 0) - removedSize),
    }));
  };

  const handleOldResourceAction = async (action) => {
    if (selectedFileIds.length === 0) return;

    const fileIds = [...selectedFileIds];
    removeSelectedFilesFromUi(fileIds);

    try {
      await Promise.all(fileIds.map((fileId) => action(fileId)));
    } catch (err) {
      console.error("Failed to update old resources", err);
      setError(err.message || "Failed to update old resources");
    }
  };

  const handleDownloadFile = async (fileId) => {
    try {
      const { url } = await downloadFile(fileId);
      window.location.href = url;
    } catch (err) {
      console.error("Failed to download file", err);
      setError(err.message || "Failed to download file");
    }
  };

  const oldResourceStats = [
    {
      label: "Old & Unused Files",
      value: formatFileSize(summary?.removableSize),
      helper: "Not opened in 1+ year",
      icon: CalendarClock,
      iconClass: "bg-rose-100 text-rose-600",
    },
    {
      label: "Total Files",
      value: summary?.totalFiles,
      helper: "Files taking up space",
      icon: FileText,
      iconClass: "bg-indigo-100 text-indigo-600",
    },
    {
      label: "Potential Space to Free",
      value: formatFileSize(summary?.removableSize),
      helper: "By removing these files",
      icon: PieChart,
      iconClass: "bg-teal-100 text-teal-600",
    },
  ];

  return (
    <DriveUILayout
      active="storage-intelligence"
      headerMode="storage-intelligence"
    >
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">
          Old &amp; Unused Files
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Files you haven't opened in more than 1 year
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {oldResourceStats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${stat.iconClass}`}
                >
                  <Icon size={24} strokeWidth={2.2} />
                </span>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-400">
                    {stat.label}
                  </p>
                  <h2 className="mt-2 text-2xl font-bold leading-none text-slate-900">
                    {stat.value}
                  </h2>
                  <p className="mt-2 text-sm font-medium text-slate-500">
                    {stat.helper}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center">
          <label className="inline-flex h-10 w-fit items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-700">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAllFiles}
              className="h-4 w-4 rounded border-slate-300 text-slate-600"
              aria-label="Select all old files"
            />
            Select All
          </label>

          <div className="relative w-full sm:w-80">
            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              className="h-10 w-full appearance-none rounded-md border border-slate-200 bg-white px-2 pr-10 text-sm font-semibold text-slate-600 shadow-sm outline-none"
              aria-label="Sort old files by last opened"
            >
              <option value="oldest">Sort by: Last opened (oldest)</option>
              <option value="newest">Sort by: Last opened (newest)</option>
            </select>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-bold uppercase">
              <tr>
                <th className="w-12 px-4 py-4"></th>
                <th className="px-4 py-4 font-bold">File Name</th>
                <th className="px-4 py-4 font-bold">Size</th>
                <th className="px-4 py-4">
                  <span className="inline-flex items-center gap-1">
                    Last Opened
                    <ArrowDown size={13} strokeWidth={2.4} />
                  </span>
                </th>
                <th className="px-4 py-4">Uploaded On</th>
                <th className="w-12 px-4 py-4"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                    Loading old files...
                  </td>
                </tr>
              )}

              {!isLoading && error && (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              )}

              {!isLoading && !error && oldResources.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                    No old files found.
                  </td>
                </tr>
              )}

              {!isLoading &&
                !error &&
                sortedOldResources.map((file) => (
                  <tr key={file._id} className="hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedFileIds.includes(file._id)}
                        onChange={() => toggleFileSelection(file._id)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                        aria-label={`Select ${file.name}`}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex min-w-0 items-center gap-3 cursor-pointer"
                      onClick={async (e)=>{
                        e.preventDefault();
                         const { url } = await viewFile(file._id);
                         window.open(url, "_blank");
                      }}>
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                          {renderFileIcon(file.extension)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900 cursor-pointer" >
                            {file.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {file.extension ? file.extension.toUpperCase() : "FILE"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-medium text-slate-700">
                      {formatFileSize(file.size)}
                    </td>
                    <td className="px-4 py-4 font-semibold text-rose-500">
                      {file.lastAccessedAt
                        ? formatDate(file.lastAccessedAt)
                        : "-"}
                    </td>
                    <td className="px-4 py-4">
                      {file.updatedAt ? formatDate(file.updatedAt) : "-"}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDownloadFile(file._id)}
                        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                        aria-label={`Download ${file.name}`}
                        title="Download"
                      >
                        <Download size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          disabled={selectedFileIds.length === 0}
          onClick={() => handleOldResourceAction(temporaryDeleteFile)}
          className="rounded-md border border-slate-300 cursor-pointer px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Move to Trash
        </button>
        <button
          type="button"
          disabled={selectedFileIds.length === 0}
          onClick={() => handleOldResourceAction(permanentDeleteFile)}
          className="rounded-md bg-violet-600 cursor-pointer  px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Permanently Delete
        </button>
      </div>
    </DriveUILayout>
  );
};
