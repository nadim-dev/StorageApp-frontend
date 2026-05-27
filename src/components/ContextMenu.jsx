
import { downloadFile } from "../api/fileApi.js";
import { FaBan, FaDownload, FaPen, FaTrashAlt } from "react-icons/fa";

function ContextMenu({
    item,
    isUploadingItem,
    handleCancelUpload,
    handleDeleteFile,
    handleDeleteDirectory,
    openRenameModal,
    closeMenu
  }) {

const menuItems = item.isDirectory
      ? [
          {
            label: "Rename",
            icon: <FaPen className="context-menu-item-icon" aria-hidden="true" />,
            onClick: () => {
              openRenameModal("directory", item._id, item.name);
            },
          },
          {
            label: "Delete",
            icon: <FaTrashAlt className="context-menu-item-icon" aria-hidden="true" />,
            variant: "danger",
            onClick: () => handleDeleteDirectory(item._id),
          },
        ]
      : isUploadingItem && item.isUploading
      ? [
          {
            label: "Cancel",
            icon: <FaBan className="context-menu-item-icon" aria-hidden="true" />,
            onClick: () => {
              handleCancelUpload(item.id);
            },
          },
        ]
      : [
          {
            label: "Download",
            icon: <FaDownload className="context-menu-item-icon" aria-hidden="true" />,
            onClick: async () => {
              const {url}=await downloadFile(item._id);
              window.location.href =url;
            },
          },
          {
            label: "Rename",
            icon: <FaPen className="context-menu-item-icon" aria-hidden="true" />,
            onClick: () => {
              openRenameModal("file", item._id, item.name);
            },
          },
          {
            label: "Delete",
            icon: <FaTrashAlt className="context-menu-item-icon" aria-hidden="true" />,
            variant: "danger",
            onClick: () => handleDeleteFile(item._id),
            
          },
        ];

    function handleItemClick(action) {
      action();
      closeMenu?.();
    }

    return (
      <div
        className="context-menu"
        onClick={(e) => e.stopPropagation()}
      >
        {menuItems.map((menuItem) => (
          <button
            type="button"
            key={menuItem.label}
            className={`context-menu-item ${menuItem.variant === "danger" ? "is-danger" : ""}`}
            onClick={() => handleItemClick(menuItem.onClick)}
          >
            {menuItem.icon}
            <span className="context-menu-item-label">{menuItem.label}</span>
          </button>
        ))}
      </div>
    );
  }
  
  export default ContextMenu;
  
