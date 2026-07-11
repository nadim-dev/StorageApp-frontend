import { FaClock, FaFileAlt, FaFolder } from "react-icons/fa";
import DriveUILayout from "../components/DriveUILayout";
import { formatFileSize } from "../utils/formatFile";
import { formatDate } from "../utils/formatDate";
import "../DirectoryView.css";
import "../RecentPage.css";
import { recentFile, renameFile, temporaryDeleteFile, viewFile } from "../api/fileApi.js";
import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { renderFileIcon } from "../components/common/getFileIcon";
import { BsThreeDotsVertical } from "react-icons/bs";
import ContextMenu from "../components/ContextMenu";
import RenameModal from "../components/RenameModal";
import useCloseContextMenu from "../hooks/useCloseContextMenu.js";
import useToast from "@/hooks/useToast.js";
import Toast from "@/components/Toast";
import ShareModal from "@/components/ShareModal";

export default function RecentPage() {
   
   const navigate=useNavigate();
   const [activeContextMenu, setActiveContextMenu] = useState(null);
   const [recentItems,setRecentItems]=useState([])
   const [originalRecentItems,setOriginalRecentItems]=useState([]);
   const [showRenameModal, setShowRenameModal] = useState(false);
   const [renameType, setRenameType] = useState(null);
   const [renameId, setRenameId] = useState(null);
   const [renameValue, setRenameValue] = useState("");
   const [query,setQuery]=useState("");
   const { toast, showToast, hideToast } = useToast();
   const [shareItem, setShareItem] = useState(null);

   const fetchRecentFiles=useCallback(async ()=>{
        console.log("recent page function is running");
        try{
           const data=await recentFile();
           console.log("recent data",data);
           setRecentItems(data);
           setOriginalRecentItems(data);
        }catch(err){
          console.log(err.status);
          if(err.status == 401)
             navigate("/login")
          console.log(err.message);
        }
  }, [navigate])

   function openRenameModal(type, id, currentName) {
    console.log("open rename model is not running");
    console.log(type,id,currentName);
    setActiveContextMenu(null);
    setRenameType(type);
    setRenameId(id);
    setRenameValue(currentName);
    setShowRenameModal(true);
  }

  async function handleRenameSubmit(e) {
    e.preventDefault();
    if (!renameId) return;
    try{
     await renameFile(renameId,renameValue);
     setRecentItems((prev) =>
    prev.map((recentFile) =>
    recentFile._id === renameId
      ? { ...recentFile, name: renameValue }
      : recentFile
  )
);
    }catch(err){
      console.log(err.message);
    } 
    setShowRenameModal(false);
    setRenameType(null);
    setRenameId(null);
    setRenameValue("");
  } 

  const openShareModal = useCallback((item) => {
    setActiveContextMenu(null);
    setShareItem(item);
  }, []);

  const handlePublicLinkCopied = useCallback(() => {
    showToast("Public link copied to clipboard", {
      title: "Link copied",
      type: "success",
    });
  }, [showToast]);


  const deleteRecentFile=async(fileId)=>{
    console.log("delete  recent file function is running");
    try{
    await temporaryDeleteFile(fileId);
    setRecentItems((prev)=>(
      prev.filter((file)=>file._id !=fileId)
    ))
    }catch(err){
      console.log(err.message);
    }
  }

   function handleContextMenu(e, id) {
    e.stopPropagation();
    setActiveContextMenu((prev) => (prev === id ? null : id));
  }

  useCloseContextMenu(setActiveContextMenu);

  const handleOpenRecentFile = useCallback(async (fileId) => {
    try {
      const { url } = await viewFile(fileId);
      window.open(url, "_blank");
    } catch (err) {
      if (err.status === 401) {
        navigate("/login");
        return;
      }

      console.log(err.message);
    }
  }, [navigate]);

  useEffect(()=>{
  if(!query){
    setRecentItems(originalRecentItems)
  }
  setRecentItems((prev)=>{
    return  prev.filter(({name})=>name.toLowerCase().includes(query.toLowerCase()))
  })
},[query])
 

  useEffect(()=>{
     fetchRecentFiles();
  },[fetchRecentFiles])

  return (
    <DriveUILayout active="recent" headerMode="trash" query={query} setQuery={setQuery}>
      <section className="recent-board">
        <div className="recent-board-top">
          <p>
            <FaClock />
            <span>Recently opened</span>
          </p>
          <span>{recentItems.length} {recentItems.length === 1 ? "item" : "items"}</span>
        </div>

        <div className="recent-items-grid">
          {recentItems.map((item) => {
           
            return (
            <article
              key={item._id}
              className={`recent-card hover:cursor-pointer ${activeContextMenu == item._id ? "is-menu-open" : ""}`}
              onClick={() => handleOpenRecentFile(item._id)}
            >
              <div className="recent-card-main">
                <span className={"recent-icon file"}>{renderFileIcon("."+item.name.split(".").pop())}</span>
                <div className="recent-meta">
                  <h3>{item.name}</h3>
                  <div className="recent-meta-chips">
                    <span>Opened {formatDate(item.lastAccessedAt)}</span>
                    <span>{formatFileSize(item.size)}</span>
                  </div>
                </div>
              </div>
              <div className="recent-card-actions">
                <button
                  className="context-menu-trigger"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleContextMenu(e, item._id);
                  }}
                  type="button"
                >
                  <BsThreeDotsVertical />
                </button>

                {activeContextMenu == item._id ? (
                  <ContextMenu
                    item={item}
                    closeMenu={() => setActiveContextMenu(null)}
                    openRenameModal={openRenameModal}
                    handleDeleteFile={deleteRecentFile}
                    openShareModal={openShareModal}
                    onPublicLinkCopied={handlePublicLinkCopied}
                  />
                ) : ""}
              </div>
            </article>
            );
          })}
        </div>

        {showRenameModal && (
          <RenameModal
            renameType={renameType}
            renameValue={renameValue}
            setRenameValue={setRenameValue}
            onClose={() => setShowRenameModal(false)}
            onRenameSubmit={handleRenameSubmit}
            openShareModal={openShareModal}
            onPublicLinkCopied={handlePublicLinkCopied}
          />
        )}

        {shareItem && (
        <ShareModal
          item={shareItem}
          onClose={() => setShareItem(null)}
        />
      )}

        <Toast toast={toast} onClose={hideToast} />

      </section>
    </DriveUILayout>
  );
}
