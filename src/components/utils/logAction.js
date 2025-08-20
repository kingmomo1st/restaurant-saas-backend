import { collection, addDoc, getFirestore } from "firebase/firestore";
const db = getFirestore();

export const logAction = async (action, message, user, meta = {}) => {
  try {
    // ✅ Clean up undefined/null values from meta
    const cleanMeta = {};
    Object.keys(meta).forEach((key) => {
      if (meta[key] !== undefined && meta[key] !== null) {
        cleanMeta[key] = meta[key];
      }
    });

    await addDoc(collection(db, "adminLogs"), {
      action,
      message,
      user: user || "anonymous",
      meta: cleanMeta,
      timestamp: new Date(),
    });

    console.log("✅ Action logged:", action);
  } catch (err) {
    console.error("❌ Failed to log action:", err);
  }
};