import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaStar, FaRegStar, FaClock, FaFolder } from "react-icons/fa";
import DriveUILayout from "./components/DriveUILayout";
import { renderFileIcon } from "./components/common/getFileIcon";
import { formatDate } from "./utils/formatDate";
import { formatFileSize } from "./utils/formatFile";
import { getStarredResources, starredFile, viewFile } from "./api/fileApi";
import { starredDirectory } from "./api/directoryApi";

import "./DirectoryView.css";
import "./StarredPage.css";

function StarredPage() {
  const navigate = useNavigate();
  const [starredItems, setStarredItems] = useState([]);
  const [allStarredItems,setallStarredItems]=useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [query,setQuery]=useState("");


  const fetchStarredResources = useCallback(async () => {
    console.log("fetchStarredResources function is running");
    setIsLoading(true);
    setError("");
    try {
      const starredResources= await getStarredResources();
      console.log("starred resources",starredResources);
      setStarredItems(starredResources);
      setallStarredItems(starredResources)
    } catch (err) {
      if (err.status== 401) {
        navigate("/logout");
      }
      setError("Unable to load starred resources right now.");
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchStarredResources();
  }, []);

  const handleUnstar = async (itemId, isDirectory) => {
    const previousItems = starredItems;
    setStarredItems((prev) => prev.filter((item) => (item._id || item.id) !== itemId));

    try {
      if (isDirectory) {
        await starredDirectory(itemId, false);
      } else {
        await starredFile(itemId, false);
      }
    } catch (err) {
      setStarredItems(previousItems);
    }
  };

  useEffect(()=>{
  if(!query)
    setStarredItems(allStarredItems)
  setStarredItems((prev)=>{
    return  prev.filter(({name})=>name.toLowerCase().includes(query.toLowerCase()))
  })
},[query])


function handleOpenResource(item) {
    if (!item._id) return;
    const resourceId =item._id;
    if (item.isDirectory) {
      navigate(`/directory/${resourceId}`);
      return;
    }
    viewFile(resourceId);
  }

  const folders = starredItems.filter((item) => item.isDirectory);
  const files = starredItems.filter((item) => !item.isDirectory);
  
  return (
    <DriveUILayout active="starred" headerMode="trash" query={query} setQuery={setQuery}>
      <section className="starred-shell">
        <div className="starred-head">
          <div className="starred-title-wrap">
            <p className="starred-kicker">
              <FaStar />
              <span>Favorites</span>
            </p>
            <h2>Your starred essentials, ready when you are.</h2>
          </div>
        </div>

        {error && <p className="starred-message starred-message-error">{error}</p>}

        {isLoading ? (
          <div className="starred-empty">
            <FaClock className="starred-empty-icon" />
            <h3>Loading your starred resources...</h3>
          </div>
        ) : starredItems.length === 0 ? (
          <div className="starred-empty">
            <FaRegStar className="starred-empty-icon" />
            <h3>No starred resources yet</h3>
            <p>Mark important folders/files with a star and they will appear here.</p>
          </div>
        ) : (
          <div className="directory-content-board">
            <section className="resource-section">
              <div className="resource-section-head">
                <h2>Folders</h2>
                <span>{folders.length}</span>
              </div>
              {folders.length === 0 ? (
                <p className="resource-empty">No starred folders yet.</p>
              ) : (
                <div className="directory-list directory-grid folders-grid">
                  {folders.map((item) => (
                    <div
                      key={crypto.randomUUID()}
                      className="list-item hoverable-row folder-card group"
                      onClick={() => handleOpenResource(item)}
                    >
                      <div className="item-card-top">
                        <div className="item-icon-wrap">
                          <FaFolder className="folder-icon" />
                        </div>
                        <div className="item-top-actions">
                          <FaStar
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnstar(item._id, true);
                            }}
                            className="cursor-pointer transition-all duration-300 text-yellow-400 opacity-100 scale-110"
                          />
                        </div>
                      </div>
                      <div className="item-meta">
                        <span className="item-name" title={item.name}>
                          {item.name}
                        </span>
                        <span className="item-subline">Directory</span>
                        <span className="item-submeta">
                          Folder | Updated{" "}
                          {item.updatedAt || item.createdAt
                            ? formatDate(item.updatedAt || item.createdAt)
                            : "recently"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="resource-section">
              <div className="resource-section-head">
                <h2>Files</h2>
                <span>{files.length}</span>
              </div>
              {files.length === 0 ? (
                <p className="resource-empty">No starred files yet.</p>
              ) : (
                <div className="directory-list directory-grid files-grid">
                  {files.map((item) => (
                    <div
                      key={item._id }
                      className="list-item hoverable-row file-card group"
                      onClick={() => handleOpenResource(item)}
                    >
                      <div className="item-card-top">
                        <div className="item-icon-wrap">{renderFileIcon(item.extension)}</div>
                        <div className="item-top-actions">
                          <FaStar
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnstar(item._id || item.id, false);
                            }}
                            className="cursor-pointer transition-all duration-300 text-yellow-400 opacity-100 scale-110"
                          />
                        </div>
                      </div>
                      <div className="item-meta">
                        <span className="item-name" title={item.name}>
                          {item.name}
                        </span>
                        <span className="item-subline">{item.extension ? `${item.extension} file` : "File"}</span>
                        <span className="item-submeta">
                          {formatFileSize(Number(item?.size) || 0)} | Updated{" "}
                          {item.updatedAt || item.createdAt
                            ? formatDate(item.updatedAt || item.createdAt)
                            : "recently"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </section>
    </DriveUILayout>
  );
}

export default StarredPage;
