// ✅ Toggle this to true only when selling SaaS
const saasRestrictionsEnabled = false;

// ✅ Feature access per plan
const planAccess = {
  Free: [],
  Basic: ["analytics", "cmsReservations", "orders"],
  Pro: [
    "analytics",
    "cmsReservations",
    "events",
    "orders",
    "reviews",
    "giftcards",
    "privateDining",
  ],
  Enterprise: [
    "analytics",
    "cmsReservations",
    "events",
    "orders",
    "reviews",
    "giftcards",
    "privateDining",
    "loyalty",
    "calendar",
    "pos",
    "franchiseMode",
  ],
};

// ✅ Main export: check if user has access to a feature
export const hasAccess = (plan, feature) => {
  if (!saasRestrictionsEnabled) return true; // 🔓 Default to unlocked during dev
  return planAccess[plan]?.includes(feature);
};