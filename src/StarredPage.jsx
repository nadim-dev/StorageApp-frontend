import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaFileAlt, FaStar, FaRegStar, FaClock, FaFolder } from "react-icons/fa";
import { BsThreeDotsVertical } from "react-icons/bs";
import DriveUILayout from "./components/DriveUILayout";
import ContextMenu from "./components/ContextMenu";
import RenameModal from "./components/RenameModal";
import ShareModal from "./components/ShareModal";
import Toast from "./components/Toast";
import { renderFileIcon } from "./components/common/getFileIcon";
import { formatDate } from "./utils/formatDate";
import { formatFileSize } from "./utils/formatFile";
import { getStarredResources, renameFile, starredFile, temporaryDeleteFile, viewFile } from "./api/fileApi";
import { renameDirectory, starredDirectory, temporaryDeleteFolder } from "./api/directoryApi";
import useCloseContextMenu from "./hooks/useCloseContextMenu";
import useToast from "./hooks/useToast";

import "./DirectoryView.css";
import "./StarredPage.css";

function StarredPage() {
  const navigate = useNavigate();
  const [starredItems, setStarredItems] = useState([]);
  const [allStarredItems,setallStarredItems]=useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [query,setQuery]=useState("");
  const [activeContextMenu, setActiveContextMenu] = useState(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameType, setRenameType] = useState(null);
  const [renameId, setRenameId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [shareItem, setShareItem] = useState(null);
  const { toast, showToast, hideToast } = useToast();


  const fetchStarredResources = useCallback(async () => {
    console.log("fetchStarredResources function is running");
    setIsLoading(true);
    setError("");
    try {
      const starredResources= await getStarredResources();
      console.log("starred resources",starredResources);
      setStarredItems(starredResources);
      setallStarredItems(starredResources)
    } catch (err) {
      if (err.status== 401) {
        navigate("/logout");
      }
      setError("Unable to load starred resources right now.");
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchStarredResources();
  }, []);

  const handleUnstar = async (itemId, isDirectory) => {
    const previousItems = starredItems;
    const previousAllItems = allStarredItems;
    setStarredItems((prev) => prev.filter((item) => (item._id || item.id) !== itemId));
    setallStarredItems((prev) => prev.filter((item) => (item._id || item.id) !== itemId));

    try {
      if (isDirectory) {
        await starredDirectory(itemId, { starred: false });
      } else {
        await starredFile(itemId, { starred: false });
      }
    } catch (err) {
      setStarredItems(previousItems);
      setallStarredItems(previousAllItems);
    }
  };

  const openRenameModal = useCallback((type, id, currentName) => {
    setActiveContextMenu(null);
    setRenameType(type);
    setRenameId(id);
    setRenameValue(currentName);
    setShowRenameModal(true);
  }, []);

  const handleRenameSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!renameId) return;

    try {
      if (renameType === "directory") {
        await renameDirectory(renameId, renameValue);
      } else {
        await renameFile(renameId, renameValue);
      }

      const updateName = (items) =>
        items.map((item) =>
          (item._id || item.id) === renameId ? { ...item, name: renameValue } : item
        );

      setStarredItems(updateName);
      setallStarredItems(updateName);
    } catch (err) {
      console.log(err.message);
    }

    setShowRenameModal(false);
    setRenameType(null);
    setRenameId(null);
    setRenameValue("");
  }, [renameId, renameType, renameValue]);

  const openShareModal = useCallback((item) => {
    setActiveContextMenu(null);
    setShareItem(item);
  }, []);

  const handlePublicLinkCopied = useCallback(() => {
    showToast("Public link copied to clipboard", {
      title: "Link copied",
      type: "success",
    });
  }, [showToast]);

  const handleDeleteFile = useCallback(async (fileId) => {
    try {
      await temporaryDeleteFile(fileId);
      setStarredItems((prev) => prev.filter((item) => (item._id || item.id) !== fileId));
      setallStarredItems((prev) => prev.filter((item) => (item._id || item.id) !== fileId));
    } catch (err) {
      console.log(err.message);
    }
  }, []);

  const handleDeleteDirectory = useCallback(async (dirId) => {
    try {
      await temporaryDeleteFolder(dirId);
      setStarredItems((prev) => prev.filter((item) => (item._id || item.id) !== dirId));
      setallStarredItems((prev) => prev.filter((item) => (item._id || item.id) !== dirId));
    } catch (err) {
      console.log(err.message);
    }
  }, []);

  const handleContextMenu = useCallback((e, id) => {
    e.stopPropagation();
    setActiveContextMenu((prev) => (prev === id ? null : id));
  }, []);

  const closeMenu = useCallback(() => {
    setActiveContextMenu(null);
  }, []);

  useCloseContextMenu(setActiveContextMenu);

  useEffect(()=>{
  if(!query)
    setStarredItems(allStarredItems)
  setStarredItems((prev)=>{
    return  prev.filter(({name})=>name.toLowerCase().includes(query.toLowerCase()))
  })
},[query])


function handleOpenResource(item) {
    if (!item._id) return;
    const resourceId =item._id;
    if (item.isDirectory) {
      navigate(`/directory/${resourceId}`);
      return;
    }
    viewFile(resourceId);
  }

  const folders = starredItems.filter((item) => item.isDirectory);
  const files = starredItems.filter((item) => !item.isDirectory);
  
  return (
    <DriveUILayout active="starred" headerMode="trash" query={query} setQuery={setQuery}>
      <section className="starred-shell">
        <div className="starred-head">
          <div className="starred-title-wrap">
            <p className="starred-kicker">
              <FaStar />
              <span>Favorites</span>
            </p>
            <h2>Quick access to your starred files and folders.</h2>
          </div>
          <div className="starred-summary">
            <span>{folders.length} folders</span>
            <span>{files.length} files</span>
            <strong>{starredItems.length} starred</strong>
          </div>
        </div>

        {error && <p className="starred-message starred-message-error">{error}</p>}

        {isLoading ? (
          <div className="starred-empty">
            <FaClock className="starred-empty-icon" />
            <h3>Loading your starred resources...</h3>
          </div>
        ) : starredItems.length === 0 ? (
          <div className="starred-empty">
            <FaRegStar className="starred-empty-icon" />
            <h3>No starred resources yet</h3>
            <p>Mark important folders/files with a star and they will appear here.</p>
          </div>
        ) : (
          <div className="directory-content-board">
            <section className="resource-section">
              <div className="resource-section-head">
                <h2><FaFolder /> Folders</h2>
                <span>{folders.length}</span>
              </div>
              {folders.length === 0 ? (
                <p className="resource-empty">No starred folders yet.</p>
              ) : (
                <div className="directory-list directory-grid folders-grid">
                  {folders.map((item) => (
                    <div
                      key={item._id || item.id}
                      className="list-item hoverable-row folder-card group"
                      onClick={() => handleOpenResource(item)}
                    >
                      <div className="item-card-top">
                        <div className="item-icon-wrap">
                          <FaFolder className="folder-icon" />
                        </div>
                        <div className="item-top-actions">
                          <button
                            type="button"
                            className="item-star-toggle is-active"
                            aria-label="Remove from starred"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnstar(item._id, true);
                            }}
                          >
                            <FaStar className="item-star-icon" />
                          </button>
                          <button
                            className="context-menu-trigger"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleContextMenu(e, item._id);
                            }}
                            type="button"
                          >
                            <BsThreeDotsVertical />
                          </button>
                          {activeContextMenu === item._id && (
                            <ContextMenu
                              item={item}
                              closeMenu={closeMenu}
                              openRenameModal={openRenameModal}
                              handleDeleteFile={handleDeleteFile}
                              handleDeleteDirectory={handleDeleteDirectory}
                              openShareModal={openShareModal}
                              onPublicLinkCopied={handlePublicLinkCopied}
                            />
                          )}
                        </div>
                      </div>
                      <div className="item-meta">
                        <span className="item-name" title={item.name}>
                          {item.name}
                        </span>
                        <span className="item-subline">Directory</span>
                        <span className="item-submeta">
                          Folder | Updated{" "}
                          {item.updatedAt || item.createdAt
                            ? formatDate(item.updatedAt || item.createdAt)
                            : "recently"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="resource-section">
              <div className="resource-section-head">
                <h2><FaFileAlt /> Files</h2>
                <span>{files.length}</span>
              </div>
              {files.length === 0 ? (
                <p className="resource-empty">No starred files yet.</p>
              ) : (
                <div className="directory-list directory-grid files-grid">
                  {files.map((item) => (
                    <div
                      key={item._id }
                      className="list-item hoverable-row file-card group"
                      onClick={() => handleOpenResource(item)}
                    >
                      <div className="item-card-top">
                        <div className="item-icon-wrap">{renderFileIcon(item.extension)}</div>
                        <div className="item-top-actions">
                          <button
                            type="button"
                            className="item-star-toggle is-active"
                            aria-label="Remove from starred"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnstar(item._id || item.id, false);
                            }}
                          >
                            <FaStar className="item-star-icon" />
                          </button>
                          <button
                            className="context-menu-trigger"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleContextMenu(e, item._id || item.id);
                            }}
                            type="button"
                          >
                            <BsThreeDotsVertical />
                          </button>
                          {activeContextMenu === (item._id || item.id) && (
                            <ContextMenu
                              item={item}
                              closeMenu={closeMenu}
                              openRenameModal={openRenameModal}
                              handleDeleteFile={handleDeleteFile}
                              handleDeleteDirectory={handleDeleteDirectory}
                              openShareModal={openShareModal}
                              onPublicLinkCopied={handlePublicLinkCopied}
                            />
                          )}
                        </div>
                      </div>
                      <div className="item-meta">
                        <span className="item-name" title={item.name}>
                          {item.name}
                        </span>
                        <span className="item-subline">{item.extension ? `${item.extension} file` : "File"}</span>
                        <span className="item-submeta">
                          {formatFileSize(Number(item?.size) || 0)} | Updated{" "}
                          {item.updatedAt || item.createdAt
                            ? formatDate(item.updatedAt || item.createdAt)
                            : "recently"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
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
        <Toast toast={toast} onClose={hideToast} />
      </section>
    </DriveUILayout>
  );
}

export default StarredPage;
