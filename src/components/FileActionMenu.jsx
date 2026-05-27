import { useRef, useEffect } from "react";
import { Trash2, Download, Edit2 } from "lucide-react";
import "./FileActionMenu.css";

export default function FileActionMenu({
  isOpen,
  onClose,
  fileId,
  userId,
  fileType, // "file" | "folder"
  fileName,
  onDownload,
  onDelete,
  setShowRenameModal,
  setRenameType,
  setRenameId,
  setRenameValue,
}) {
  const menuRef = useRef(null);
  console.log("FileType", fileType);
  console.log("fileId", fileId);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Don't render if menu is closed
  if (!isOpen) return null;

  const handleAction = (callback) => {
    if (typeof callback === "function") {
      callback(fileId, fileType);
    }
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div className="file-menu-overlay" onClick={onClose} />

      {/* Menu */}
      <div ref={menuRef} className="file-action-menu">
        {/* Rename (file + folder) */}
        <button
          className="file-menu-item"
          onClick={() => {
            (onClose(), setShowRenameModal(true));
            setRenameType(fileType);
            setRenameId(fileId);
            setRenameValue(fileName);
          }}
        >
          <Edit2 size={16} />
          <span>Rename</span>
        </button>

        {/* Download (file only) */}
        {fileType === "file" && (
          <button
            className="file-menu-item"
            onClick={() => onDownload(fileId, userId)}
          >
            <Download size={16} />
            <span>Download</span>
          </button>
        )}

        <div className="file-menu-divider" />

        {/* Delete (file + folder) */}
        <button
          className="file-menu-item file-menu-item-delete"
          onClick={() => handleAction(onDelete)}
        >
          <Trash2 size={16} />
          <span>Delete</span>
        </button>
      </div>
    </>
  );
}
