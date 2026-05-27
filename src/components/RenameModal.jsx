import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

function RenameModal({
  renameType,
  renameValue,
  setRenameValue,
  onClose,
  onRenameSubmit,
}) {
  
  const inputRef = useRef(null);
  useEffect(() => {
    // Focus and select text only once on mount
    if (inputRef.current) {
      inputRef.current.focus();
      
      const dotIndex = renameValue.lastIndexOf(".");
      if (dotIndex > 0) {
        inputRef.current.setSelectionRange(0, dotIndex);
      } else {
        inputRef.current.select();
      }
    }

    // Listen for "Escape" key to close the modal
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup keydown event listener on unmount
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Stop propagation when clicking inside the content
  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  // Close when clicking outside the modal content
  const handleOverlayClick = () => {
    onClose();
  };

  const modalUI = (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" onClick={handleContentClick}>
        <h2>Rename {renameType === "file" ? "File" : "Folder"}</h2>
        <form onSubmit={onRenameSubmit}>
          <input
            ref={inputRef}
            type="text"
            className="modal-input"
            placeholder="Enter new name"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
          />
          <div className="modal-buttons">
            <button className="primary-button" type="submit">
              Save
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(modalUI, document.body);
}

export default RenameModal;
