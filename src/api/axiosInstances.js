import axios from "axios";

const BASE_URL = import.meta.env.VITE_BACKEND_URL;
const onSuccess = (response) => {
  console.log("✅ Axios Success Response:");
  console.log("  Status:", response.status);
  console.log("  Data:", response.data);
  console.log("  URL:", response.config?.url);
  return response.data;
};
const onError = (error) => {
  console.error("🔴 Axios Error Interceptor Triggered:");
  console.error("  Status:", error.response?.status);
  console.error("  Message:", error.response?.data?.message);

  const requestError = new Error(
    error.response?.data?.message || "Something went wrong",
  );
  
  requestError.status = error.response?.status;
  requestError.data = error.response?.data;

  return Promise.reject(requestError);
};

const attachResponseInterceptor = (client) => {
  client.interceptors.response.use(onSuccess, onError);
};

export const axiosWithCreds = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

export const axiosWithoutCreds = axios.create({
  baseURL: BASE_URL,
});

attachResponseInterceptor(axiosWithCreds);
attachResponseInterceptor(axiosWithoutCreds);
