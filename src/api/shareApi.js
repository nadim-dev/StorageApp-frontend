import { axiosWithCreds } from "./axiosInstances";

export const createPublicLink= async ({ resourceId, resourceType }) =>
  axiosWithCreds.post("/share/public-link", { resourceId, resourceType });


export const shareResource = async ({resourceId,resourceType,sharedWith,permission}) =>
  axiosWithCreds.post("/share/resources", {resourceId,resourceType,sharedWith,permission});


export const fetchShareResources=async(resourceType,token)=>
  axiosWithCreds.get(`share/${resourceType}/${token}`)

export const viewShareFile=async (token)=>
  axiosWithCreds.get(`/share/${token}/file`)

export const downloadShareFile=async (token)=>
  axiosWithCreds.get(`/share/${token}/file?action=download`)

//* allowing user to view file present inside directory

export const viewSharedDirectoryFile=async (token,fileId)=>
  axiosWithCreds.get(`/share/directory/${token}/file/${fileId}`)

export const downloadSharedDirectoryFile=async (token,fileId)=>
  axiosWithCreds.get(`/share/directory/${token}/file/${fileId}?action=download`)

export const viewSharedDirectory=async (token,dirId)=>
  axiosWithCreds.get(`/share/directory/${token}/directory/${dirId}`)

//* shared-with-me page api endpoint

export const getFilesSharedWithMe=async ()=>
  axiosWithCreds.get("/share/shared-with-me")

export const viewSharedFile=(fileId)=>
  axiosWithCreds.get(`/share/shared-with-me/file/${fileId}`)

export const downloadSharedWithMeFile=(fileId)=>
  axiosWithCreds.get(`/share/shared-with-me/file/${fileId}?action=download`)

export const renameSharedWithMeResource=({renameId,renameType,renameValue})=>
  axiosWithCreds.patch(`/share/shared-with-me/resource/${renameId}/rename`, { renameValue,renameType})

export const viewShareWithMedDirectory=(directoryId)=>
  axiosWithCreds.get(`/share/shared-with-me/directory/${directoryId}`)

//* shared by me page endpoint
export const sharedByMeResources=()=>
  axiosWithCreds.get("/share/shared-by-me")

export const stopSharingResource=(resourceId)=>
  axiosWithCreds.delete(`/share/shared-by-me/resource/${resourceId}`) 

export const getResourceAccess = (resourceId) =>
  axiosWithCreds.get(`/share/shared-by-me/resource/${resourceId}/access`);

export const updateResourceAccess = ({ resourceId, removeAccessIds, permissionUpdates }) =>
  axiosWithCreds.patch(`/share/shared-by-me/resource/${resourceId}/access`, {
    removeAccessIds,
    permissionUpdates,
  });
