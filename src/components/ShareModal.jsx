import { shareResource } from "@/api/shareApi";
import { searchUser } from "@/api/userApi";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FaEye, FaPen, FaSearch, FaTimes, FaUserFriends, FaUserPlus } from "react-icons/fa";
import { IoShareSocialOutline } from "react-icons/io5";
import { getInitial } from "@/utils/getInitial";

function normalizeUser(user) {
  const name = user.name || "User";
  const email = user.email || "";
  
  return {
    id: user._id || email,
    name,
    email,
    picture: user.picture || "",
    initials: getInitial(name || email),
  };
}

function ShareModal({ item, onClose }) {
  const resourceType = item?.isDirectory ? "directory" : "file";
  const [query, setQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [permission, setPermission] = useState("viewer");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState("");

  const title = useMemo(() => {
    return `Share ${resourceType === "directory" ? "Folder" : "File"}`;
  }, [resourceType]);


  //* debounce search
  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setSearchResults([]);
      setSearchError("");
      setIsSearching(false);
      return undefined;
    }

    let ignore = false;
    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        setSearchError("");
        const {users}= await searchUser(trimmed);

        if (!ignore) {
          setSearchResults(Array.isArray(users) ? users.map(normalizeUser) : []);
        }
      } catch (error) {
        if (!ignore) {
          console.error(error);
          setSearchResults([]);
          setSearchError("Unable to search users");
        }
      } finally {
        if (!ignore) {
          setIsSearching(false);
        }
      }
    }, 400);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [query]);

  const canAddQuery = useMemo(() => {
    return query.trim().length > 0;
  }, [query]);

  const visibleSearchResults = useMemo(() => {
    const selectedIds = new Set(selectedUsers.map((user) => user.id));
    const selectedEmails = new Set(
      selectedUsers.map((user) => user.email.toLowerCase()),
    );

    return searchResults.filter((user) => {
      if (selectedIds.has(user.id)) return false;
      return !selectedEmails.has(user.email.toLowerCase());
    });
  }, [searchResults, selectedUsers]);

  const selectedCount = selectedUsers.length;

  function handleAddUser(e) {
    e?.preventDefault();
    const value = query.trim();
    if (!value) return;

    const matchedUser = visibleSearchResults.find(
      (user) => user.email.toLowerCase() === value.toLowerCase(),
    );

    if (matchedUser) {
      addSelectedUser(matchedUser);
      return;
    }
 
    setSearchError("Select a user from the search results");
  }

  function addSelectedUser(user) {
    setSelectedUsers((prev) => {
      const alreadySelected = prev.some(
        (selectedUser) =>
          selectedUser.id === user.id ||
          selectedUser.email.toLowerCase() === user.email.toLowerCase(),
      );
      if (alreadySelected) return prev;

      return [...prev, user];
    });
  }

  function removeSelectedUser(userId) {
    setSelectedUsers((prev) => prev.filter((user) => user.id !== userId));
  }

  async function handleShare() {
    const resourceId = item?._id;
    if (!resourceId || selectedUsers.length === 0) return;

    try {
      setIsSharing(true);
      setShareError("");

      await shareResource({
       resourceId,
       resourceType,
       sharedWith: selectedUsers.map(user => user.id),
       permission
      });

      
      onClose();
    } catch (error) {
      console.error(error);
      setShareError(error.message || "Unable to share resource");
    } finally {
      setIsSharing(false);
    }
  }

  const permissionOptions = useMemo(() => {
    return [
      {
        id: "viewer",
        title: "Viewer",
        description: "Read-only access",
        icon: <FaEye />,
      },
      {
        id: "editor",
        title: "Editor",
        description: "Can edit file",
        icon: <FaPen />,
      },
    ];
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const modalUI = (
    <div className="modal-overlay share-modal-overlay" onClick={onClose}>
      <div
        className="share-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="share-modal-header">
          <div className="share-modal-title-wrap">
            <span className="share-modal-icon" aria-hidden="true">
              <FaUserFriends />
            </span>
            <div>
              <h2 id="share-modal-title">{title}</h2>
              <p>Invite users and set permissions</p>
            </div>
          </div>
          <button
            type="button"
            className="share-modal-close"
            aria-label="Close share dialog"
            onClick={onClose}
          >
            <FaTimes />
          </button>
        </div>

        {item?.name && <p className="share-item-name">{item.name}</p>}

        <form className="share-search-form" onSubmit={handleAddUser}>
          <label className="share-search-wrap" htmlFor="share-email-input">
            <FaSearch className="share-search-icon" aria-hidden="true" />
            <input
              id="share-email-input"
              className="share-search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users or type email..."
            />
            <button
              type="submit"
              className="share-add-user-button"
              disabled={!canAddQuery}
              aria-label="Add user"
            >
              <FaUserPlus aria-hidden="true" />
            </button>
          </label>
        </form>

        <div className="share-selected-panel">
          <h3>Selected ({selectedCount})</h3>

          {query.trim().length >= 2 && (
            <div className="share-search-results">
              {isSearching ? (
                <p className="share-search-status">Searching users...</p>
              ) : searchError ? (
                <p className="share-search-status is-error">{searchError}</p>
              ) : visibleSearchResults.length > 0 ? (
                visibleSearchResults.map((user) => (
                  <button
                    type="button"
                    className="share-user-result"
                    key={user.id}
                    onClick={() => addSelectedUser(user)}
                  >
                    {user.picture ? (
                      <img src={user.picture} alt="" />
                    ) : (
                      <span className="share-user-avatar">{user.initials}</span>
                    )}
                    <span className="share-user-copy">
                      <strong>{user.name}</strong>
                      <span>{user.email}</span>
                    </span>
                    <FaUserPlus aria-hidden="true" />
                  </button>
                ))
              ) : (
                <p className="share-search-status">No users found</p>
              )}
            </div>
          )}

          {selectedUsers.length === 0 && query.trim().length < 2 ? (
            <div className="share-empty-state">
              <FaUserFriends aria-hidden="true" />
              <p>No users selected yet.</p>
              <span>Search above to add people.</span>
            </div>
          ) : (
            <div className="share-selected-list">
              {selectedUsers.map((user) => (
                <div className="share-selected-user" key={user.id}>
                  {user.picture ? (
                    <img
                      className="share-selected-avatar"
                      src={user.picture}
                      alt=""
                    />
                  ) : (
                    <span className="share-selected-avatar">{user.initials}</span>
                  )}
                  <span className="share-selected-copy">
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${user.email}`}
                    onClick={() => removeSelectedUser(user.id)}
                  >
                    <FaTimes aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="share-permission-panel">
          <h3>Permission</h3>
          <div className="share-permission-grid">
            {permissionOptions.map((option) => (
              <button
                type="button"
                key={option.id}
                className={`share-permission-card ${
                  permission === option.id ? "is-selected" : ""
                }`}
                onClick={() => setPermission(option.id)}
              >
                <span className="share-permission-icon" aria-hidden="true">
                  {option.icon}
                </span>
                <span className="share-permission-copy">
                  <strong>{option.title}</strong>
                  <span>{option.description}</span>
                </span>
              </button>
            ))}
          </div>

          <div className="share-count-strip">
            Sharing with <strong>{selectedCount}</strong> users
          </div>
        </div>

        {shareError && <p className="share-modal-error">{shareError}</p>}

        <div className="share-modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="primary-button share-submit-button"
            disabled={selectedCount === 0 || isSharing || !item?._id}
            onClick={handleShare}
          >
            <IoShareSocialOutline aria-hidden="true" />
            {isSharing
              ? "Sharing..."
              : `Share ${resourceType === "directory" ? "Folder" : "File"}`}
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(modalUI, document.body);
}

export default ShareModal;
