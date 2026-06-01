import { axiosWithCreds } from "./axiosInstances";

export const createPublicLink= async ({ resourceId, resourceType }) =>
  axiosWithCreds.post("/share/public-link", { resourceId, resourceType });

