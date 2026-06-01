import { useState } from "react";
import { FaLink, FaUserPlus } from "react-icons/fa";
import { createPublicLink } from "../api/shareApi";

function ShareOptionsMenu({ item, onShare, onClose }) {
  const [isCreatingPublicLink, setIsCreatingPublicLink] = useState(false);
  const [error, setError] = useState("");

  async function handlePublicLinkClick() {
    const resourceId = item._id;
    if (!resourceId) return;

    setIsCreatingPublicLink(true);
    setError("");

    try {
      await createPublicLink({
        resourceId,
        resourceType: item.isDirectory ? "directory" : "file",
      });
      setIsCreatingPublicLink(false);
      onClose?.();
    } catch (err) {
      setError(err.message || "Unable to create public link");
      setIsCreatingPublicLink(false);
    }
  }

  return (
    <div className="share-options-menu" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="share-options-item"
        onClick={() => {
          onShare(item);
          onClose?.();
        }}
      >
        <FaUserPlus className="share-options-icon" aria-hidden="true" />
        <span>Share</span>
      </button>

      <button
        type="button"
        className="share-options-item"
        onClick={handlePublicLinkClick}
        disabled={isCreatingPublicLink}
      >
        <FaLink className="share-options-icon" aria-hidden="true" />
        <span>{isCreatingPublicLink ? "Creating..." : "Public link"}</span>
      </button>

      {error && <p className="share-options-error">{error}</p>}
    </div>
  );
}

export default ShareOptionsMenu;
