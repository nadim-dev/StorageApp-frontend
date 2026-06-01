
import { useState } from "react";
import { downloadFile } from "../api/fileApi.js";
import { FaBan, FaChevronRight, FaDownload, FaPen, FaShareAlt, FaTrashAlt } from "react-icons/fa";
import ShareOptionsMenu from "./ShareOptionsMenu.jsx";

function ContextMenu({
    item,
    isUploadingItem,
    handleCancelUpload,
    handleDeleteFile,
    handleDeleteDirectory,
    openRenameModal,
    openShareModal,
    closeMenu
  }) {
    const [showShareOptions, setShowShareOptions] = useState(false);

const menuItems = item.isDirectory
      ? [
          ...(openShareModal
            ? [
                {
                  label: "Share",
                  icon: <FaShareAlt className="context-menu-item-icon" aria-hidden="true" />,
                  hasSubmenu: true,
                  onClick: () => setShowShareOptions((prev) => !prev),
                },
              ]
            : []),
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
          ...(openShareModal
            ? [
                {
                  label: "Share",
                  icon: <FaShareAlt className="context-menu-item-icon" aria-hidden="true" />,
                  hasSubmenu: true,
                  onClick: () => setShowShareOptions((prev) => !prev),
                },
              ]
            : []),
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

    function handleMenuItemClick(menuItem) {
      menuItem.onClick();

      if (!menuItem.hasSubmenu) {
        closeMenu?.();
      }
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
            className={`context-menu-item ${menuItem.variant === "danger" ? "is-danger" : ""} ${
              menuItem.hasSubmenu && showShareOptions ? "is-active" : ""
            }`}
            onClick={() => handleMenuItemClick(menuItem)}
          >
            {menuItem.icon}
            <span className="context-menu-item-label">{menuItem.label}</span>
            {menuItem.hasSubmenu && (
              <FaChevronRight className="context-menu-chevron" aria-hidden="true" />
            )}
          </button>
        ))}

        {showShareOptions && (
          <ShareOptionsMenu
            item={item}
            onShare={openShareModal}
            onClose={closeMenu}
          />
        )}
      </div>
    );
  }
  
  export default ContextMenu;
  
