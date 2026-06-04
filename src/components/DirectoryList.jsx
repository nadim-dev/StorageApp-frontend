import DirectoryItem from "./DirectoryItem";


function DirectoryList({
  items,
  handleRowClick,
  activeContextMenu,
  handleContextMenu,
  isUploading,
  progressMap,
  handleDeleteDirectory,
  handleDeleteFile,
  handleCancelUpload,
  openRenameModal,
  openShareModal,
  onPublicLinkCopied,
  closeMenu,
}) {
  const folders = items.filter((item) => item.isDirectory);
  const files = items.filter((item) => !item.isDirectory);
  console.log("items",items);
  return (
    <div className="directory-content-board">
      <section className="resource-section">
        <div className="resource-section-head">
          <h2>Folders</h2>
          <span>{folders.length}</span>
        </div>
        {folders.length === 0 ? (
          <p className="resource-empty">No folders in this directory yet.</p>
        ) : (
          <div className="directory-list directory-grid folders-grid">
            {folders.map((item) => {
              const itemId=item._id ? item._id : item.id;
              console.log("itemId",itemId);
              const uploadProgress= progressMap[itemId] || 0;
              
              return (
                <DirectoryItem
                  key={itemId}
                  item={item}
                  handleRowClick={handleRowClick}
                  isContextMenuOpen={activeContextMenu === itemId}
                  handleContextMenu={handleContextMenu}
                  isUploading={isUploading}
                  uploadProgress={uploadProgress}
                  handleCancelUpload={handleCancelUpload}
                  handleDeleteFile={handleDeleteFile}
                  handleDeleteDirectory={handleDeleteDirectory}
                  openRenameModal={openRenameModal}
                  openShareModal={openShareModal}
                  onPublicLinkCopied={onPublicLinkCopied}
                  closeMenu={closeMenu}
                />
              );
            })}
          </div>
        )}
      </section>

      <section className="resource-section">
        <div className="resource-section-head">
          <h2>Files</h2>
          <span>{files.length}</span>
        </div>
        {files.length === 0 ? (
          <p className="resource-empty">No files in this directory yet.</p>
        ) : (
          <div className="directory-list directory-grid files-grid">
            {files.map((item) => {
              const itemId=item._id ? item._id : item.id;
              const uploadProgress = progressMap[itemId] || 0;
              
              return (
                <DirectoryItem
                  key={itemId}
                  item={item}
                  handleRowClick={handleRowClick}
                  isContextMenuOpen={activeContextMenu === itemId}
                  handleContextMenu={handleContextMenu}
                  isUploading={isUploading}
                  uploadProgress={uploadProgress}
                  handleDeleteFile={handleDeleteFile}
                  handleDeleteDirectory={handleDeleteDirectory}
                  handleCancelUpload={handleCancelUpload}
                  openRenameModal={openRenameModal}
                  openShareModal={openShareModal}
                  onPublicLinkCopied={onPublicLinkCopied}
                  closeMenu={closeMenu}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default DirectoryList;
