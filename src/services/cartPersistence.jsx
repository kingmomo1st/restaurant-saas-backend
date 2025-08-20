import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { firestore } from "../firebase";

export const saveCartToFirestore = async (userId, cartItems, email, name) => {
  if (!userId || cartItems.length === 0) return;

  try {
    await setDoc(doc(firestore, "carts", userId), {
      items: cartItems,
      updatedAt: serverTimestamp(),
      email,
      name,
      checkedOut: false,
      reminderSent: false,
    });
    console.log("✅ Cart saved to Firestore.");
  } catch (err) {
    console.error("❌ Failed to save cart:", err);
  }
};