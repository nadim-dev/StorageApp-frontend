import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  FaBan,
  FaCalendarAlt,
  FaChevronDown,
  FaEllipsisV,
  FaFolder,
  FaPen,
  FaShareAlt,
  FaTimes,
  FaUsers,
  FaUsersCog,
} from "react-icons/fa";
import DriveUILayout from "@/components/DriveUILayout.jsx";
import { renderFileIcon } from "@/components/common/getFileIcon.jsx";
import {
  getResourceAccess,
  sharedByMeResources,
  stopSharingResource,
  updateResourceAccess,
} from "@/api/shareApi.js";
import { formatDate, formatBillingDate } from "@/utils/formatDate";
import { getInitial } from "@/utils/getInitial";
import "../DirectoryView.css";
import Toast from "../components/Toast.jsx";
import useToast from "../hooks/useToast.js";
import { useAuth } from "@/context/authContext";

function isDirectoryItem(item) {
  return item.resourceType === "directory";
}

function formatResourceSubtitle(item) {
  if (item.resourceType === "directory") return "Folder";
  const extension = item.extension?.replace(".", "").toUpperCase();
  return extension ? `${extension} file` : "File";
}

function getAccessUsers(accessData) {
  return accessData.map((entry) => {
    const user = entry.sharedWith;
    return {
      accessId: entry._id,
      id: user._id,
      name: user.name,
      email: user.email,
      picture: user.profilePictureUrl,
      permission: entry.permission,
      originalPermission: entry.permission,
    };
  });
}

function applyAccessChanges(accessData, removedAccessIds, permissionChanges) {
  return accessData
    .filter((entry) => !removedAccessIds.includes(entry._id))
    .map((entry) => ({
      ...entry,
      permission: permissionChanges[entry._id] || entry.permission,
    }));
}

function getSharedUsersFromAccessData(accessData) {
  return accessData.map((entry) => ({
    ...entry.sharedWith,
    permission: entry.permission,
  }));
}


function ManageAccessModal({ item, owner, accessData, isLoading, isSaving, onClose, onSave }) {
  const [people, setPeople] = useState([]);
  const [removedAccessIds, setRemovedAccessIds] = useState([]);
  const [permissionChanges, setPermissionChanges] = useState({});
  const ownerName = owner?.name || "You";
  const ownerEmail = owner?.email || "";

  useEffect(() => {
    setPeople(getAccessUsers(accessData));
    setRemovedAccessIds([]);
    setPermissionChanges({});
  }, [accessData]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleRemoveAccess = (accessId) => {
    setPeople((currentPeople) => currentPeople.filter((user) => user.accessId !== accessId));
    setRemovedAccessIds((currentIds) => [...currentIds, accessId]);
    setPermissionChanges((currentChanges) => {
      const updatedChanges = { ...currentChanges };
      delete updatedChanges[accessId];
      return updatedChanges;
    });
  };

  const handlePermissionChange = (accessId, permission) => {
    setPeople((currentPeople) =>
      currentPeople.map((user) =>
        user.accessId === accessId ? { ...user, permission } : user
      )
    );

    const user = people.find((person) => person.accessId === accessId);
    setPermissionChanges((currentChanges) => {
      const updatedChanges = { ...currentChanges };

      if (user?.originalPermission === permission) {
        delete updatedChanges[accessId];
      } else {
        updatedChanges[accessId] = permission;
      }

      return updatedChanges;
    });
  };

  const handleDone = () => {
    onSave({ removedAccessIds, permissionChanges });
  };

  const modalUI = (
    <div className="manage-access-overlay" onClick={onClose}>
      <div
        className="manage-access-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="manage-access-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="manage-access-header">
          <div>
            <h2 id="manage-access-title">Manage Access</h2>
            <p>Review everyone who can open this resource.</p>
          </div>
          <button
            type="button"
            className="manage-access-close"
            aria-label="Close manage access"
            onClick={onClose}
          >
            <FaTimes />
          </button>
        </div>

        <div className="manage-access-resource">
          <span className="manage-access-resource-icon">
            {item.resourceType == "folder" ? <FaFolder className="shared-folder-icon" /> : renderFileIcon(item.extension)}
          </span>
          <div>
            <strong>{item.resourceName}</strong>
            <span>{formatResourceSubtitle(item)}</span>
          </div>
        </div>

        <div className="manage-access-section">
          <h3>People with access</h3>

          <div className="manage-access-person">
            <span className="shared-owner-avatar">
              {getInitial(ownerName)}
            </span>
            <div className="manage-access-person-copy">
              <strong>{ownerName} (You)</strong>
              <span>{ownerEmail}</span>
            </div>
            <span className="manage-access-owner-badge">Owner</span>
          </div>

          {isLoading ? (
            <p className="manage-access-status">Loading access details...</p>
          ) : people.length === 0 ? (
            <p className="manage-access-status">No other people have access.</p>
          ) : (
            people.map((user) => (
              <div className="manage-access-person" key={user.accessId}>
                <span className="shared-owner-avatar">
                  {user.picture ? (
                    <img src={user.picture} alt={user.name} />
                  ) : (
                    getInitial(user.name)
                  )}
                </span>
                <div className="manage-access-person-copy">
                  <strong>{user.email}</strong>
                  <span>{user.name}</span>
                </div>
                <div className="manage-access-person-controls">
                  <label
                    className={`manage-access-role-control manage-access-role-${user.permission} ${
                      permissionChanges[user.accessId] ? "is-role-changed" : ""
                    }`}
                  >
                    <span className="manage-access-role-label">
                      {user.permission === "editor" ? "Editor" : "Viewer"}
                    </span>
                    <select
                      aria-label={`Permission for ${user.email || user.name}`}
                      value={user.permission}
                      onChange={(event) => handlePermissionChange(user.accessId, event.target.value)}
                      disabled={isSaving}
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                    </select>
                    <FaChevronDown aria-hidden="true" />
                  </label>
                  <button
                    type="button"
                    className="manage-access-remove"
                    aria-label={`Remove access for ${user.email || user.name}`}
                    title="Remove access"
                    onClick={() => handleRemoveAccess(user.accessId)}
                    disabled={isSaving}
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="manage-access-actions">
          <button type="button" onClick={handleDone} disabled={isSaving || isLoading}>
            {isSaving ? "Saving..." : "Done"}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalUI, document.body);
}

export const ShareByMe = () => {
  const [query, setQuery] = useState("");
  const [sharedItems, setSharedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [manageAccessItem, setManageAccessItem] = useState(null);
  const [manageAccessData, setManageAccessData] = useState([]);
  const [isAccessLoading, setIsAccessLoading] = useState(false);
  const [isAccessSaving, setIsAccessSaving] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  const {currentUser}=useAuth(); //owner details

  useEffect(() => {
    let ignore = false;

    const fetchResources = async () => {
      try {
        setIsLoading(true);
        setError("");
        const response = await sharedByMeResources();
        if (!ignore) {
          setSharedItems(Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : []);
        }
      } catch {
        if (!ignore) {
          setError("Unable to load resources shared by you.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    fetchResources();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const closeOpenMenu = () => setOpenMenuId(null);
    document.addEventListener("click", closeOpenMenu);

    return () => {
      document.removeEventListener("click", closeOpenMenu);
    };
  }, []);

  const summary = useMemo(() => {
    return {
      files: sharedItems?.length,
      users: sharedItems?.reduce((total, item) => total + Number(item.totalSharedUsers || 0), 0),
      editors: sharedItems?.reduce((total, item) => total + Number(item.editorCount || 0), 0),
    };
  }, [sharedItems]);

  const filteredItems = useMemo(() => {
    const search = query.trim().toLowerCase();

    const items = sharedItems.filter((item) => {
      const users = item.sharedUsers || [];

      if (activeFilter === "files" && isDirectoryItem(item)) return false;
      if (activeFilter === "folders" && !isDirectoryItem(item)) return false;
      if (!search) return true;

      return [
        item.resourceName,
        item.resourceType,
        item.extension,
        ...users.flatMap((user) => [user.name, user.email]),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
    });

    return [...items].sort((a, b) => {
      if (sortBy === "name") {
        return a.resourceName.localeCompare(b.resourceName);
      }

      const aDate = new Date(a.shareDate || 0);
      const bDate = new Date(b.shareDate || 0);
      return bDate - aDate;
    });
  }, [activeFilter, query, sharedItems, sortBy]);

  //* handle stop sharing
  const handleStopSharing = async (resourceId) => {
    setOpenMenuId(null);

    try {
      const response = await stopSharingResource(resourceId);
      
      if (response.success) {
        setSharedItems((prev) => prev.filter((item) => item._id !== resourceId));
        showToast("Resource sharing stopped successfully.", {
          type: "success",
          title: "Sharing stopped",
        });
      }
    } catch {
      showToast("Unable to stop sharing this resource.", {
        type: "error",
        title: "Action failed",
      });
    }
  };

  //* Manage Access
  const handleManageAccess=async (item)=>{

    setOpenMenuId(null);
    setManageAccessItem(item);
    setManageAccessData([]);
    setIsAccessLoading(true);

    try {
      const response = await getResourceAccess(item._id);
      setManageAccessData(response.user);
    } catch {
      setManageAccessItem(null);
      showToast("Unable to load access details.", {
        type: "error",
        title: "Action failed",
      });
    } finally {
      setIsAccessLoading(false);
    }
  };

  const handleSaveAccessChanges = async ({ removedAccessIds, permissionChanges }) => {
    const permissionEntries = Object.entries(permissionChanges);

    if (removedAccessIds.length === 0 && permissionEntries.length === 0) {
      setManageAccessItem(null);
      return;
    }

    try {
      setIsAccessSaving(true);

      await updateResourceAccess({
        resourceId: manageAccessItem._id,
        removeAccessIds: removedAccessIds,
        permissionUpdates: permissionEntries.map(([accessId, permission]) => ({
          accessId,
          permission,
        })),
      });

      const updatedAccessData = applyAccessChanges(
        manageAccessData,
        removedAccessIds,
        permissionChanges
      );
      const updatedSharedUsers = getSharedUsersFromAccessData(updatedAccessData);

      setManageAccessData(updatedAccessData);
      setSharedItems((currentItems) =>
        currentItems
          .map((item) =>
            item._id === manageAccessItem._id
              ? {
                  ...item,
                  sharedUsers: updatedSharedUsers,
                  totalSharedUsers: updatedSharedUsers.length,
                  editorCount: updatedAccessData.filter((entry) => entry.permission === "editor").length,
                }
              : item
          )
          .filter((item) => item._id !== manageAccessItem._id || item.totalSharedUsers > 0)
      );
      setManageAccessItem(null);
      showToast("Access updated successfully.", {
        type: "success",
        title: "Access updated",
      });
    } catch {
      showToast("Unable to update access.", {
        type: "error",
        title: "Action failed",
      });
    } finally {
      setIsAccessSaving(false);
    }
  };

  return (
    <DriveUILayout
      active="shared-by-me"
      headerMode="shared-by-me"
      query={query}
      setQuery={setQuery}
    >
      <section className="shared-page shared-by-me-page">
        <div className="shared-page-head">
          <div>
            <h1>Shared by me</h1>
            <p>Files and folders you have shared with others.</p>
          </div>
        </div>

        <div className="shared-by-me-stats" aria-label="Shared by me summary">
          <article className="shared-by-me-stat">
            <span className="shared-by-me-stat-icon shared-by-me-stat-blue">
              <FaShareAlt />
            </span>
            <div>
              <p>Shared Files</p>
              <strong>{summary.files}</strong>
              <span>Total files & folders</span>
            </div>
          </article>
          <article className="shared-by-me-stat">
            <span className="shared-by-me-stat-icon shared-by-me-stat-green">
              <FaUsers />
            </span>
            <div>
              <p>People with Access</p>
              <strong>{summary.users}</strong>
              <span>Total users</span>
            </div>
          </article>
          <article className="shared-by-me-stat">
            <span className="shared-by-me-stat-icon shared-by-me-stat-purple">
              <FaPen />
            </span>
            <div>
              <p>Users with Edit Access</p>
              <strong>{summary.editors}</strong>
              <span>People can edit</span>
            </div>
          </article>
        </div>

        <div className="shared-by-me-toolbar">
          <div className="shared-by-me-filters" aria-label="Shared by me filters">
            {[
              ["all", "All"],
              ["files", "Files"],
              ["folders", "Folders"],
            ].map(([filter, label]) => (
              <button
                type="button"
                key={filter}
                className={`shared-filter-button ${activeFilter === filter ? "is-active" : ""}`}
                onClick={() => setActiveFilter(filter)}
              >
                {label}
              </button>
            ))}
          </div>
          <select
            className="shared-sort-select"
            aria-label="Sort shared resources"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
          >
            <option value="recent">Most Recent</option>
            <option value="name">Name</option>
          </select>
        </div>

        <div className="shared-table-wrap shared-by-me-table">
          <div className="shared-table-header">
            <span>Name</span>
            <span>Shared With</span>
            <span>Shared On</span>
            <span aria-hidden="true" />
          </div>

          {isLoading ? (
            <p className="shared-status">Loading resources shared by you...</p>
          ) : error ? (
            <p className="shared-status shared-status-error">{error}</p>
          ) : filteredItems.length === 0 ? (
            <p className="shared-status">
              {query ? "No shared resources match your search." : "You have not shared any files yet."}
            </p>
          ) : (
            <div className="shared-table-body">
              {filteredItems.map((item) => {
                const users = item.sharedUsers || [];
                const totalSharedUsers = Number(item.totalSharedUsers || users.length);
                const visibleUsers = users.slice(0, 3);
                const extraUserCount = Math.max(totalSharedUsers - visibleUsers.length, 0);
                const sharedOn = item.shareDate;
              
                return (
                  <article
                    className={`shared-row ${openMenuId === item._id ? "is-menu-open" : ""}`}
                    key={item._id}
                  >
                    <div className="shared-name-cell">
                      <span className="shared-resource-icon">
                        {item.resourceType == "folder" ? <FaFolder className="shared-folder-icon" /> : renderFileIcon(item.extension)}
                      </span>
                      <div>
                        <h2>{item.resourceName}</h2>
                        <p>{formatResourceSubtitle(item)}</p>
                      </div>
                    </div>

                    <div className="shared-by-me-users-cell">
                      <div className="shared-by-me-avatar-stack" aria-label={`${totalSharedUsers} users`}>
                        {visibleUsers.map((user, index) => (
                          <span
                            className="shared-owner-avatar"
                            key={user._id || `${user.email}-${index}`}
                            title={user.name || user.email}
                          >
                            {user.profilePictureUrl ? (
                              <img src={user.profilePictureUrl} alt={user.name || "Shared user"} />
                            ) : (
                              getInitial(user.name || user.email)
                            )}
                          </span>
                        ))}
                        {extraUserCount > 0 && (
                          <span className="shared-by-me-extra-users">+{extraUserCount}</span>
                        )}
                      </div>
                      <strong>
                        {totalSharedUsers} {totalSharedUsers === 1 ? "user" : "users"}
                      </strong>
                    </div>

                    <div className="shared-date-cell">
                      <FaCalendarAlt className="shared-date-icon" aria-hidden="true" />
                      <strong>{formatDate(sharedOn)}</strong>
                      <p>{formatBillingDate(sharedOn)}</p>
                    </div>

                    <div
                      className="shared-actions-cell"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="shared-row-menu"
                        title="More options"
                        aria-label={`More options for ${item.resourceName}`}
                        aria-expanded={openMenuId === item._id}
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenMenuId((currentId) => (currentId === item._id ? null : item._id));
                        }}
                      >
                        <FaEllipsisV />
                      </button>

                      {openMenuId === item._id && (
                        <div className="shared-action-menu" role="menu">
                          <button
                            type="button"
                            className="shared-action-menu-item"
                            role="menuitem"
                            onClick={() => handleManageAccess(item)}
                          >
                            <FaUsersCog />
                            <span>Manage Access</span>
                          </button>

                          <button
                            type="button"
                            className="shared-action-menu-item is-danger"
                            role="menuitem"
                            onClick={() => handleStopSharing(item._id)}
                          >
                            <FaBan />
                            <span>Stop Sharing</span>
                          </button>
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
          Showing {filteredItems.length} of {sharedItems.length} items
        </p>
        <Toast toast={toast} onClose={hideToast} />
        {manageAccessItem && (
          <ManageAccessModal
            item={manageAccessItem}
            owner={currentUser}
            accessData={manageAccessData}
            isLoading={isAccessLoading}
            isSaving={isAccessSaving}
            onClose={() => setManageAccessItem(null)}
            onSave={handleSaveAccessChanges}
          />
        )}
      </section>
    </DriveUILayout>
  );
};
