import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {FaFolderPlus,FaCreditCard,FaTachometerAlt,FaGoogleDrive,FaUpload,FaUser,FaSignOutAlt,FaSignInAlt,FaSearch,FaBars,FaTimes} from "react-icons/fa";
import GoogleDriveModal from "./GoogleDriveModal"
import { logoutUser } from "../api/userApi.js";
import { useAuth } from "../context/authContext.jsx";
import { getInitial } from "../utils/getInitial.js";


function DirectoryHeader({
  query,
  setQuery,
  mode = "drive",
  onCreateFolderClick,
  onUploadFilesClick,
  fileInputRef,
  handleFileSelect,
  disabled = false,
  setShowDriveModal,
  showDriveModal,
  onFilesPicked,
  onSidebarToggle = () => {},
  isSidebarOpen = false,
   
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const {currentUser:user,setCurrentUser}=useAuth();
  console.log("directory header user data",user);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();
  
 
  const handleUserIconClick = () => {
    setShowUserMenu((prev) => !prev);
  };

  // 3. Logout handler

  const handleLogout = async () => {
    try {
      const data=await logoutUser();
      console.log("data",data);
      setCurrentUser(null);
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };
 
  // 4. Close menu on outside click

  useEffect(() => {
    function handleDocumentClick(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleDocumentClick);
    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, []);

  // go to profile page

  const handleProfile=()=>{
    navigate("/profile");
  }
 

  const isDriveMode = mode === "drive";

  if (mode === "storage-intelligence") {
  return null;
}


  return (
    <header className="directory-header">
      <div className="directory-title-block">
        <button
          type="button"
          className="icon-button sidebar-toggle"
          title="Toggle menu"
          aria-label="Toggle sidebar menu"
          aria-expanded={isSidebarOpen}
          onClick={onSidebarToggle}
        >
          {isSidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
        <label className="directory-search-wrap" htmlFor="directory-search-input">
          <FaSearch className="directory-search-icon" />
          <input
            id="directory-search-input"
            className="directory-search-input"
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
            }}
            placeholder="Search folders and files..."
            aria-label="Search folders and files"
          />
        </label>
      </div>
      <div className="header-links">
        {isDriveMode && (
          <>
            {/* Create Folder (icon button) */}
            <button
              className="icon-button folder_btn"
              title="Create Folder"
              onClick={onCreateFolderClick}
              disabled={disabled}
            >
              <FaFolderPlus />
            </button>

            {/* Upload Files (icon button) */}
            <button
              className="icon-button upload_btn"
              title="Upload Files"
              onClick={onUploadFilesClick}
              disabled={disabled}
            > 
              <FaUpload />
            </button>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              id="file-upload"
              type="file"
              width="500"
              height="500"
              style={{ display: "none" }}
              multiple
              onChange={handleFileSelect}
            />

            {/* Upload from Google Drive */}
            <button
              className="drive-button"
              title="Upload from Google Drive"
              onClick={() => setShowDriveModal(true)}
              disabled={disabled}
            >
              <FaGoogleDrive />
              <span>Import from Drive</span>
            </button>

            {showDriveModal && (
              <GoogleDriveModal
                setShowDriveModal={setShowDriveModal}
                showDriveModal={showDriveModal}
                onFilesPicked={onFilesPicked}
              />
            )}
          </>
        )}

       



        {/* User Icon & Dropdown Menu */}
        <div className="user-menu-container" ref={userMenuRef}>
        <button className="icon-button" onClick={handleUserIconClick}>
        {user?.picture ? (
          <img
            className="user-picture"
            src={user.picture}
            alt={user.name || "User picture"}
          />
        ) : (
          <span className="user-picture user-initials">
            {getInitial(user?.name)}
          </span>
        )}

      </button> 


          {showUserMenu && (
            <div className="user-menu">
              {user ? (
                <>
                  {/* Display name & email if logged in */}
                  <div className="user-menu-item user-info">
                    <span className="user-name">{user.name}</span>{<br></br>}
                    <span className="user-email">{user.email}</span>
                  </div>
                  <div className="user-menu-divider" />
         
                  <div onClick={handleProfile} className="user-menu-item login-btn">
                                 
                      <FaUser/>
                      <span>Profile</span>
                  </div>
                  <div
                    onClick={() => navigate("/manage-plan")}
                    className="user-menu-item login-btn"
                  >
                    <FaCreditCard className="menu-item-icon" />
                    <span>Manage Plan</span>
                  </div>
                   <div
                    className="user-menu-item login-btn"
                    onClick={handleLogout}
                   >
                    <FaSignOutAlt className="menu-item-icon" />
                    <span>Logout</span>
                  </div>
                  {user?.role && user.role !== "User" ?
                    (<div
                      onClick={()=>navigate("/user")}
                      className="user-menu-item login-btn"
                    >
                     <FaTachometerAlt className="menu-item-icon" />
                    <span>Admin Dashboard</span>
                    </div>):""
                  }
  
                </>
              ) : (
                <>
                  {/* Show Login if not logged in */}
                  <div
                    className="user-menu-item login-btn"
                    onClick={() => {
                      navigate("/login");
                      setShowUserMenu(false);
                    }}
                  >
                    <FaSignInAlt className="menu-item-icon" />
                    <span>Login</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

    </header>
  );
}

export default DirectoryHeader;
