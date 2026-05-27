import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import "../UsersPage.css";
import { useNavigate } from "react-router-dom";
import {
  Trash2,
  Pencil,
  UserCog,
  User,
  Briefcase,
  Shield,
  Crown,
  LogOut,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "../context/authContext.jsx";
import { Loader } from "../components/common/Loadder.jsx";
import {
  accessAllusers,
  updateUserRole,
  logoutUserSession,
  deleteUserAccount,
} from "../api/userApi.js";

const role = ["User", "Manager", "Admin", "Owner"];
const roleMeta = {
  User: "Basic access",
  Manager: "Team management",
  Admin: "Full permissions",
  Owner: "Complete control",
};
const roleIcons = {
  User,
  Manager: Briefcase,
  Admin: Shield,
  Owner: Crown,
};
const rolePriority = {
  Owner: 1,
  Admin: 2,
  Manager: 3,
  User: 4,
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useAuth();
  const [showPopup, setShowPopup] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showAssignRole, setShowAssignRole] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [logoutTarget, setLogoutTarget] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [isSavingRole, setIsSavingRole] = useState(false);
  const confirmRef = useRef(null);
  const logoutConfirmRef = useRef(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState("");
  const canManageUsers = useMemo(
    () => currentUser?.role === "Admin" || currentUser?.role === "Owner",
    [currentUser?.role],
  );

  const navigate = useNavigate();

  //* Handle Save Role Assignment
  const handleSaveRole = useCallback(async () => {
    if (!selectedRole || !selectedUser) return;

    setIsSavingRole(true);
    try {
      await updateUserRole(selectedUser.id, selectedRole);

      // Update local state optimistically
      setUsers((prev) =>
        prev.map((user) =>
          user.id === selectedUser.id ? { ...user, role: selectedRole } : user,
        ),
      );
      setShowAssignRole(false);
      setSelectedUser(null);
      setSelectedRole("");
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login");
      } else {
        setError(err.response?.data?.message || "Failed to update role");
      }
    } finally {
      setIsSavingRole(false);
    }
  }, [selectedRole, selectedUser, navigate]);

  //* Consolidated keyboard handler for modals
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key !== "Escape") return;
      if (showAssignRole) {
        setShowAssignRole(false);
        setSelectedUser(null);
        setSelectedRole("");
      }
      if (showConfirm) setShowConfirm(false);
      if (showLogoutConfirm && !isLoggingOut) {
        setShowLogoutConfirm(false);
        setLogoutTarget(null);
      }
    };

    if (showAssignRole || showConfirm || showLogoutConfirm) {
      window.addEventListener("keydown", handleEscape);
      return () => window.removeEventListener("keydown", handleEscape);
    }
  }, [showAssignRole, showConfirm, showLogoutConfirm, isLoggingOut]);

  //* reusable function for hard and soft delete
  const deleteUser = useCallback(async (userId, type) => {
    try {
      await deleteUserAccount(userId, type);
      // Update local state optimistically
      setUsers((prev) => prev.filter((user) => user.id !== userId));
    } catch (err) {
      if (err.response?.status === 403) {
        setError(err.response?.data?.message);
      } else {
        setError("Failed to delete user");
      }
    }
  }, []);

  //* fetching all users
  const fetchUsers = useCallback(async () => {
    setError("");
    setIsLoading(true);
    try {
      const data = await accessAllusers();
      setUsers(
        [...data.transformedUsers].sort(
          (a, b) => rolePriority[a.role] - rolePriority[b.role],
        ),
      );
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login");
      } else {
        setError("Failed to load users");
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  //* calling fetch user function
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  //* Focus management for confirm modal
  useEffect(() => {
    if (showConfirm) confirmRef.current?.focus();
  }, [showConfirm]);

  useEffect(() => {
    if (showLogoutConfirm) logoutConfirmRef.current?.focus();
  }, [showLogoutConfirm]);

  //* user logout functionality
  const logoutUser = useCallback(async (userId) => {
    try {
      await logoutUserSession(userId);
      // Update local state optimistically
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, isLoggedIn: false } : user,
        ),
      );
    } catch (err) {
      if (err.response?.status === 403) {
        setError(err.response?.data?.message);
      } else {
        setError("Failed to logout user");
      }
    }
  }, []);

  //* Navigation callbacks
  const navigateHome = useCallback(() => navigate("/"), [navigate]);
  const navigateTrash = useCallback(() => navigate("/owner/trash"), [navigate]);

  //* Auto-clear error after 3 seconds
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(""), 3000);
    return () => clearTimeout(timer);
  }, [error]);

  //* Memoized calculations
  const onlineUsers = useMemo(
    () => users.filter((user) => user.isLoggedIn).length,
    [users],
  );

  const privilegedUsers = useMemo(
    () =>
      users.filter((user) => ["Owner", "Admin", "Manager"].includes(user.role))
        .length,
    [users],
  );

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (!searchTerm) return true;
      const haystack = [
        user.name || "",
        user.email || "",
        user.role || "",
        user.isLoggedIn
          ? "logged in online active"
          : "logged out offline inactive",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(searchTerm);
    });
  }, [users, searchTerm]);

  if (isLoading) {
    return (
      <div className="users-container">
        <Loader label="" />
      </div>
    );
  }

  return (
    <div className="users-container">
      <header className="users-header">
        <div>
          <p className="users-eyebrow">Control Center</p>
          <h2 className="user-management">User Management</h2>
          <p className="users-subtitle">
            Manage access, roles, and security actions for admin, manager, and
            owner accounts.
          </p>
        </div>

        <div className="users-header-actions">
          <button
            className="home-back-btn"
            onClick={navigateHome}
            title="Back to home"
          >
            <ArrowLeft size={15} />
            <span>Home</span>
          </button>

          <p className="current-user">
            Signed in as <strong>{currentUser.name}</strong> (
            {currentUser.role?.toLocaleUpperCase()})
          </p>

          {currentUser.role === "Owner" && (
            <button
              className="trash-button"
              onClick={navigateTrash}
              title="View deleted users"
            >
              <Trash2 size={16} />
              <span>Open Trash</span>
            </button>
          )}
        </div>
      </header>

      <section className="users-metrics">
        <article className="metric-card">
          <p>Total Users</p>
          <h3>{users.length}</h3>
        </article>
        <article className="metric-card">
          <p>Online Users</p>
          <h3>{onlineUsers}</h3>
        </article>
        <article className="metric-card">
          <p>Privileged Roles</p>
          <h3>{privilegedUsers}</h3>
        </article>
      </section>

      {error && <p className="error">{error}</p>}

      <section className="users-table-shell">
        <div className="users-table-top">
          <h3>Workspace Members</h3>
          <span>{filteredUsers.length} records</span>
        </div>

        <form
          className="users-searchbar"
          onSubmit={(e) => {
            e.preventDefault();
            setSearchTerm(searchInput.trim().toLowerCase());
          }}
        >
          <input
            type="text"
            placeholder="Search by name, email, role, or status..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="search-btn">
            Search
          </button>
          <button
            type="button"
            className="clear-search-btn"
            onClick={() => {
              setSearchInput("");
              setSearchTerm("");
            }}
          >
            Clear
          </button>
        </form>

        {searchTerm && (
          <p className="search-hint">
            Showing results for: <strong>{searchTerm}</strong>
          </p>
        )}

        <div className="users-table-wrap">
          <table className="user-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th colSpan={canManageUsers ? 2 : 1} className="action">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 &&
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => {
                      if (canManageUsers)
                        navigate(`/user/${user.id}/resources`);
                    }}
                    className={canManageUsers ? "clickable-row" : ""}
                  >
                    <td className="name-cell">
                      <span className="role-image-container">
                        <span
                          className={`user-role-badge role-${user.role.toLowerCase()}`}
                          aria-hidden
                        >
                          {user.role}
                        </span>

                        <span className="avatar-wrapper">
                          {user.picture ? (
                            <img
                              className="profile-img"
                              src={user.picture}
                              alt={user.name}
                            />
                          ) : (
                            <span className="profile-img profile-fallback">
                              {user.name?.[0]?.toUpperCase() || "U"}
                            </span>
                          )}

                          {currentUser.role !== user.role &&
                          user.role !== "Owner" ? (
                            <button
                              className="pencil-btn avatar-pencil"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUser(user);
                                setSelectedRole(user.role);
                                setShowAssignRole(true);
                              }}
                              aria-label={`Assign role to ${user.name}`}
                            >
                              <Pencil size={12} />
                            </button>
                          ) : null}
                        </span>
                      </span>

                      <div className="name-meta">
                        <strong>{user.name}</strong>
                      </div>
                    </td>
                    <td data-label="Email">{user.email}</td>
                    <td data-label="Status">
                      <span
                        className={`status-badge ${
                          user.isLoggedIn ? "status-online" : "status-offline"
                        }`}
                      >
                        <span className="status-dot"></span>
                        {user.isLoggedIn ? "Logged In" : "Logged Out"}
                      </span>
                    </td>

                    <td data-label="Logout">
                      <button
                        className="logout-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLogoutTarget(user);
                          setShowLogoutConfirm(true);
                        }}
                        disabled={
                          !user.isLoggedIn ||
                          (["Admin", "Manager"].includes(currentUser.role) &&
                            user.role === "Owner") ||
                          (currentUser.role === "Manager" &&
                            user.role === "Admin")
                        }
                      >
                        Logout
                      </button>
                    </td>

                    {canManageUsers && (
                      <td data-label="Delete">
                        <button
                          className="delete-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUser(user);
                            setShowPopup(true);
                          }}
                          disabled={
                            currentUser.role === user.role ||
                            user.role === "Owner"
                          }
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td
                    className="empty-users-row"
                    colSpan={canManageUsers ? 5 : 4}
                  >
                    No users matched your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showPopup && selectedUser && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowPopup(false);
            setSelectedUser(null);
          }}
        >
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-top">
              <div className="delete-modal-icon" aria-hidden>
                <Trash2 size={18} />
              </div>
              <div className="delete-modal-heading">
                <h2>Delete User</h2>
                <p>Select how you want to remove this account.</p>
              </div>
            </div>
            <div className="delete-target-card">
              <span className="delete-target-label">Target user</span>
              <strong className="role_popup">{selectedUser.name}</strong>
              <span>{selectedUser.email}</span>
            </div>
            <div className="modal-actions">
              <button
                className="permanent-delete"
                onClick={() => {
                  setShowPopup(false);
                  setShowConfirm(true);
                }}
              >
                Permanent Delete
              </button>

              <button
                className="soft-delete"
                onClick={() => {
                  deleteUser(selectedUser.id, "soft");
                  setShowPopup(false);
                  setSelectedUser(null);
                }}
              >
                Soft Delete
              </button>

              <button
                className="cancel"
                onClick={() => {
                  setShowPopup(false);
                  setSelectedUser(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirm && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div
            className="confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmTitle"
            aria-describedby="confirmDesc"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirm-top">
              <div className="confirm-badge" aria-hidden>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 9v4"
                    stroke="#9f1239"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 17h.01"
                    stroke="#9f1239"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                    stroke="#fecaca"
                    strokeWidth="0"
                    fill="#fee2e2"
                  />
                </svg>
              </div>
              <h3 id="confirmTitle">Permanently delete user?</h3>
            </div>

            <p id="confirmDesc" className="confirm-desc">
              This will permanently delete <strong>{selectedUser.name}</strong>{" "}
              ({selectedUser.email}). This action cannot be undone.
            </p>

            <div className="confirm-actions">
              <button
                ref={confirmRef}
                className="confirm-permanent"
                disabled={isDeleting}
                onClick={async () => {
                  try {
                    setIsDeleting(true);
                    await deleteUser(selectedUser.id, "hard");
                  } finally {
                    setIsDeleting(false);
                    setShowConfirm(false);
                    setSelectedUser(null);
                  }
                }}
              >
                {isDeleting ? "Deleting..." : "Yes, permanently delete"}
              </button>

              <button
                className="confirm-cancel"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showLogoutConfirm && logoutTarget && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (isLoggingOut) return;
            setShowLogoutConfirm(false);
            setLogoutTarget(null);
          }}
        >
          <div
            className="logout-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logoutConfirmTitle"
            aria-describedby="logoutConfirmDesc"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="logout-confirm-top">
              <div className="logout-confirm-badge" aria-hidden>
                <LogOut size={18} />
              </div>
              <h3 id="logoutConfirmTitle">Log out this user?</h3>
            </div>

            <p id="logoutConfirmDesc" className="logout-confirm-desc">
              This will sign out <strong>{logoutTarget.name}</strong> (
              {logoutTarget.email}) from this device. They can log in again
              anytime.
            </p>

            <div className="logout-confirm-actions">
              <button
                ref={logoutConfirmRef}
                className="logout-confirm-primary"
                disabled={isLoggingOut}
                onClick={async () => {
                  try {
                    setIsLoggingOut(true);
                    await logoutUser(logoutTarget.id);
                    setShowLogoutConfirm(false);
                    setLogoutTarget(null);
                  } finally {
                    setIsLoggingOut(false);
                  }
                }}
              >
                {isLoggingOut ? "Logging out..." : "Yes, logout user"}
              </button>

              <button
                className="logout-confirm-cancel"
                disabled={isLoggingOut}
                onClick={() => {
                  setShowLogoutConfirm(false);
                  setLogoutTarget(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showAssignRole && selectedUser && (
        <div
          className="modal-overlay role-modal-overlay"
          onClick={() => {
            setShowAssignRole(false);
            setSelectedUser(null);
            setSelectedRole("");
          }}
        >
          <div
            className="role-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="roleTitle"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="role-modal-top">
              <div className="role-icon-badge">
                <UserCog size={28} />
              </div>
              <h3 id="roleTitle">Assign Role</h3>
            </div>

            <p className="role-modal-desc">
              Select a role for{" "}
              <strong className="role_popup">{selectedUser.name}</strong> (
              {selectedUser.email})
            </p>

            <div className="role-options-grid">
              {role
                .slice(0, role.indexOf(currentUser.role) + 1)
                .map((r, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`role-option-card role-opt-${r.toLowerCase()} ${selectedRole === r ? "selected" : ""}`}
                    onClick={() => setSelectedRole(r)}
                  >
                    <span className="role-option-icon" aria-hidden>
                      {(() => {
                        const Icon = roleIcons[r];
                        return <Icon size={15} />;
                      })()}
                    </span>
                    <div className="role-radio">
                      {selectedRole === r && (
                        <div className="role-radio-dot"></div>
                      )}
                    </div>
                    <div className="role-option-content">
                      <span className="role-option-title">{r}</span>
                      <span className="role-option-subtitle">
                        {roleMeta[r]}
                      </span>
                    </div>
                  </button>
                ))}
            </div>

            <div className="role-modal-actions">
              <button
                type="button"
                className="role-save-btn"
                onClick={handleSaveRole}
                disabled={
                  !selectedRole ||
                  isSavingRole ||
                  selectedRole === selectedUser.role
                }
              >
                {isSavingRole ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                className="role-cancel-btn"
                onClick={() => {
                  setShowAssignRole(false);
                  setSelectedUser(null);
                  setSelectedRole("");
                }}
                disabled={isSavingRole}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
