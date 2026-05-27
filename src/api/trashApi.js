import { axiosWithCreds } from "./axiosInstances";

//* access trash item
export const accessTrashItem = async () => axiosWithCreds.get("/trash/content");

//* restore deleted file
export const restoreFile = async (fileId) =>
  axiosWithCreds.patch(`/trash/restore/file/${fileId}`);

//* restore Deleted folder
export const restoreDirectory = async (dirId) =>
  axiosWithCreds.patch(`/trash/restore/directory/${dirId}`);

//* permanent delete file
export const permanentDeleteFile = async (fileId) =>
  axiosWithCreds.delete(`/file/${fileId}`);

//* permanent Delete Directory
export const permanentDeleteDirectory = async (dirId) =>
  axiosWithCreds.delete(`/directory/${dirId}`);

//* access trash users
export const accessDeletedUsers = async () => axiosWithCreds.get("/user/trash");

//* permanently delete user
export const permanentDeleteUserAccount = async (userId) =>axiosWithCreds.delete(`/user/harddelete/${userId}`);

//* recover deleted user
export const recoverDeletedUserAccount = async (userId) =>axiosWithCreds.patch(`/user/recover/${userId}`);
