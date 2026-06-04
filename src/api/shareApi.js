import { axiosWithCreds } from "./axiosInstances";

export const createPublicLink= async ({ resourceId, resourceType }) =>
  axiosWithCreds.post("/share/public-link", { resourceId, resourceType });

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

