import { axiosWithCreds, axiosWithoutCreds } from "./axiosInstances";

// ── Subscription Management ──
export const subcribeStorage = async (payload) =>
  axiosWithCreds.post("/subscription/create-subcription/", payload);

// ── Invoice Management ──
export const fetchInvoices = async () =>
  axiosWithCreds.get("subscription/invoices/");

export const downloadInvoicePDF = async (invoiceId) =>
  axiosWithCreds.get(`/invoices/${invoiceId}/download-pdf`, {
    responseType: "blob",
  });

export const exportAllInvoices = async () =>
  axiosWithCreds.get("/invoices/export-all", { responseType: "blob" });

// ── Subscription Actions ──
export const pauseSubscription = async () =>
  axiosWithCreds.post("/subscription/pause");

export const resumeSubscription = async () =>
  axiosWithCreds.post("/subscription/resume");

export const cancelSubscription = async () =>
  axiosWithCreds.post("/subscription/cancel");

export const getCurrentSubscription = async () =>
  axiosWithCreds.get("/subscription/current-subscription");

export const getCurrentUserPlan = async () =>
  axiosWithCreds.get("/subscription/current-plan");
