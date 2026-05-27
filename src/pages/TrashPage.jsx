import { useCallback, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, RefreshCw, Trash2, ArrowLeft } from "lucide-react";
import "../TrashPage.css";
import { useAuth } from "../context/authContext.jsx";
import {
  accessDeletedUsers,
  permanentDeleteUserAccount,
  recoverDeletedUserAccount,
} from "../api/trashApi.js";
import { Loader } from "../components/common/Loadder.jsx";

const DEFAULT_AVATAR = import.meta.env.VITE_DEFAULT_AVATAR_IMAGE;

export default function TrashPage() {
  const [deletedUsers, setDeletedUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionType, setActionType] = useState(""); // 'recover' or 'delete'
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const confirmRef = useRef(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  //*  Fetch deleted users
  const fetchDeletedUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      const data = await accessDeletedUsers();
      setDeletedUsers(data);
      setFilteredUsers(data);
    } catch (err) {
      if (err.status === 401) {
        navigate("/login");
      } else {
        setError(err.message || "Failed to load users");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(deletedUsers);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = deletedUsers.filter((user) =>
      user.email.toLowerCase().includes(query),
    );
    setFilteredUsers(filtered);
  }, [searchQuery, deletedUsers]);

  // Recover user
  const recoverUser = useCallback(
    async (userId) => {
      console.log("recoverUser ka Id",userId);
      if (isProcessing) return;
      setIsProcessing(true);
      setError("");
      try {
        await recoverDeletedUserAccount(userId);
        setSuccessMessage(`User ${selectedUser.name} recovered successfully!`);
        setDeletedUsers((prevUsers) =>
          prevUsers.filter((user) => user.id !== userId),
        );
        setTimeout(() => setSuccessMessage(""), 3000);
      } catch (err) {
        if (err.status === 401) {
          navigate("/login");
        } else {
          setError(err.message || "Failed to recover user");
        }
      } finally {
        setIsProcessing(false);
        setShowConfirm(false);
        setSelectedUser(null);
      }
    },
    [isProcessing, selectedUser, navigate],
  );

  // Permanently delete user
  const permanentlyDeleteUser = useCallback(
    async (userId) => {
      if (isProcessing) return;
      setIsProcessing(true);
      setError("");
      try {
        await permanentDeleteUserAccount(userId);
        setSuccessMessage(`User ${selectedUser.name} permanently deleted!`);
        setDeletedUsers((prevUsers) =>
          prevUsers.filter((user) => user.id !== userId),
        );
        setTimeout(() => setSuccessMessage(""), 3000);
      } catch (err) {
        if (err.status === 401) {
          navigate("/login");
        } else {
          setError(err.message || "Failed to delete users");
        }
      } finally {
        setIsProcessing(false);
        setShowConfirm(false);
        setSelectedUser(null);
      }
    },
    [isProcessing, selectedUser, navigate],
  );

  useEffect(() => {
    fetchDeletedUsers();
  }, [fetchDeletedUsers]);

  // Focus and keyboard handling for confirm modal
  useEffect(() => {
    if (!showConfirm) return;
    confirmRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") setShowConfirm(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showConfirm]);

  const handleAction = (user, type) => {
    setSelectedUser(user);
    setActionType(type);
    setShowConfirm(true);
  };

  if (loading) {
    return (
      <div className="users-container">
        <Loader label="" />
      </div>
    );
  }

  return (
    <div className="trash-container">
      <div className="trash-content">
        {/* Header */}
        <div className="trash-header">
          <div className="header-top">
            <div className="header-left">
              <button onClick={() => navigate("/user")} className="back-button">
                <ArrowLeft size={20} />
                <span>Back to Users</span>
              </button>
              <h1 className="trash-title">
                <Trash2 className="trash_icon" />
                Trash
              </h1>
            </div>
            <div className="current-user-info">
              {currentUser.name.toLocaleUpperCase()} -{" "}
              <span className="user-role">
                {currentUser.role.toLocaleUpperCase()}
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="search-container">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Messages */}
          {error && <div className="error-message">{error}</div>}
          {successMessage && (
            <div className="success-message">{successMessage}</div>
          )}
        </div>

        {/* Users Table */}
        <div className="trash-table-container">
          {filteredUsers.length === 0 ? (
            <div className="empty-state">
              <Trash2 size={48} className="empty-icon" />
              <p className="empty-text">
                {searchQuery
                  ? "No users found matching your search"
                  : "No deleted users"}
              </p>
            </div>
          ) : (
            <table className="trash-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Deleted By</th>
                  <th className="hide-on-small-height">Deleted At</th>
                  <th className="actions-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={crypto.randomUUID()}>
                    <td>
                      <div className="user-cell">
                        <img
                          src={user.picture || DEFAULT_AVATAR}
                          alt={user.name}
                          className="user-avatar"
                        />
                        <span className="user-name">{user.name}</span>
                      </div>
                    </td>
                    <td className="user-email">{user.email}</td>
                    <td>
                      <span className="role-badge">{user.deletedBy}</span>
                    </td>
                    <td className="deleted-date hide-on-small-height">
                      {user.deletedAt
                        ? new Date(user.deletedAt).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleAction(user, "recover")}
                          className="recover-button"
                        >
                          <RefreshCw size={16} />
                          Recover
                        </button>
                        <button
                          onClick={() => handleAction(user, "delete")}
                          className="permanent-delete-button"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div
            className="confirm-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="confirm-header">
              <div
                className={`confirm-icon ${actionType === "recover" ? "recover-icon" : "delete-icon"}`}
              >
                {actionType === "recover" ? (
                  <RefreshCw size={24} />
                ) : (
                  <Trash2 size={24} />
                )}
              </div>
              <div className="confirm-text">
                <h3 className="confirm-title">
                  {actionType === "recover"
                    ? "Recover User?"
                    : "Permanently Delete User?"}
                </h3>
                <p className="confirm-description">
                  {actionType === "recover" ? (
                    <>
                      Are you sure you want to recover{" "}
                      <strong>{selectedUser.name}</strong> ({selectedUser.email}
                      )? This will restore their account.
                    </>
                  ) : (
                    <>
                      Are you sure you want to permanently delete{" "}
                      <strong>{selectedUser.name}</strong> ({selectedUser.email}
                      )? This action cannot be undone.
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="confirm-actions">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isProcessing}
                className="cancel-button"
              >
                Cancel
              </button>
              <button
                ref={confirmRef}
                onClick={() => {
                  if (actionType === "recover") {
                    recoverUser(selectedUser.id);
                  } else {
                    permanentlyDeleteUser(selectedUser.id);
                  }
                }}
                disabled={isProcessing}
                className={
                  actionType === "recover"
                    ? "confirm-recover"
                    : "confirm-delete"
                }
              >
                {isProcessing
                  ? "Processing..."
                  : actionType === "recover"
                    ? "Yes, Recover"
                    : "Yes, Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
