import { FaFolderOpen, FaPlus, FaUpload } from "react-icons/fa";

function EmptyFolder({ onUpload, onCreateFolder }) {
  return (
    <section className="empty-state-wrap" aria-live="polite">
      <div className="empty-state-card">
        <span className="empty-state-glow" aria-hidden="true" />

        <div className="empty-state-icon" aria-hidden="true">
          <FaFolderOpen />
        </div>

        <h2 className="empty-state-title">This folder is empty</h2>

        <p className="empty-state-text">
          Give this space a start by uploading a file or creating a new folder.
          Everything will appear here instantly.
        </p>

        <div className="empty-state-actions">
          <button
            type="button"
            onClick={onUpload}
            className="empty-state-btn empty-state-btn-primary"
          >
            <FaUpload aria-hidden="true" />
            <span>Upload File</span>
          </button>

          <button
            type="button"
            onClick={onCreateFolder}
            className="empty-state-btn empty-state-btn-secondary"
          >
            <FaPlus aria-hidden="true" />
            <span>New Folder</span>
          </button>
        </div>
      </div>
    </section>
  );
}

export default EmptyFolder;
