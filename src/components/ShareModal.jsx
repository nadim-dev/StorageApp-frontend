import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { FaLock, FaTimes, FaUserPlus } from "react-icons/fa";

function ShareModal({ item, onClose }) {
  const resourceType = item?.isDirectory ? "directory" : "file";

  const title = useMemo(() => {
    if (!item?.name) return "Share";
    return `Share "${item.name}"`;
  }, [item?.name]);

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
              <FaUserPlus />
            </span>
            <div>
              <h2 id="share-modal-title">{title}</h2>
              <p>{resourceType === "directory" ? "Folder" : "File"} sharing</p>
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

        <div className="share-modal-section">
          <label className="share-modal-label" htmlFor="share-email-input">
            Share
          </label>
          <div className="share-email-row">
            <input
              id="share-email-input"
              className="share-email-input"
              type="email"
              placeholder="Add people by email"
            />
            <button type="button" className="secondary-button">
              Invite
            </button>
          </div>
        </div>

        <div className="share-modal-section share-access-section">
          <div className="share-public-copy">
            <span className="share-public-icon" aria-hidden="true">
              <FaLock />
            </span>
            <div>
              <h3>General access</h3>
              <p>Only people added here can access this item.</p>
            </div>
          </div>
        </div>

        <div className="share-modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="primary-button" onClick={onClose}>
            Done
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
