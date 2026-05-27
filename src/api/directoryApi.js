
import { axiosWithCreds} from "./axiosInstances";

//* temporary delete folder

export const temporaryDeleteFolder=async (dirId)=>axiosWithCreds.delete(`/directory/temporary/delete/${dirId}`);


//* rename api directory
export const renameDirectory=async (renameId,renameValue)=>axiosWithCreds.patch(`/directory/${renameId}`,{name:renameValue});

//* make director starred
export const starredDirectory=async (id,payload)=>axiosWithCreds.patch(`/directory/starred/${id}`,payload);

//* fetch directory Items
export const fetchDirectoryItems=async (dirId)=>axiosWithCreds.get(`/directory/${dirId || ""}`);

