import { axiosWithCreds, axiosWithoutCreds } from "./axiosInstances";

export const logoutUser = async () => axiosWithCreds.post("/user/logout");

export const logoutUserFromAllDevice = async () =>
  axiosWithCreds.post("/user/logoutall");

export const currentUser = async () => axiosWithCreds.get("/user/currentUser");

export const updatePassword = async (payload) =>
  axiosWithCreds.patch("/user/password", payload);

export const updateProfile = async (data) =>
  axiosWithCreds.patch("/user/profile", data);

export const loginWithGoogle = async (id_token) =>
  axiosWithCreds.post("/auth/google-login", { id_token });

export const registerUser = async (payload) =>
  axiosWithoutCreds.post("/user/register", payload);

export const loginUser = async (payload) =>
  axiosWithCreds.post("/user/login", payload);

export const accessAllusers = async () => axiosWithCreds.get("/user");

export const logoutUserSession = async (userId) =>
  axiosWithCreds.post(`/user/${userId}`);

export const updateUserRole = async (userId, role) =>
  axiosWithCreds.patch(`/user/role/${userId}`, { role });

export const deleteUserAccount = async (userId, type) =>
  axiosWithCreds.delete(`/user/${type}delete/${userId}`);

export const userResources = async (userId) =>
  axiosWithCreds.get(`/user/${userId}/resources`);

export const userDeleteResource = async (userId, type, resourceId) =>
  axiosWithCreds.delete(`/user/${userId}/delete/${type}/${resourceId}`);

export const downloadResource = (userId, fileId) =>
  (window.location.href = `${import.meta.env.VITE_BACKEND_URL}/user/${userId}/resources/${fileId}/items?action=download`);

export const viewResource = (userId, fileId) =>
  window.open(
    `${import.meta.env.VITE_BACKEND_URL}/user/${userId}/resources/${fileId}/items`,
    "_blank",
  );

// Rename user resource (file or folder)
export const renameUserResources = async (userId, type, fileId, renameValue) =>
  axiosWithCreds.patch(`/user/${userId}/rename/${type}/${fileId}`, {
    name: renameValue,
  });

// Get nested resources in a folder
export const getNestedResources = async (folderId) =>
  axiosWithCreds.get(`/user/${folderId}/nested-resources/`);

//* search user functionality
export const searchUser= async (query) =>
  axiosWithCreds.get(`/user/search?q=${encodeURIComponent(query)}`);
