import { useEffect, useState } from "react";
import { fetchDuplicateFiles } from "@/api/fileApi";
import DriveUILayout from "@/components/DriveUILayout";
import { formatFileSize } from "@/utils/formatFile";
import { renderFileIcon } from "@/components/common/getFileIcon";
import {Copy,FileText,RefreshCcw,Search,Sparkles,Star,ChevronDown,Eye,CheckCircle2} from "lucide-react";
import { viewFile } from "@/api/fileApi";
import { moveDuplicatesToTrash,deleteAllDuplicates } from "@/api/fileApi";

export const DuplicatePage = () => {
  const [duplicateResource, setDuplicateResource] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedGroups, setExpandedGroups] = useState([]);
  const [totalRecoverableSpace, setTotalRecoverableSpace] = useState(0);
  const [selectedFileIds, setSelectedFileIds] = useState([]);
  const totalGroups = duplicateResource.length;
  const totalDuplicateFiles = duplicateResource.reduce(
    (sum, group) => sum + (group.files?.length || 0),
    0,
  );
  const hasDuplicateResources = duplicateResource.length > 0;
  useEffect(() => {
    const fetchDuplicateResource = async () => {
      try {
        const { duplicateGroups, totalRecoverableSpace } =
        await fetchDuplicateFiles();
        setDuplicateResource(duplicateGroups || []);
        setTotalRecoverableSpace(totalRecoverableSpace || 0);
      } catch (error) {
        console.error("Failed to fetch duplicate files", error);
        setError(error.message || "Failed to fetch duplicate files");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDuplicateResource();
  }, []);

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId],
    );
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
    let removedSize = 0;

    const nextDuplicateResource = duplicateResource
      .map((group) => {
        let groupRemovedSize = 0;
        const remainingFiles = (group.files || []).filter((file) => {
          const shouldRemove = selectedIds.has(file._id);

          if (shouldRemove) {
            const fileSize = Number(file.size) || 0;
            groupRemovedSize += fileSize;
            removedSize += fileSize;
          }

          return !shouldRemove;
        });

        return {
          ...group,
          files: remainingFiles,
          count: remainingFiles.length,
          recoverableSpace: Math.max(
            0,
            (Number(group.recoverableSpace) || 0) - groupRemovedSize,
          ),
        };
      })
      .filter((group) => (group.files?.length || 0) > 0);

    setDuplicateResource(nextDuplicateResource);
    setTotalRecoverableSpace((prev) => Math.max(0, prev - removedSize));
    setSelectedFileIds((prev) => prev.filter((id) => !selectedIds.has(id)));
  };

  const handleDuplicateAction = async (action) => {
    if (selectedFileIds.length === 0) return;

    const fileIds = [...selectedFileIds];
    removeSelectedFilesFromUi(fileIds);

    try {
      await action({ fileIds });
    } catch (error) {
      console.error("Failed to update duplicate files", error);
      setError(error.message || "Failed to update duplicate files");
    }
  };

  return (
    <DriveUILayout
      active="storage-intelligence"
      headerMode="storage-intelligence"
    >
      <div className="min-h-full overflow-x-hidden bg-slate-100 text-slate-900">
        <div className="mx-auto max-w-7xl space-y-6 px-2 sm:px-0">
          <section className="rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-sm sm:rounded-2xl sm:p-5 lg:p-6">
            <div className="space-y-5">
              <div className="space-y-3">
                <div className="inline-flex max-w-full items-start gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-600 sm:text-xs sm:tracking-[0.18em]">
                  <Sparkles size={16} /> Duplicate Cleanup
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    Duplicate files
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm text-slate-500">
                    Review and remove duplicate copies to free up storage space.
                  </p>
                  {!isLoading && !error && !hasDuplicateResources && (
                    <div className="mt-5 flex max-w-xl items-start gap-3 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
                      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                        <CheckCircle2 size={22} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-slate-900">
                          No duplicate files found
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          Your drive is clean right now. We will show duplicate
                          groups here when matching files are detected.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {!isLoading && !error && hasDuplicateResources && (
                <>
              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-900 shadow-sm">
                  <div className="flex items-start justify-start gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                      <Copy size={18} />
                    </span>
                    <div className="min-w-0 text-left">
                      <p className="text-xs font-semibold text-slate-500">
                        Duplicate groups
                      </p>
                      <p className="mt-2 text-xl font-semibold">
                        {totalGroups}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Groups of duplicates
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-900 shadow-sm">
                  <div className="flex items-start justify-start gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
                      <FileText size={18} />
                    </span>
                    <div className="min-w-0 text-left">
                      <p className="text-xs font-semibold text-slate-500">
                        Duplicate items
                      </p>
                      <p className="mt-2 text-xl font-semibold">
                        {totalDuplicateFiles}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Total duplicate files
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-900 shadow-sm">
                  <div className="flex items-start justify-start gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                      <RefreshCcw size={18} />
                    </span>
                    <div className="min-w-0 text-left">
                      <p className="text-xs font-semibold text-slate-500">
                        Recoverable space
                      </p>
                      <p className="mt-2 text-xl font-semibold">
                        {formatFileSize(totalRecoverableSpace)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Storage you can free
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-900 shadow-sm">
                  <div className="flex items-start justify-start gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                      <Star size={18} />
                    </span>
                    <div className="min-w-0 text-left">
                      <p className="text-[12px] font-semibold text-slate-500">
                        Potential savings
                      </p>
                      <p className="mt-2  text-xl font-semibold">
                        {formatFileSize(totalRecoverableSpace)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Estimated savings
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="relative mx-0 w-full max-w-xl rounded-lg">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search duplicate files..."
                    className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 text-sm text-slate-900 shadow-sm outline-none transition"
                  />
                </div>
              </div>
                <div className="space-y-5 mt-4">
                  {duplicateResource.map((group) => {
                    const isExpanded = expandedGroups.includes(group._id);
                    const firstFile = group.files?.[0] || {};

                    return (
                      <article
                        key={group._id}
                        className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                      >
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => toggleGroup(group._id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ")
                              toggleGroup(group._id);
                          }}
                          className="w-full cursor-pointer px-3 py-4 text-left hover:bg-slate-50 sm:px-4"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                                {renderFileIcon(firstFile.extension)}
                              </div>
                              <div className="min-w-0">
                                <h3 className="break-words text-base font-semibold text-slate-900 sm:truncate sm:text-lg">
                                  {firstFile.name || "Untitled duplicate group"}
                                </h3>
                                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                  <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-600 border border-violet-100">
                                    {group.count} copies
                                  </span>
                                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600 border border-emerald-100">
                                    Save{" "}
                                    {formatFileSize(group.recoverableSpace)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end sm:gap-3">
                              <button
                                type="button"
                                className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (!firstFile?._id) return;
                                  const { url } = await viewFile(firstFile._id);
                                  window.open(url, "_blank");
                                }}
                              >
                                <Eye size={14} />
                                Preview
                              </button>
                              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-600 border border-sky-100">
                                100% match
                              </span>
                              <ChevronDown
                                size={18}
                                className={`ml-auto transition-transform sm:ml-0 ${isExpanded ? "rotate-180" : "rotate-0"} text-slate-500`}
                              />
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-slate-200 bg-slate-50 px-3 py-4 sm:px-4">
                            <div className="space-y-3">
                              <div className="text-xs text-slate-500">
                                {group.files?.length} duplicate copies
                              </div>
                              <div className="space-y-2">
                                {group.files?.map((file, index) => (
                                  <div
                                    key={file._id}
                                    className="grid min-w-0 grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-3 lg:grid-cols-[minmax(0,1fr)_110px_120px_180px_28px] lg:items-center lg:gap-4"
                                  >
                                    <div className="flex min-w-0 items-start gap-3 sm:items-center">
                                      <input
                                        type="checkbox"
                                        checked={selectedFileIds.includes(file._id)}
                                        onChange={() =>
                                          toggleFileSelection(file._id)
                                        }
                                        className="mt-2 h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 sm:mt-0"
                                      />
                                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                                        {renderFileIcon(file.extension)}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <p className="min-w-0 break-words text-sm font-semibold text-slate-900 sm:truncate">
                                            {file.name}
                                          </p>
                                          {index === 0 && (
                                            <span className="rounded-full bg-emerald-100 px-2.5 py-[2px] text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                                              Recommended
                                            </span>
                                          )}
                                        </div>
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
                                      {file.size
                                        ? formatFileSize(file.size)
                                        : "-"}
                                    </p>
                                    <p className="flex min-w-0 items-center justify-between gap-3 text-sm text-slate-500 lg:block lg:truncate">
                                      <span className="shrink-0 font-medium text-slate-400 lg:hidden">
                                        Folder
                                      </span>
                                      <span className="min-w-0 truncate">
                                        {file.parentDirectoryName.startsWith(
                                          "root",
                                        )
                                          ? "Home"
                                          : file.parentDirectoryName}
                                      </span>
                                    </p>
                                    <p className="flex min-w-0 items-center justify-between gap-3 text-sm text-slate-500 lg:block lg:truncate lg:text-right">
                                      <span className="shrink-0 font-medium text-slate-400 lg:hidden">
                                        Updated
                                      </span>
                                      <span className="min-w-0 truncate">
                                        {file.updatedAt
                                          ? new Date(
                                              file.updatedAt,
                                            ).toLocaleString()
                                          : "-"}
                                      </span>
                                    </p>
                                    <div className="hidden text-right text-slate-400 lg:block">
                                      ⋯
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm text-slate-500">
                                  Keep the original and remove other copies
                                </p>
                                <div className="grid gap-3 sm:flex sm:shrink-0">
                                  <button
                                    type="button"
                                    disabled={selectedFileIds.length === 0}
                                    onClick={() =>
                                      handleDuplicateAction(
                                        moveDuplicatesToTrash,
                                      )
                                    }
                                    className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    Move to Trash
                                  </button>
                                  <button
                                    type="button"
                                    disabled={selectedFileIds.length === 0}
                                    onClick={() =>
                                      handleDuplicateAction(
                                        deleteAllDuplicates,
                                      )
                                    }
                                    className="rounded-md bg-violet-600 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    Delete Duplicates
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </DriveUILayout>
  );
};
