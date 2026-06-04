import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Folder,
  FileText,
  Download,
  LogIn,
  Search,
  Grid3x3,
  List,
  ChevronRight,

} from "lucide-react";
import { Loader } from "../components/common/Loadder.jsx";
import { fetchShareResources } from "@/api/shareApi.js";
import { renderFileIcon } from "@/components/common/getFileIcon.jsx";
import { formatDate } from "@/utils/formatDate.js";
import { formatFileSize } from "@/utils/formatFile.js";
import logo from "../assets/cloudnest-logo.svg";
import { viewShareFile,downloadShareFile,viewSharedDirectoryFile,downloadSharedDirectoryFile,viewSharedDirectory} from "@/api/shareApi.js";


function SharedResource() {
  const { resourceType, token } = useParams();
  const [loading, setLoading] = useState(true);
  const [resource, setResource] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [viewMode, setViewMode] = useState("list");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const openFile=async (token,fileId)=>{
    const {url}=await viewSharedDirectoryFile(token,fileId);
    window.open(url,"_blank")
  };
  const openDirectory=async (token,dirId)=>{
     const data=await viewSharedDirectory(token,dirId);
     setResource(data);
     setBreadcrumbs((current)=>[...current, data]);
     setSearchTerm("");
  }

  const openBreadcrumb = (index) => {
    const selectedResource = breadcrumbs[index];
    setResource(selectedResource);
    setBreadcrumbs((current)=>current.slice(0, index + 1));
    setSearchTerm("");
  };

  useEffect(() => {
    const fetchSharedResource = async () => {
      try {
        const data = await fetchShareResources(resourceType, token);
        setResource(data);
        setBreadcrumbs([data]);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    fetchSharedResource();
  }, [resourceType, token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <Header navigate={navigate} />
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Resource not found
            </h1>
            <p className="text-slate-600 text-lg">
              The file or folder you're looking for doesn't exist or has been
              removed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isFile = resource.type === "file";
  const filteredChildren =
    resource.children?.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || [];
  const fileCount =
    resource.children?.filter((item) => item.type !== "directory").length || 0;
  const folderCount =
    resource.children?.filter((item) => item.type === "directory").length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header navigate={navigate} />

      {/* Hero Section for Folder */}
      {!isFile && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white py-8 shadow-sm">
          <div className="max-w-5xl mx-auto px-6">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-white/20 rounded-xl backdrop-blur-sm flex-shrink-0">
                <Folder className="w-12 h-12" />
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-1">{resource.name}</h1>
                <p className="text-blue-100 text-lg">
                  {fileCount} file{fileCount !== 1 ? "s" : ""} • {folderCount}{" "}
                  folder{folderCount !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-6 py-8">
        {isFile ? (
          // ========== FILE PREVIEW ==========
          <div className="space-y-6">
            {/* File Card - Simple Horizontal Layout */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-md cursor-pointer overflow-hidden hover:shadow-lg transition-shadow"
             onClick={async ()=>{const {url}=await viewShareFile(token,resource.id);
             window.open(url, "_blank");
             }}>
              <div className="flex items-center justify-between px-6 py-4 gap-4">
                {/* Left: Icon and Name */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex-shrink-0 text-4xl">
                    {renderFileIcon(resource.extension)}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-slate-900 break-words">
                      {resource.name}
                    </h2>
                  </div>
                </div>

                {/* Right: Size, Date, and Download */}
                <div className="flex items-center gap-8 flex-shrink-0">
                  <div className="text-sm text-slate-600 text-right">
                    {formatFileSize(resource.size)}
                  </div>
                  <div className="text-sm text-slate-600 text-right min-w-max">
                    {formatDate(resource.createdAt || new Date())}
                  </div>
                  <button className="flex items-center justify-center p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600 cursor-pointer rounded-lg transition-all flex-shrink-0"
                   onClick={async (e)=>{
                     e.stopPropagation();
                     const {url}=await downloadShareFile(token);
                     window.location.href =url;
                     
                   }}>
                    <Download size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // ========== FOLDER VIEW ==========
          <div className="space-y-6">
            {breadcrumbs.length > 1 && (
              <nav className="flex items-center gap-2 text-sm text-slate-600 overflow-x-auto">
                {breadcrumbs.map((crumb, index) => {
                  const isLast = index === breadcrumbs.length - 1;

                  return (
                    <div key={crumb.id || index} className="flex items-center gap-2 flex-shrink-0">
                      {index > 0 && (
                        <ChevronRight size={16} className="text-slate-400" />
                      )}
                      <button
                        type="button"
                        onClick={() => openBreadcrumb(index)}
                        disabled={isLast}
                        className={`font-medium transition-colors ${
                          isLast
                            ? "text-slate-900 cursor-default"
                            : "text-blue-600 hover:text-blue-700"
                        }`}
                      >
                        {crumb.name}
                      </button>
                    </div>
                  );
                })}
              </nav>
            )}

            {/* Toolbar */}
            {resource.children && resource.children.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex-1 relative">
                  <Search
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Search files and folders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 placeholder-slate-500"
                  />
                </div>

                {/* View Toggle */}
                <div className="flex gap-2 bg-slate-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2.5 rounded transition-all ${
                      viewMode === "list"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                    title="List view"
                  >
                    <List size={20} />
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2.5 rounded transition-all ${
                      viewMode === "grid"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                    title="Grid view"
                  >
                    <Grid3x3 size={20} />
                  </button>
                </div>
              </div>
            )}

            {/* Files Display */}
            {resource.children && resource.children.length > 0 ? (
              viewMode === "list" ? (
                // LIST VIEW
                <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
                  {/* Table Header */}
                  <div className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-200 px-6 py-4">
                    <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      <div className="col-span-6">Name</div>
                      <div className="col-span-2">Size</div>
                      <div className="col-span-3">Modified</div>
                      <div className="col-span-1"></div>
                    </div>
                  </div>

                  {/* Rows */}
                  <div className="divide-y divide-slate-200">
                    {filteredChildren.map((item, idx) => (

                      <div
                        key={item.id || idx}
                        className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-blue-50 transition-colors group cursor-pointer"
                        onClick={()=>{item.type == 'file' ?  openFile(token,item.id):openDirectory(token,item.id)}}
                      >
                        <div className="col-span-6 flex items-center gap-3 min-w-0">
                          <div className="text-2xl flex-shrink-0">
                            {item.type === "directory" ? (
                              <Folder className="w-5 h-5 text-blue-500" />
                            ) : (
                              renderFileIcon(item.extension)
                            )}
                          </div>
                          <span className="text-slate-900 font-medium truncate hover:text-blue-600 transition-colors">
                            {item.name}
                          </span>
                        </div>
                        <div className="col-span-2 text-sm text-slate-600">
                          {formatFileSize(item.size)}
                        </div>
                        <div className="col-span-3 text-sm text-slate-600">
                          {formatDate(
                            item.modifiedAt || item.createdAt || new Date(),
                          )}
                        </div>
                        <div className="col-span-1 flex justify-end">
                          {
                            item.type == "file" ? (<button className="p-2 rounded-lg text-slate-500 hover:bg-blue-100 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all"
                            onClick={async (e)=>{
                               e.stopPropagation();
                               const {url}=await downloadSharedDirectoryFile(token,item.id);
                               window.location.href =url;
                            }}>
                            <Download size={18} />
                          </button>):""
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // GRID VIEW
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredChildren.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group"
                      onClick={()=>{item.type == 'file' ?  openFile(token,item.id):openDirectory(token,item.id,item.name)}}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="text-5xl">
                          {item.type === "directory" ? (
                            <Folder className="w-10 h-10 text-blue-500" />
                          ) : (
                            renderFileIcon(item.extension)
                          )}
                        </div>
                        {item.type == "file" ? (
                          <button
                            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-100"
                            title="Download"
                            onClick={async (e)=>{
                              e.stopPropagation();
                              const {url}=await downloadSharedDirectoryFile(token,item.id);
                              window.location.href =url;
                            }}
                          >
                            <Download size={16} className="text-slate-600" />
                          </button>
                        ) : ""}
                      </div>
                      <p className="font-semibold text-slate-900 text-sm truncate mb-1 group-hover:text-blue-600 transition-colors">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatFileSize(item.size)}
                      </p>
                    </div>
                  ))}
                </div>
              )
            ) : (
              // Empty State
              <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-16 text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Folder className="w-10 h-10 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  This folder is empty
                </h3>
                <p className="text-slate-600">No files or folders to display</p>
              </div>
            )}
          </div>
        )}
      </main>

    </div>
  );
}

function Header({ navigate }) {
  return (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="CloudNest" className="w-8 h-8" />
          <span className="text-lg font-bold text-slate-900">CloudNest</span>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all hover:shadow-lg font-medium text-sm cursor-pointer"
          onClick={() => navigate("/login")}
        >
          <LogIn size={18} />
          Sign in
        </button>
      </div>
    </div>
  );
}



export default SharedResource;
