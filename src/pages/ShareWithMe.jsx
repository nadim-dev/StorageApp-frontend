import React, { useEffect, useMemo, useState } from "react";
import { FaCalendarAlt, FaChevronRight, FaDownload, FaEllipsisV, FaFolder, FaHome, FaPen, FaList, FaThLarge } from "react-icons/fa";
import DriveUILayout from "@/components/DriveUILayout.jsx";
import { renderFileIcon } from "@/components/common/getFileIcon.jsx";
import {downloadSharedWithMeFile,getFilesSharedWithMe,renameSharedWithMeResource,viewSharedFile,viewShareWithMedDirectory} from "@/api/shareApi";
import { formatDate, formatShortDate } from "@/utils/formatDate";
import RenameModal from "@/components/RenameModal.jsx";
import "../DirectoryView.css";


function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";
}

function formatResourceType(type = "") {
  if (!type) return "Resource";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function getItemType(item) {
  return item.resourceType || item.type || (item.extension ? "file" : "directory");
}

function getItemId(item) {
  return item.resourceId || item._id || item.id;
}

function getItemName(item) {
  return item.resourceName || item.name || "Untitled resource";
}

function isDirectoryItem(item) {
  const type = getItemType(item);
  return type === "directory" || type === "folder";
}

function getFolderContents(responseData) {
  if (Array.isArray(responseData)) return responseData;
  return responseData?.items || responseData?.resources || responseData?.data || [];
}

function getErrorMessage(err, fallback) {
  return err?.data?.message || err?.response?.data?.message || err?.message || fallback;
}

function formatSharedSubtitle(item) {
  if (isDirectoryItem(item)) {
    return "Folder";
  }

  const extension = item.extension?.replace(".", "").toUpperCase();
  return extension ? `${extension} file` : "File";
}

function SharedResourceIcon({ item }) {
  if (isDirectoryItem(item)) {
    return <FaFolder className="shared-folder-icon" />;
  }

  return renderFileIcon(item.extension);
}

export const SharedWithMe = () => {
  const [query, setQuery] = useState("");
  const [sharedItems, setSharedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [actioningItemId] = useState(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameType, setRenameType] = useState(null); // "directory" or "file"
  const [renameId, setRenameId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [folderTrail, setFolderTrail] = useState([]);
  const [folderItems, setFolderItems] = useState([]);
  const [isFolderLoading, setIsFolderLoading] = useState(false);

  useEffect(() => {
    let ignore = false;

    const fetchSharedFiles = async () => {
      try {
        setIsLoading(true);
        setError("");
        const data = await getFilesSharedWithMe();
         
        if (!ignore) {
          setSharedItems(getFolderContents(data));
        }
      } catch (err) {
        if (!ignore) {
          setError(
            getErrorMessage(err, "Unable to load files shared with you."),
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    fetchSharedFiles();

    return () => {
      ignore = true;
    };
  }, []);

  const openRenameModal = (type, id, currentName) => {
      setRenameType(type);
      setRenameId(id);
      setRenameValue(currentName);
      setShowRenameModal(true);
      setOpenMenuId(null);
  };

  const handleRenameSubmit=async (e)=>{
    e.preventDefault();
    console.log("handle rename submit function is running");
    try{
    const data=await renameSharedWithMeResource({renameId,renameType,renameValue});
    if(data.message){
      setSharedItems((prev) =>
        prev.map((item) =>
       item.resourceId === renameId? { ...item, resourceName: renameValue }: item)
      );
    }
    setRenameType(null);
    setRenameValue(null);
    setShowRenameModal(false);
    setRenameId(null);

    }catch(err){
      console.log(err.message);
    }
    
  }

  useEffect(() => {
    const closeOpenMenu = () => setOpenMenuId(null);

    document.addEventListener("click", closeOpenMenu);

    return () => {
      document.removeEventListener("click", closeOpenMenu);
    };
  }, []);

  const openFile=async (item)=>{
    const {url}=await viewSharedFile(getItemId(item));
    window.open(url, "_blank");
  }

  const openDirectory = async (item, replaceTrailIndex = null) => {
    try {
      setIsFolderLoading(true);
      setError("");
      setOpenMenuId(null);
      const itemId = getItemId(item);
      const data = await viewShareWithMedDirectory(itemId);
      setFolderItems(getFolderContents(data));
      setFolderTrail((prev) => {
        const nextCrumb = { id: itemId, name: getItemName(item) };

        if (replaceTrailIndex !== null) {
          return [...prev.slice(0, replaceTrailIndex + 1)];
        }

        return [...prev, nextCrumb];
      });
    } catch (err) {
      setError(
        getErrorMessage(err, "Unable to open this shared folder."),
      );
    } finally {
      setIsFolderLoading(false);
    }
  };

  const handleBreadcrumbClick = async (index) => {
    setOpenMenuId(null);

    if (index === -1) {
      setFolderTrail([]);
      setFolderItems([]);
      return;
    }

    const crumb = folderTrail[index];
    await openDirectory({ resourceId: crumb.id, resourceName: crumb.name, resourceType: "directory" }, index);
  };

  const filteredItems = useMemo(() => {
    const search = query.trim().toLowerCase();
    const sourceItems = folderTrail.length ? folderItems : sharedItems;

    if (!search) {
      return sourceItems;
    }

    return sourceItems.filter((item) => {
      const owner = item.ownerId || {};
      return [getItemName(item), item.resourceName, item.name, getItemType(item), item.extension, item.permission, owner.name, owner.email]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
    });
  }, [folderItems, folderTrail.length, query, sharedItems]);

  const isInsideFolder = folderTrail.length > 0;
  const isCurrentLoading = isLoading || isFolderLoading;
  const totalItemsCount = isInsideFolder ? folderItems.length : sharedItems.length;

  return (
    <DriveUILayout
      active="shared-with-me"
      headerMode="shared-with-me"
      query={query}
      setQuery={setQuery}
    >
      <section className="shared-page">
        <div className="shared-page-head">
          <div>
            <h1>{isInsideFolder ? folderTrail.at(-1)?.name : "Shared with me"}</h1>
            <p>
              {isInsideFolder
                ? "Files and folders inside this shared folder."
                : "Files and folders that others have shared with you."}
            </p>
          </div>
          <div className="shared-view-actions" aria-label="View controls">
            <button
              type="button"
              className={`shared-view-button ${viewMode === "list" ? "is-active" : ""}`}
              title="List view"
              aria-pressed={viewMode === "list"}
              onClick={() => setViewMode("list")}
            >
              <FaList />
            </button>
            <button
              type="button"
              className={`shared-view-button ${viewMode === "grid" ? "is-active" : ""}`}
              title="Grid view"
              aria-pressed={viewMode === "grid"}
              onClick={() => setViewMode("grid")}
            >
              <FaThLarge />
            </button>
          </div>
        </div>

        <nav className="shared-breadcrumbs" aria-label="Shared folder breadcrumbs">
          <button
            type="button"
            className="shared-breadcrumb-link"
            onClick={() => handleBreadcrumbClick(-1)}
          >
            <FaHome aria-hidden="true" />
            <span>Shared with me</span>
          </button>
          {folderTrail.map((crumb, index) => (
            <React.Fragment key={crumb.id}>
              <FaChevronRight className="shared-breadcrumb-separator" aria-hidden="true" />
              <button
                type="button"
                className="shared-breadcrumb-link"
                onClick={() => handleBreadcrumbClick(index)}
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </nav>

        <div className={`shared-table-wrap shared-view-${viewMode} ${isInsideFolder ? "shared-folder-browser" : ""}`}>
          <div className="shared-table-header" aria-hidden={viewMode === "grid"}>
            <span>Name</span>
            {isInsideFolder ? (
              <>
                <span>Type</span>
                <span>Modified</span>
              </>
            ) : (
              <>
                <span>Shared by</span>
                <span>Permission</span>
                <span>Shared on</span>
              </>
            )}
            <span aria-hidden="true" />
          </div>

          {isCurrentLoading ? (
            <p className="shared-status">{isInsideFolder ? "Loading folder..." : "Loading shared files..."}</p>
          ) : error ? (
            <p className="shared-status shared-status-error">{error}</p>
          ) : filteredItems.length === 0 ? (
            <p className="shared-status">
              {query ? "No items match your search." : isInsideFolder ? "This shared folder is empty." : "No files have been shared with you yet."}
            </p>
          ) : (
            <div className="shared-table-body" key={viewMode}>
              {filteredItems.map((item) => {
                const owner = item.ownerId || {};
                const permission = (item.permission || "viewer").toLowerCase();
                const isEditor = permission === "editor";
                const itemId = getItemId(item);
                const itemName = getItemName(item);
                const itemType = getItemType(item);
                const isFolder = isDirectoryItem(item);
                const isActioning = actioningItemId === itemId;
                const canDownload = !isFolder;
                const canRename = isEditor;
                const hasActions = canDownload || canRename;
                
                return (
                  <article
                    className={`shared-row cursor-pointer ${openMenuId === itemId ? "is-menu-open" : ""}`}
                    key={itemId}
                    onClick={() => isFolder ? openDirectory(item) : openFile(item)}
                  >
                    <div className="shared-name-cell">
                      <span className="shared-resource-icon">
                        <SharedResourceIcon item={item} />
                      </span>
                      <div>
                        <h2>{itemName}</h2>
                        <p>{viewMode === "grid" ? formatSharedSubtitle(item) : isInsideFolder ? formatSharedSubtitle(item) : formatResourceType(itemType)}</p>
                      </div>
                    </div>

                    {isInsideFolder ? (
                      <>
                        <div className="shared-folder-type-cell">
                          {formatSharedSubtitle(item)}
                        </div>
                        <div className="shared-date-cell">
                          <FaCalendarAlt className="shared-date-icon" aria-hidden="true" />
                          <strong>{formatDate(item.updatedAt || item.createdAt)}</strong>
                          <p>{formatShortDate(item.updatedAt || item.createdAt)}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="shared-owner-cell">
                          <span className="shared-owner-avatar">
                            {getInitials(owner.name)}
                          </span>
                          <div>
                            <strong>{owner.name || "Unknown user"}</strong>
                            <p>{owner.email || "No email available"}</p>
                          </div>
                        </div>

                        <div className="shared-permission-cell">
                          <span className={`shared-permission shared-permission-${permission}`}>
                            {permission}
                          </span>
                        </div>

                        <div className="shared-date-cell">
                          <FaCalendarAlt className="shared-date-icon" aria-hidden="true" />
                          <strong>{formatDate(item.shareDate || item.createdAt)}</strong>
                          <p>{formatShortDate(item.shareDate || item.createdAt)}</p>
                        </div>
                      </>
                    )}

                    <div
                      className="shared-actions-cell"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {hasActions && (
                        <button
                          type="button"
                          className="shared-row-menu"
                          title="More options"
                          aria-label={`More options for ${itemName}`}
                          aria-expanded={openMenuId === itemId}
                          onClick={(event) => {
                            event.stopPropagation();
                            setOpenMenuId((currentId) =>
                              currentId === itemId ? null : itemId,
                            );
                          }}
                        >
                          <FaEllipsisV />
                        </button>
                      )}

                      {hasActions && openMenuId === itemId && (
                        <div className="shared-action-menu" role="menu">
                          {canDownload && (
                            <button
                              type="button"
                              className="shared-action-menu-item"
                              role="menuitem"
                              disabled={isActioning}
                              onClick={async (e) => {
                                e.stopPropagation();
                                setOpenMenuId(null);
                                const {url}=await downloadSharedWithMeFile(itemId);
                                window.location.href=url;
      
                              }}
                                
                            >
                              <FaDownload />
                              <span>Download</span>
                            </button>
                          )}

                          {canRename && (
                            <button
                              type="button"
                              className="shared-action-menu-item"
                              role="menuitem"
                              disabled={isActioning}
                              onClick={(e) =>{
                                e.stopPropagation();
                                openRenameModal(itemType,itemId,itemName)}}
                            > 
                              <FaPen />
                              <span>Rename</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <p className="shared-footer">
          Showing {filteredItems.length} of {totalItemsCount} items
        </p>
        {showRenameModal && (
        <RenameModal
          renameType={renameType}
          renameValue={renameValue}
          setRenameValue={setRenameValue}
          onClose={() => setShowRenameModal(false)}
          onRenameSubmit={handleRenameSubmit}
        />
      )}
      </section>
    </DriveUILayout>
  );
};
