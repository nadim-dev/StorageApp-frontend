import { axiosWithCreds} from "./axiosInstances";
const BASE_URL=import.meta.env.VITE_BACKEND_URL;

//* Accessing all starred files
export const getStarredResources=async ()=>axiosWithCreds.get("/user/starred");

//* temporary delete file
export const temporaryDeleteFile=async (fileId)=>axiosWithCreds.delete(`/file/temporary/delete/${fileId}`);

//* download file 
export const downloadFile=async (fileId)=> axiosWithCreds.get(`/file/${fileId}?action=download`);

//* open file
export const viewFile=(fileId)=> axiosWithCreds.get(`/file/${fileId}`);

//* api for showing recent opened file 
export const recentFile=async ()=>axiosWithCreds.get("/file/recent");

//*api for renaming file

export const renameFile=async (renameId,renameValue)=>axiosWithCreds.patch(`/file/${renameId}`,{name:renameValue});

//* make file starred

export const starredFile=async (id,payload)=>axiosWithCreds.patch(`/file/starred/${id}`,payload);

//* get signed url of s3 bucket

export const getSignedURL=async (data)=>axiosWithCreds.post("/file/uploads/initiate",data)

export const markUploadComplete=async(payload)=>axiosWithCreds.post("/file/uploads/complete",payload)

export const fileUploadFail=async(payload)=>axiosWithCreds.post("/file/uploads/failed",payload);

export const fetchDuplicateFiles=async ()=>axiosWithCreds.get("/file/duplicate-resource")

//* delete duplicates of file at once
export const deleteAllDuplicates=async (payload)=>axiosWithCreds.delete("/file/duplicate/delete-all",{data:payload})

//* move duplicates to trash
export const moveDuplicatesToTrash=async (payload)=>axiosWithCreds.patch("/file/duplicates/move-to-trash",{data:payload});
//* fetch old resources
export const fetchOldResources=async ()=>axiosWithCreds.get("/file/old-resources");

//* fetch large file
export const fetchLargeFiles=async ()=>axiosWithCreds.get("file/large-file");