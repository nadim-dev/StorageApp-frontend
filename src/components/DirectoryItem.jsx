import { memo, useState } from "react";
import { FaFolder,FaStar } from "react-icons/fa";
import { renderFileIcon } from "./common/getFileIcon";
import { BsThreeDotsVertical } from "react-icons/bs";
import ContextMenu from "../components/ContextMenu";
import { formatDate } from "../utils/formatDate";
import { formatFileSize } from "../utils/formatFile";
import { starredFile } from "../api/fileApi.js";
import { starredDirectory } from "../api/directoryApi.js";

function DirectoryItem({
  item,
  handleRowClick,
  isContextMenuOpen,
  handleContextMenu,
  isUploading,
  handleDeleteFile,
  handleDeleteDirectory,
  uploadProgress,
  handleCancelUpload,
  openRenameModal,
  openShareModal,
  closeMenu
}) {
  const itemId = item.id || item._id;
  const isUploadingItem = itemId?.startsWith("temp-");
  const extension = (item.extension || "");
  const normalizedExtension = extension.replace(/^\./, "");
  const formattedSize = item.isDirectory
    ? "Folder"
    : Number.isFinite(item.size)
    ? formatFileSize(item.size)
    : "-";
    
  const formattedDate = item.updatedAt
    ? formatDate(item.updatedAt)
    : item.createdAt
    ? formatDate(item.createdAt)
    : isUploadingItem
    ? "Uploading..."
    : "No date";
  const fileKindLabel = item.isDirectory
    ? "Folder"
    : normalizedExtension
    ? `${normalizedExtension.toUpperCase()} File`
    : "File";

  const [starred, setStarred] = useState(item.starred || false);
  //* Handling starred state
  const handleStarClick = async (e,id,type) => {
  e.stopPropagation();
  console.log("handle star click function si running");
  const newStarState = !starred;

  // ✅ Optimistic UI update
  setStarred(newStarState);
  
  try{
  if(type == "file")
    await starredFile(id,{starred:newStarState})
  else
    await starredDirectory(id,{starred:newStarState})
  } catch (err) {
    console.log(err.message);
    setStarred(false);
  }
};


  return (
    <div
      className={`list-item hoverable-row group ${
        item.isDirectory ? "folder-card" : "file-card"
      }` }
      onClick={() =>
        !isUploading
          ? handleRowClick(item.isDirectory ? "directory" : "file", itemId, item.name)
          : null
      }
      title={`Size: ${formattedSize}\nCreated At: ${formattedDate}`}
    >
      <div className="item-card-top">
        <div className="item-icon-wrap">
          {item.isDirectory ? (
            <FaFolder className="folder-icon" />
          ) : (
            renderFileIcon(item.extension)
          )}
        </div>

        <div className="item-top-actions">
            
             <button
               type="button"
               className={`item-star-toggle ${starred ? "is-active" : ""}`}
               aria-label={starred ? "Remove from starred" : "Add to starred"}
               onClick={(e) => {
                 handleStarClick(e, item._id, item.isDirectory ? "directory" : "file");
               }}
             >
               <FaStar className="item-star-icon" />
             </button>
        
           
             <button
               className="context-menu-trigger"
               onClick={(e) => {
                 e.preventDefault();
                 e.stopPropagation();
                 handleContextMenu(e, itemId);
               }}
               type="button"
             >
               <BsThreeDotsVertical />
             </button>

             {isContextMenuOpen && (
               <ContextMenu
                  item={item}
                  isUploadingItem={isUploadingItem}
                  handleDeleteFile={handleDeleteFile}
                  handleDeleteDirectory={handleDeleteDirectory}
                  handleCancelUpload={handleCancelUpload}
                  openRenameModal={openRenameModal}
                  openShareModal={openShareModal}
                  closeMenu={closeMenu}
               />
             )}
          </div>
      </div>

      <div className="item-meta">
        <span className="item-name">
          {item.name}
        </span>
        <span className="item-subline">{fileKindLabel}</span>
        <span className="item-submeta">
          {formattedSize} | Updated {formattedDate}
        </span>
      </div>

      {isUploadingItem && (
        <div className="progress-container">
          <span className="progress-value">{Math.floor(uploadProgress)}%</span>
          <div
            className="progress-bar"
            style={{
              width: `${uploadProgress}%`,
              backgroundColor: uploadProgress === 100 ? "#039203" : "#007bff",
            }}
          ></div>
        </div>
      )}

    </div>
  );
}

export default memo(DirectoryItem);
