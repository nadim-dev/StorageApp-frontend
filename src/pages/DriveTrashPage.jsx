import DriveUILayout from "../components/DriveUILayout";
import { FaClock, FaFolder, FaTrashAlt, FaUndoAlt } from "react-icons/fa";
import { formatFileSize } from "../utils/formatFile";
import { formatDate } from "../utils/formatDate";
import { renderFileIcon } from "../components/common/getFileIcon";
import "../DirectoryView.css";
import "../DriveTrashPage.css";
import { useEffect,useState } from "react";
import { accessTrashItem, restoreFile,restoreDirectory,permanentDeleteFile,permanentDeleteDirectory } from "../api/trashApi.js";
import { viewFile } from "@/api/fileApi";
export default function DriveTrashPage() {
  const [tempTrashItems,setTrashTempItem]=useState([]);
  const [allTrashItems,setAllTrashItems]=useState([]);
  const [query,setQuery]=useState("");

  const fetchTrashPage=async ()=>{
       console.log("Trash page function is running");
       const data=await accessTrashItem();
       setTrashTempItem(data);
       setAllTrashItems(data);
  }

  useEffect(()=>{
     fetchTrashPage();
  },[])

  const fileRestoreHandle=async (fileId)=>{
    console.log("file store function is running");
    try{
      await restoreFile(fileId);
      setTrashTempItem((prev)=>{
        return prev.filter((file)=>file._id!=fileId)
       })

    }catch(err){
      console.log(err.message);
    }
  }

  const directoryRestoreHandle=async (dirId)=>{
    console.log("directory store function is running");
    try{
      const data=await restoreDirectory(dirId);
      setTrashTempItem((prev)=>{
        return prev.filter((dir)=>dir._id!=dirId)
       })

    }catch(err){
      console.log(err.message);
    }
  }


  const permanentDeleteDirectoryHandle=async (dirId)=>{
    try{
      setTrashTempItem((prev)=>{
        return prev.filter((dir)=>dir._id!=dirId)
       })
      const data=await permanentDeleteDirectory(dirId);
    
    }catch(err){
      console.log(err.message);
    } 
  }

  const permanentDeleteFileHandle=async (fileId)=>{
    try{
    setTrashTempItem((prev)=>{
        return prev.filter((file)=>file._id!=fileId)
    })
    await permanentDeleteFile(fileId);
    }catch(err){
      console.log("error",err)
     }
     
  }

  useEffect(()=>{
  if(!query){
    setTrashTempItem(allTrashItems);
  }
  setTrashTempItem((prev)=>{
    return  prev.filter(({name})=>name.toLowerCase().includes(query.toLowerCase()))
  })
},[query])


  return (
    <DriveUILayout active="trash" headerMode="trash" query={query} setQuery={setQuery}>
      <section className="trash-board">
        <div className="trash-board-top">
          <div>
            <p>Recently deleted items</p>
            <small>Restore items or remove them permanently from your drive.</small>
          </div>
          <span>{tempTrashItems.length} {tempTrashItems.length === 1 ? "item" : "items"}</span>
        </div>

        <div className="trash-items-grid">
          {tempTrashItems.map((item) => (
            <article key={item._id} className="trash-card cursor-pointer" 
              onClick={async ()=>{
                const {url}=await viewFile(item._id);
                window.open(url,"_blank")
             }}>
              <div className="trash-card-main">
                <div className="trash-card-top">
                  <div className={`trash-icon ${item.type === "folder" ? "folder" : "file"}`}>
                    {item.type === "folder" ? <FaFolder /> : renderFileIcon(item.extension)}
                  </div>
                  <span className={`trash-type-badge ${item.type === "folder" ? "folder" : "file"}`}>
                    {item.type === "folder" ? "Folder" : item.extension?.replace(".", "").toUpperCase() || "File"}
                  </span>
                </div>
                <div className="trash-meta">
                  <h3 className="filename">{item.name}</h3>
                  <div className="trash-card-details">
                    <span>
                      <FaClock aria-hidden="true" />
                      Deleted {formatDate(item.deletedAt)}
                    </span>
                    <span>{item.type === "folder" ? "Folder" : formatFileSize(item.size)}</span>
                  </div>
                </div>
              </div>

              <div className="trash-actions">
                <button type="button" className="trash-restore-btn " onClick={(e)=>{e.stopPropagation();item.type == "folder" ? directoryRestoreHandle(item._id) : fileRestoreHandle(item._id)}}>
                  <FaUndoAlt className="restore-icon" />
                  <span>Restore</span>
                </button>
                <button type="button" className="trash-delete-btn" onClick={(e)=>{e.stopPropagation();item.type == "folder" ? permanentDeleteDirectoryHandle(item._id) : permanentDeleteFileHandle(item._id)}}>
                  <FaTrashAlt />
                  <span>Delete forever</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </DriveUILayout>
  );
}
