
import { useState } from "react";
import { createPortal } from "react-dom";
import { FaFolderPlus, FaPlus, FaTimes, FaUpload } from "react-icons/fa";
import { SiGoogledrive } from "react-icons/si";

export const DriveBtn = ({ onCreateFolder, onUploadFiles, onOpenDrive }) => {
  const [open, setOpen] = useState(false);

  function handleCreateFolder() {
    onCreateFolder?.();
    setOpen(false);
  }

  function handleUploadFiles() {
    onUploadFiles?.();
    setOpen(false);
  }

  function handleOpenDrive() {
    onOpenDrive?.();
    setOpen(false);
  }

  const fabUI = (
    <div className="mobile-drive-fab-wrap">
      <div
        className={`mobile-drive-fab-menu ${open ? "is-open" : ""}`}
        role="menu"
        aria-label="Quick actions"
        aria-hidden={!open}
      >
        <button
          type="button"
          className="mobile-drive-mini-btn"
          onClick={handleCreateFolder}
          aria-label="Create folder"
          tabIndex={open ? 0 : -1}
        >
          <FaFolderPlus />
        </button>
        <button
          type="button"
          className="mobile-drive-mini-btn"
          onClick={handleUploadFiles}
          aria-label="Upload files"
          tabIndex={open ? 0 : -1}
        >
          <FaUpload />
        </button>
        <button
          type="button"
          className="mobile-drive-mini-btn"
          onClick={handleOpenDrive}
          aria-label="Google Drive"
          tabIndex={open ? 0 : -1}
        >
          <SiGoogledrive />
        </button>
      </div>

      <button
        type="button"
        className={`mobile-drive-fab ${open ? "is-open" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? "Close quick actions" : "Open quick actions"}
        aria-expanded={open}
      >
        {open ? <FaTimes /> : <FaPlus />}
      </button>
    </div>
  );

  return createPortal(fabUI, document.body);
};
