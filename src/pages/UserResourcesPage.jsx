import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Folder, Lock, MoreVertical } from "lucide-react";
import { FaFolder } from "react-icons/fa";
import "../UserResourcesPage.css";
import FileActionMenu from "../components/FileActionMenu";
import { formatDate } from "../utils/formatDate";
import { formatFileSize } from "../utils/formatFile";
import { renderFileIcon } from "../components/common/getFileIcon";
import RenameModal from "../components/RenameModal";
import { useAuth } from "../context/authContext.jsx";
import {
  downloadResource,
  getNestedResources,
  renameUserResources,
  userDeleteResource,
  userResources,
  viewResource,
} from "../api/userApi.js";
import { Loader } from "../components/common/Loadder.jsx";

export default function UserResourcesPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [activeMenuId, setActiveMenuId] = useState(false);
  const [currentFolderName, setCurrentFolderName] = useState(null);
  const [folderBreadcrumbs, setFolderBreadcrumbs] = useState([]);
  const [nestedResources, setNestedResources] = useState([]);
  const [resources, setResources] = useState([]);
  const [pageLoading, setPageLoading] = useState(false);
  const { currentUser: authUser } = useAuth();
  const [resourceOwner, setResourceOwner] = useState(null);
  const [error, setError] = useState("");
  const [nestedResourceLoading, setNestedResourceLoading] = useState(false);
  //? for renaming purpose
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameType, setRenameType] = useState(null); // "directory" or "file"
  const [renameId, setRenameId] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  //*  Fetch resources
  useEffect(() => {
    const fetchUserResources = async () => {
      setPageLoading(true);
      setError("");
      try {
        const data = await userResources(userId);
        setResourceOwner(data.user);
        setResources(data.resources);
      } catch (err) {
        if (err.response?.status === 401) {
          navigate("/login");
        } else {
          setError(err.response?.data?.message || "Failed to fetch resources");
        }
      } finally {
        setPageLoading(false);
      }
    };

    fetchUserResources();
  }, [userId, navigate]);

  // Memoize role checks
  const isOwner = useMemo(() => authUser?.role === "Owner", [authUser?.role]);
  const isAdmin = useMemo(() => authUser?.role === "Admin", [authUser?.role]);

  // Handle folder click - fetch nested items
  const handleFolderClick = useCallback(
    async (folderName, folderId) => {
      setNestedResourceLoading(true);
      setError("");
      try {
        const data = await getNestedResources(folderId);
        setCurrentFolderName(folderName);
        setNestedResources(data.items || []);
        setFolderBreadcrumbs((prev) => [
          ...prev,
          { id: folderId, name: folderName },
        ]);
      } catch (err) {
        if (err.response?.status === 401) {
          navigate("/login");
        } else {
          setError(
            err.response?.data?.message || "Failed to fetch folder contents",
          );
        }
      } finally {
        setNestedResourceLoading(false);
      }
    },
    [navigate],
  );

  // Handle breadcrumb navigation - go back to previous folder
  const handleBreadcrumbClick = useCallback(
    (index) => {
      if (index === -1) {
        setCurrentFolderName(null);
        setNestedResources([]);
        setFolderBreadcrumbs([]);
      } else {
        const breadcrumb = folderBreadcrumbs[index];
        setCurrentFolderName(breadcrumb.name);
        setFolderBreadcrumbs((prev) => prev.slice(0, index + 1));
        setNestedResourceLoading(true);
        setError("");

        getNestedResources(breadcrumb.id)
          .then((data) => {
            setNestedResources(data.items || []);
          })
          .catch((err) => {
            if (err.response?.status === 401) {
              navigate("/login");
            } else {
              setError(
                err.response?.data?.message ||
                  "Failed to fetch folder contents",
              );
            }
          })
          .finally(() => {
            setNestedResourceLoading(false);
          });
      }
    },
    [folderBreadcrumbs, navigate],
  );

  // Determine which resources to display
  const displayResources = useMemo(
    () => (currentFolderName ? nestedResources : resources),
    [currentFolderName, nestedResources, resources],
  );

  // Helper to remove resource from state
  const removeResource = useCallback(
    (resourceId) => {
      if (!currentFolderName) {
        setResources((prev) => prev.filter((res) => res._id !== resourceId));
      } else {
        setNestedResources((prev) =>
          prev.filter((res) => res._id !== resourceId),
        );
      }
    },
    [currentFolderName],
  );

  // Delete resource
  const handleDeleteResource = useCallback(
    async (resourceId, type) => {
      try {
        await userDeleteResource(userId, type, resourceId);
        removeResource(resourceId);
        setActiveMenuId(null);
      } catch (err) {
        if (err.response?.status === 401) {
          navigate("/login");
        } else {
          setError(err.response?.data?.message || "Failed to delete resource");
        }
      }
    },
    [userId, removeResource, navigate],
  );

  // Download resource
  const handleDownloadResource = useCallback((fileId, userId) => {
    downloadResource(userId, fileId);
    setActiveMenuId(null);
  }, []);

  // View resource (open in new tab)
  const handleFileClick = useCallback(
    (fileId) => {
      viewResource(userId, fileId);
    },
    [userId],
  );

  // Helper to update resource name
  const updateResourceName = useCallback(
    (resourceId, newName) => {
      if (!currentFolderName) {
        setResources((prev) =>
          prev.map((res) =>
            res._id === resourceId ? { ...res, name: newName } : res,
          ),
        );
      } else {
        setNestedResources((prev) =>
          prev.map((res) =>
            res._id === resourceId ? { ...res, name: newName } : res,
          ),
        );
      }
    },
    [currentFolderName],
  );

  // Rename resource
  const handleRenameSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      try {
        await renameUserResources(userId, renameType, renameId, renameValue);
        updateResourceName(renameId, renameValue);
        setShowRenameModal(false);
        setRenameValue("");
        setRenameType(null);
        setRenameId(null);
      } catch (err) {
        if (err.response?.status === 401) {
          navigate("/login");
        } else {
          setError(err.response?.data?.message || "Failed to rename resource");
        }
      }
    },
    [userId, renameType, renameId, renameValue, updateResourceName, navigate],
  );

  if (pageLoading) {
    return (
      <div className="users-container">
        <Loader label="Loading resources..." />
      </div>
    );
  }

  return (
    <div className="drive-container">
      {/* Header */}
      <div className="drive-header">
        <div className="header-left">
          <button
            className="back-button"
            onClick={() => navigate("/user")}
            title="Back to Users"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <h1 className="drive-title">{authUser.role} Dashboard</h1>
        </div>
        {isAdmin && (
          <div className="readonly-badge">
            <Lock size={14} />
            <span>View only</span>
          </div>
        )}
      </div>

      {/* User Info Banner */}
      {resourceOwner && (
        <div className="user-banner">
          <img
            src={resourceOwner.picture}
            alt={resourceOwner.name}
            className="user-avatar"
          />
          <div className="user-info">
            <h2 className="user-name">{resourceOwner.name}</h2>
            <p className="user-email">{resourceOwner.email}</p>
          </div>
          <div className={`role-badge ${resourceOwner.role.toLowerCase()}`}>
            {resourceOwner.role}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-alert">
          <p>{error}</p>
        </div>
      )}

      {/* Breadcrumb Navigation */}

      <div className="breadcrumb-container">
        <button
          className="breadcrumb-link"
          onClick={() => handleBreadcrumbClick(-1)}
        >
          Home
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

      {/* Resources Section */}
      {displayResources.length > 0 ? (
        <div className="resources-section">
          <div className="section-header">
            <h3 className="section-title">Items</h3>
            <span className="item-count">{displayResources.length} items</span>
          </div>

          {/* List View */}
          <div className="list-container">
            <div className="list-header">
              <div className="col-name">Name</div>
              <div className="col-owner">Owner</div>
              <div className="col-modified">Last modified</div>
              <div className="col-size">File size</div>
              {isOwner && <div className="col-actions">Action</div>}
            </div>

            {nestedResourceLoading ? (
              <div style={{ padding: "40px", textAlign: "center" }}>
                <Loader label="Loading folder contents..." />
              </div>
            ) : (
              displayResources.map((resource) => (
                <div
                  key={resource._id}
                  className="list-row"
                  style={{
                    cursor: resource.type === "folder" ? "pointer" : "default",
                  }}
                >
                  <div className="col-name">
                    <div
                      className="file-info cursor-pointer"
                      onClick={() =>
                        resource.type === "folder"
                          ? handleFolderClick(resource.name, resource._id)
                          : handleFileClick(resource._id)
                      }
                    >
                      <div
                        className={`file-icon ${resource.type === "folder" ? "folder" : "document"}`}
                      >
                        {resource.type === "folder" ? (
                          <FaFolder className="folder-icon" />
                        ) : (
                          renderFileIcon(resource.extension)
                        )}
                      </div>
                      <span className="file-name">{resource.name}</span>
                    </div>
                  </div>
                  <div className="col-owner">
                    <span className="owner-text">
                      {resourceOwner?.name || "-"}
                    </span>
                  </div>
                  <div className="col-modified">
                    <span className="date-text">
                      {formatDate(resource.updatedAt)}
                    </span>
                  </div>
                  <div className="col-size">
                    <span className="size-text">
                      {formatFileSize(resource.size)}
                    </span>
                  </div>
                  <div className="col-actions">
                    {/* Show menu only to Owner - Admin cannot perform any actions */}
                    {isOwner && (
                      <div className="action-menu-wrapper">
                        <button
                          className="more-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(
                              activeMenuId === resource._id
                                ? null
                                : resource._id,
                            );
                          }}
                        >
                          <MoreVertical size={18} />
                        </button>

                        {activeMenuId === resource._id && (
                          <FileActionMenu
                            isOpen={true}
                            onClose={() => setActiveMenuId(null)}
                            fileId={resource._id}
                            userId={userId}
                            fileType={resource.type} // "file" or "folder"
                            fileName={resource.name}
                            setShowRenameModal={setShowRenameModal}
                            setRenameType={setRenameType}
                            setRenameId={setRenameId}
                            setRenameValue={setRenameValue}
                            onDownload={handleDownloadResource}
                            onDelete={handleDeleteResource}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            <Folder size={64} />
          </div>
          <h3 className="empty-title">No files or folders</h3>
          <p className="empty-text">This drive is empty</p>
        </div>
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
    </div>
  );
}
