export function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();

  // Normalize both dates to local midnight
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const thatDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffDays = (today - thatDay) / (1000 * 60 * 60 * 24);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

// utils/subscriptionUtils.js

export const formatBillingDate = (date) => {
  if (!date) return "—";
  const parsedDate = new Date(date);

  return parsedDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

export const formatShortDate = (date) => {
  if (!date) return "—";
  const parsedDate = new Date(date);

  return parsedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

export const getDaysRemaining = (endDate) => {
  const parsed = new Date(endDate);
  return Math.floor((parsed - new Date())/ (1000 * 60 * 60 * 24));
};

export const getSubscriptionProgress = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  
  const total = end.getTime() - start.getTime();
  const elapsed = new Date().getTime() - start.getTime();

  return Math.min(100, Math.max(0, (elapsed / total) * 100));
};

export const formatDateInNumber = (milliseconds) => {

   const date = new Date(milliseconds);

   const day = String(
      date.getDate()
   ).padStart(2, "0");

   const month = String(
      date.getMonth() + 1
   ).padStart(2, "0");

   const year = date.getFullYear();

   return `${day}/${month}/${year}`;
};
