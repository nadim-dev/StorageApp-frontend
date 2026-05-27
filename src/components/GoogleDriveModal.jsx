import { FolderOpen, Shield } from "lucide-react";
import { createPortal } from "react-dom";
import { useGoogleDrivePicker } from "../hooks/useGoogleDrivePicker";

export default function GoogleDriveModal({ setShowDriveModal, onFilesPicked }) {
  const requestDriveAccess = useGoogleDrivePicker(onFilesPicked);
  
  return createPortal(
    <>
      <div className="drive-modal-overlay animate-fadeIn">
        <div
          className="drive-modal-backdrop"
          onClick={() => setShowDriveModal(false)}
        />

        <div className="drive-modal-card animate-slideUp">
          <div className="drive-modal-hero">
            <button
              onClick={() => setShowDriveModal(false)}
              className="drive-modal-close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="drive-modal-hero-content">
              <div className="drive-logo-wrap">
                <svg className="drive-logo" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                  <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" />
                  <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47" />
                  <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335" />
                  <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d" />
                  <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc" />
                  <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00" />
                </svg>
              </div>
              <h2>Connect to Google Drive</h2>
              <p>Select files and import them directly to this folder.</p>
            </div>
          </div>

          <div className="drive-modal-body">
            <div className="drive-feature-list">
              <div className="drive-feature-card">
                <FolderOpen className="drive-feature-icon drive-feature-icon-blue" />
                <div>
                  <h3>Select your files</h3>
                  <p>Pick files from Drive and upload in one step.</p>
                </div>
              </div>

              <div className="drive-feature-card drive-feature-card-green">
                <Shield className="drive-feature-icon drive-feature-icon-green" />
                <div>
                  <h3>Secure and private</h3>
                  <p>Only selected files are accessed from your account.</p>
                </div>
              </div>
            </div>

            <div className="drive-modal-note">
              <p>
                You will be redirected to Google Drive for authentication.
              </p>
            </div>
          </div>

          <div className="drive-modal-actions">
            <button
              onClick={() => setShowDriveModal(false)}
              className="drive-btn drive-btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowDriveModal(false);
                requestDriveAccess();
              }}
              className="drive-btn drive-btn-primary"
            >
              Open Drive
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
