import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaHome, FaExclamationCircle } from "react-icons/fa";
import CreateDirectoryModal from "./components/CreateDirectoryModal";
import RenameModal from "./components/RenameModal";
import ShareModal from "./components/ShareModal";
import DirectoryList from "./components/DirectoryList";
import DriveUILayout from "./components/DriveUILayout";
import EmptyFolder from "./components/EmptyFolder";
import { useDrive } from "./context/driveContext";
import {
  renameFile,
  temporaryDeleteFile,
  viewFile,
  markUploadComplete,
  fileUploadFail,
} from "./api/fileApi.js";
import "../src/DirectoryView.css";
import useCloseContextMenu from "./hooks/useCloseContextMenu.js";
import { renameDirectory, temporaryDeleteFolder } from "./api/directoryApi.js";
import { DriveBtn } from "./components/MobileDriveButton.jsx";
import { useAuth } from "./context/authContext.jsx";
import { getSignedURL } from "./api/fileApi.js";

const BASE_URL = "http://localhost:4000";
const HTTP_HEADER_SAFE_VALUE = /^[\t\x20-\x7e\x80-\xff]*$/;

function getHeaderSafeName(name) {
  const value = String(name ?? "");
  return HTTP_HEADER_SAFE_VALUE.test(value) ? value : encodeURIComponent(value);
}

function ErrorBanner({ title = "Error", message, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // trigger enter animation
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      role="alert"
      className={`upload-warning-banner transform transition-all duration-300 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      }`}
    >
      <div className="upload-warning-icon-wrap">
        <FaExclamationCircle
          className="upload-warning-icon"
          aria-hidden="true"
        />
      </div>
      <div className="upload-warning-content">
        <p className="upload-warning-title">{title}</p>
        <p className="upload-warning-text">{message}</p>
      </div>
      <div className="upload-warning-actions">
        <button
          onClick={onClose}
          className="ml-3 px-3 py-1 rounded-md bg-white/[.05] text-sm text-slate-200 hover:bg-white/[.08] transition"
          aria-label="Dismiss"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

function DirectoryView() {
  const { currentUser, authLoading } = useAuth();
  const { dirId } = useParams();
  const navigate = useNavigate();
  const {
    getDirectoryItems,
    alldirectories,
    allFiles,
    directoriesList,
    filesList,
    setFilesList,
    setDirectoriesList,
  } = useDrive();

  const [isDirectoryLoading, setIsDirectoryLoading] = useState(false);

  //*  Modal states
  const [showCreateDirModal, setShowCreateDirModal] = useState(false);
  const [newDirname, setNewDirname] = useState("New Folder");

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameType, setRenameType] = useState(null); // "directory" or "file"
  const [renameId, setRenameId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [shareItem, setShareItem] = useState(null);
  //* for creating folderbreadcumbs

  const [folderBreadcrumbs, setFolderBreadcrumbs] = useState([]);
  console.log(folderBreadcrumbs);
  //* Uploading states
  const fileInputRef = useRef(null);
  const uploadQueueRef = useRef([]);
  const enqueueUploadItemsRef = useRef(null);
  const uploadInProgressRef = useRef(false);
  const uploadFileIdMapRef = useRef({});
  const [, setUploadQueue] = useState([]); // queued items to upload
  const [uploadXhrMap, setUploadXhrMap] = useState({}); // track XHR per item
  const [progressMap, setProgressMap] = useState({}); // track progress per item
  const [isUploading, setIsUploading] = useState(false); // indicates if an upload is in progress
  const [uploadError, setUploadError] = useState("");

  //* Context menu
  const [activeContextMenu, setActiveContextMenu] = useState(null);

  //* showing drive file
  const [showDriveModal, setShowDriveModal] = useState(false);

  //* fro filtering itmems on UI

  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!uploadError) {
      return;
    }

    const timer = setTimeout(() => {
      setUploadError("");
    }, 3500);

    return () => clearTimeout(timer);
  }, [uploadError]);

  /**
   * Fetch directory contents
   */
  const getLoader = useCallback(async () => {
    try {
      setIsDirectoryLoading(true);
      await getDirectoryItems(dirId);
    } catch (err) {
      if (err.status === 401) {
        navigate("/login");
        return;
      }
    } finally {
      setIsDirectoryLoading(false);
    }
  }, [dirId, getDirectoryItems, navigate]);

  useEffect(() => {
    getLoader();
    // Reset context menu
    setActiveContextMenu(null);
  }, [authLoading, currentUser, dirId, getLoader]);

  // Keep breadcrumbs in sync with current route (includes browser back/forward)
  useEffect(() => {
    async function fetchFolderBreadcrumbPath() {
      if (!dirId) {
        setFolderBreadcrumbs([]);
        return;
      }

      try {
        const res = await fetch(
          `${BASE_URL}/directory/${dirId}/breadcumbpath`,
          {
            credentials: "include",
          },
        );

        if (res.ok) {
          const data = await res.json();
          setFolderBreadcrumbs(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.log(err.message);
      }
    }

    fetchFolderBreadcrumbPath();
  }, [currentUser, dirId]);

  //* Click row to open directory or file

  const handleRowClick = useCallback(
    async (type, id, name) => {
      if (type === "directory") {
        // Optimistic UI update so navigation feels immediate
        setFolderBreadcrumbs((prev) => [...prev, { name, id }]);
        navigate(`/directory/${id}`);
      } else {
        const { url } = await viewFile(id);
        window.open(url, "_blank");
      }
    },
    [navigate],
  );

  //* Select multiple files to upload

  const handleFileSelect = useCallback(
    (e) => {
      console.log("select file function is running");
      const selectedFiles = Array.from(e.target.files);
      console.log("selectedFiles", selectedFiles);
      if (selectedFiles.length === 0) return;
      const availableStorage =
        currentUser.maxStorageInBytes - currentUser.usedStorage;
      console.log("availableStorage", availableStorage);
      if (availableStorage < 0) { 
        if(currentUser.status == "halt")
          setUploadError("Storage limit exceeded. Please resume your subscription to continue uploading files.");
        else
          setUploadError("Storage limit exceeded.please Upgrade plan to use more storage");
        return;
      }
      const validFiles = [];
      const oversizedFiles = [];

      let totalSize = 0;

       selectedFiles.forEach((file) => {
        if (totalSize + file.size > availableStorage) {
          oversizedFiles.push(file);
        } else {
          validFiles.push(file);
          totalSize += file.size;
        }
      });

      // Show error for oversized files
      if (oversizedFiles.length) {
        const fileNames = oversizedFiles.map((f) => f.name).join(", ");
        setUploadError(`Selected files ${fileNames} exceed available storage`);
      }

      // Create temp items
      const newItems = validFiles.map((file) => {
        console.log("file", file);
        return {
          file,
          name: file.name,
          size: file.size,
          contentType: file.type,
          id: `temp-${Date.now()}-${Math.random()}`,
          isUploading: false,
        };
      });

      if (!newItems.length) return;
      console.log("newItems", newItems);
      // Update file list
      setFilesList((prev) => [...newItems, ...prev]);

      // ✅ Batch progress update (single render)
      const newProgress = {};
      newItems.forEach((item) => {
        newProgress[item.id] = 0;
      });

      setProgressMap((prev) => ({
        ...prev,
        ...newProgress,
      }));

      enqueueUploadItemsRef.current?.(newItems, dirId);

      // Reset input
      e.target.value = "";
    },
    [
      currentUser.maxStorageInBytes,
      currentUser.status,
      currentUser.usedStorage,
      dirId,
      setFilesList,
    ],
  );

  function enqueueUploadItems(items, activeDirId = dirId) {
    uploadQueueRef.current = [...uploadQueueRef.current, ...items];
    setUploadQueue(uploadQueueRef.current);

    if (uploadInProgressRef.current) {
      return;
    }

    uploadInProgressRef.current = true;
    setIsUploading(true);
    processUploadQueue(activeDirId);
  }

  /**
   * Upload items in queue one by one
   */
  async function processUploadQueue(activeDirId = dirId) {
    if (uploadQueueRef.current.length === 0) {
      // No more items to upload
      uploadInProgressRef.current = false;
      setIsUploading(false);
      setUploadQueue([]);
      setTimeout(() => {
        getDirectoryItems(activeDirId);
      }, 1000);
      return;
    }

    // Take first item
    let fileId; // Declare here so it's accessible in catch block
    let currentItem;
    try {
      [currentItem] = uploadQueueRef.current;
      const restQueue = uploadQueueRef.current.slice(1);
      console.log("currentItem ..................", currentItem);
      const result = await getSignedURL({
        name: currentItem.name,
        contentType: currentItem.contentType || currentItem.file.type,
        size: currentItem.size,
        parentDirId: dirId || "",
      });
      fileId = result.fileId;
      const uploadUrl = result.uploadUrl;
      console.log(uploadUrl);
      uploadFileIdMapRef.current[currentItem.id] = fileId;
      uploadQueueRef.current = restQueue;
      setUploadQueue(restQueue);
      // Mark it as isUploading: true
      setFilesList((prev) =>
        prev.map((f) =>
          f.id === currentItem.id ? { ...f, isUploading: true } : f,
        ),
      );

      // Start upload
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl, true);
      // The browser owns Content-Length; only send the content type expected by the signed URL.
      xhr.setRequestHeader(
        "Content-Type",
        currentItem.file.type || "application/octet-stream",
      );
      xhr.upload.addEventListener("progress", (evt) => {
        if (evt.lengthComputable) {
          const progress = (evt.loaded / evt.total) * 100;
          console.log("progresss", progress);
          setProgressMap((prev) => ({ ...prev, [currentItem.id]: progress }));
        }
      });

      xhr.addEventListener("load", async () => {
        if (xhr.status == 200) {
          //* 🔥 Notify backend upload completed
          await markUploadComplete({ fileId });
        } else {
          await fileUploadFail({ fileId });
        }
        delete uploadFileIdMapRef.current[currentItem.id];
        processUploadQueue(activeDirId);
      });

      xhr.addEventListener("error", async () => {
        await fileUploadFail({ fileId });
        delete uploadFileIdMapRef.current[currentItem.id];
      });

      xhr.addEventListener("abort", () => {
        processUploadQueue(activeDirId);
      });

      // If user cancels, we also remove from the queue
      setUploadXhrMap((prev) => ({ ...prev, [currentItem.id]: xhr }));
      xhr.send(currentItem.file);
    } catch (err) {
      console.log("error aa gya bhai");
      console.log(err.message);
      await fileUploadFail({ fileId });
      if (currentItem?.id) {
        delete uploadFileIdMapRef.current[currentItem.id];
      }
      processUploadQueue(activeDirId);
    }
  }

  enqueueUploadItemsRef.current = enqueueUploadItems;

  //* Cancel an in-progress upload
  const handleCancelUpload = useCallback(
    (tempId) => {
      const xhr = uploadXhrMap[tempId];
      const fileId = uploadFileIdMapRef.current[tempId];

      if (xhr) xhr.abort();

      if (fileId) {
        fileUploadFail({ fileId }).catch((err) => {
          console.log(err.message);
        });
        delete uploadFileIdMapRef.current[tempId];
      }

      // Remove it from queue if it’s still there
      uploadQueueRef.current = uploadQueueRef.current.filter(
        (item) => item.id !== tempId,
      );
      setUploadQueue((prev) => prev.filter((item) => item.id !== tempId));

      // Remove from the filesList
      setFilesList((prev) => prev.filter((f) => f.id !== tempId));

      // Remove from progressMap
      setProgressMap((prev) => {
        const { [tempId]: _, ...rest } = prev;
        return rest;
      });

      // Remove from Xhr map
      setUploadXhrMap((prev) => {
        const copy = { ...prev };
        delete copy[tempId];
        return copy;
      });
    },
    [setFilesList, uploadXhrMap],
  );

  //* Create a directory

  async function handleCreateDirectory(e) {
    e.preventDefault();
    await fetch(`${BASE_URL}/directory/${dirId || ""}`, {
      method: "POST",
      headers: {
        dirname: getHeaderSafeName(newDirname),
      },
      credentials: "include",
    });
    setNewDirname("New Folder");
    setShowCreateDirModal(false);
    getDirectoryItems(dirId);
  }

  const handleDriveFiles = useCallback(
    async (docs, accessToken) => {
      console.log("Drive files:", docs);
      console.log("accessToken:", accessToken);

      if (!docs || docs.length === 0) return;

      const newItems = [];

      for (const driveFile of docs) {
        try {
          // 1️⃣ Decide download URL
          let downloadUrl;

          if (driveFile.mimeType === "application/vnd.google-apps.document") {
            // Google Doc → export as PDF
            downloadUrl = `https://www.googleapis.com/drive/v3/files/${driveFile.id}/export?mimeType=application/pdf`;
          } else {
            // Normal file (pdf, image, zip, etc.)
            downloadUrl = `https://www.googleapis.com/drive/v3/files/${driveFile.id}?alt=media`;
          }

          // 2️⃣ Download file from Google Drive
          const res = await fetch(downloadUrl, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (!res.ok) {
            console.error("Failed to download:", driveFile.name);
            continue;
          }

          // 3️⃣ Convert response → Blob
          const blob = await res.blob();

          // 4️⃣ Decide final filename
          const fileName = driveFile.mimeType.startsWith(
            "application/vnd.google-apps",
          )
            ? `${driveFile.name}.pdf`
            : driveFile.name;

          // 5️⃣ Convert Blob → File (IMPORTANT)
          const file = new File([blob], fileName, { type: blob.type });

          // 6️⃣ Create SAME temp item structure as normal upload
          const tempId = `temp-${Date.now()}-${Math.random()}`;

          newItems.push({
            file, // 👈 SAME field your uploader expects
            name: file.name,
            id: tempId,
            isUploading: false,
          });
        } catch (err) {
          console.error("Error handling Drive file:", driveFile.name, err);
        }
      }

      if (newItems.length === 0) return;

      // 7️⃣ Show files immediately in UI
      setFilesList((prev) => [...newItems, ...prev]);

      // 8️⃣ Initialize progress for each file
      newItems.forEach((item) => {
        setProgressMap((prev) => ({ ...prev, [item.id]: 0 }));
      });

      // 9️⃣ Add to SAME upload queue
      enqueueUploadItemsRef.current?.(newItems, dirId);
    },
    [dirId, setFilesList],
  );

  /**
   * Rename
   */
  const openRenameModal = useCallback((type, id, currentName) => {
    setActiveContextMenu(null);
    setRenameType(type);
    setRenameId(id);
    setRenameValue(currentName);
    setShowRenameModal(true);
  }, []);

  const openShareModal = useCallback((item) => {
    setActiveContextMenu(null);
    setShareItem(item);
  }, []);

  const handleRenameSubmit = useCallback(
    async (e) => {
      console.log("rename function is running");
      e.preventDefault();
      try {
        if (renameType === "file") {
          await renameFile(renameId, { name: renameValue });
          setFilesList((prev) =>
            prev.map((File) =>
              File._id === renameId ? { ...File, name: renameValue } : File,
            ),
          );
        } else {
          console.log("directory function is running");
          await renameDirectory(renameId, { name: renameValue });
          console.log("renameId", renameId);
          setDirectoriesList((prev) =>
            prev.map((dir) =>
              dir._id === renameId ? { ...dir, name: renameValue } : dir,
            ),
          );
        }
      } catch (err) {
        console.log(err.message);
      }

      setShowRenameModal(false);
      setRenameValue("");
      setRenameType(null);
      setRenameId(null);
    },
    [renameId, renameType, renameValue, setDirectoriesList, setFilesList],
  );

  /***      Context Menu              **/

  const handleContextMenu = useCallback((e, id) => {
    e.stopPropagation();
    setActiveContextMenu((prev) => (prev === id ? null : id));
  }, []);

  const closeMenu = useCallback(() => {
    setActiveContextMenu(null);
  }, []);

  useCloseContextMenu(setActiveContextMenu);

  // Combine directories & files into one list for rendering
  const combinedItems = useMemo(
    () => [
      ...directoriesList.map((d) => ({ ...d, isDirectory: true })),
      ...filesList.map((f) => ({ ...f, isDirectory: false })),
    ],
    [directoriesList, filesList],
  );

  const handleBreadcrumbClick = useCallback(
    async (index) => {
      if (index === -1) {
        // Go back to root
        navigate("/");
        setFolderBreadcrumbs([]);
      } else {
        const breadcrumb = folderBreadcrumbs[index];
        console.log("when i click on handle", breadcrumb);
        setFolderBreadcrumbs(folderBreadcrumbs.slice(0, index + 1));
        navigate(`/directory/${breadcrumb.id}`);
      }
    },
    [folderBreadcrumbs, navigate],
  );

  const handleDeleteFile = useCallback(
    async (fileId) => {
      try {
        await temporaryDeleteFile(fileId);
        setFilesList((prev) => {
          return prev.filter((file) => file._id != fileId);
        });
      } catch (err) {
        console.log(err.message);
      }
    },
    [setFilesList],
  );

  const handleDeleteDirectory = useCallback(
    async (dirId) => {
      try {
        await temporaryDeleteFolder(dirId);
        setDirectoriesList((prev) => {
          return prev.filter((dir) => dir._id != dirId);
        });
      } catch (err) {
        console.log(err.message);
      }
    },
    [setDirectoriesList],
  );

  const openCreateFolderModal = useCallback(() => {
    setShowCreateDirModal(true);
  }, []);

  const openUploadFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const openDriveModal = useCallback(() => {
    setShowDriveModal(true);
  }, []);

  const headerProps = useMemo(
    () => ({
      onCreateFolderClick: openCreateFolderModal,
      onUploadFilesClick: openUploadFilePicker,
      fileInputRef,
      handleFileSelect,
      setShowDriveModal,
      showDriveModal,
      onFilesPicked: handleDriveFiles,
    }),
    [
      handleDriveFiles,
      handleFileSelect,
      openCreateFolderModal,
      openUploadFilePicker,
      showDriveModal,
    ],
  );

  useEffect(() => {
    if (!query) {
      setFilesList(allFiles);
      setDirectoriesList(alldirectories);
    }
    setFilesList((prev) => {
      return prev.filter(({ name }) =>
        name.toLowerCase().includes(query.toLowerCase()),
      );
    });
    setDirectoriesList((prev) => {
      return prev.filter(({ name }) =>
        name.toLowerCase().includes(query.toLowerCase()),
      );
    });
  }, [allFiles, alldirectories, query, setDirectoriesList, setFilesList]);

  return (
    <DriveUILayout
      active="my-drive"
      headerMode="drive"
      query={query}
      setQuery={setQuery}
      headerProps={headerProps}
    >
      <div className="breadcrumb-container">
        <button
          className="breadcrumb-link breadcrumb-link-home"
          onClick={() => handleBreadcrumbClick(-1)}
        >
          <FaHome className="breadcrumb-home-icon" aria-hidden="true" />
          <span>Home</span>
        </button>
        {folderBreadcrumbs.map((breadcrumb, index) => (
          <div key={breadcrumb.id} className="breadcrumb-item">
            <span className="breadcrumb-separator">/</span>
            <button
              className="breadcrumb-link"
              onClick={() => handleBreadcrumbClick(index)}
            >
              {breadcrumb.name}
            </button>
          </div>
        ))}
      </div>

      {uploadError && (
        <ErrorBanner
          title="Upload limit reached"
          message={uploadError}
          onClose={() => setUploadError("")}
        />
      )}

      {/* Create Directory Modal */}
      {showCreateDirModal && (
        <CreateDirectoryModal
          newDirname={newDirname}
          setNewDirname={setNewDirname}
          onClose={() => setShowCreateDirModal(false)}
          onCreateDirectory={handleCreateDirectory}
        />
      )}

      {/* Rename Modal */}
      {showRenameModal && (
        <RenameModal
          renameType={renameType}
          renameValue={renameValue}
          setRenameValue={setRenameValue}
          onClose={() => setShowRenameModal(false)}
          onRenameSubmit={handleRenameSubmit}
        />
      )}

      {shareItem && (
        <ShareModal
          item={shareItem}
          onClose={() => setShareItem(null)}
        />
      )}

      {/* If folder is loading */}
      {isDirectoryLoading ? (
        <p className="no-data-message">Loading folder...</p>
      ) : combinedItems.length === 0 ? (
        <EmptyFolder
          onUpload={openUploadFilePicker}
          onCreateFolder={openCreateFolderModal}
        />
      ) : (
        <DirectoryList
          items={combinedItems}
          handleRowClick={handleRowClick}
          activeContextMenu={activeContextMenu}
          handleContextMenu={handleContextMenu}
          handleDeleteFile={handleDeleteFile}
          handleDeleteDirectory={handleDeleteDirectory}
          isUploading={isUploading}
          progressMap={progressMap}
          handleCancelUpload={handleCancelUpload}
          openRenameModal={openRenameModal}
          openShareModal={openShareModal}
          closeMenu={closeMenu}
        />
      )}

      {!showCreateDirModal && !showRenameModal && !showDriveModal && !shareItem && (
        <DriveBtn
          onCreateFolder={openCreateFolderModal}
          onUploadFiles={openUploadFilePicker}
          onOpenDrive={openDriveModal}
        />
      )}
    </DriveUILayout>
  );
}

export default DirectoryView;
