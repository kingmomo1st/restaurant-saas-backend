import { createContext, useContext, useState, useEffect } from "react";
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  firestore,
} from "../firebase";
import {
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp,
  limit,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { useDispatch } from "react-redux";
import { setUser as setReduxUser } from "../redux/userSlice";
import { db } from "../firebase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [subscription, setSubscription] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "subscriptions"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const subData = snapshot.docs[0].data();
        setSubscription(subData);
      } else {
        setSubscription(null);
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const updateUserWithClaims = async (firebaseUser) => {
    if (firebaseUser) {
      try {
        await firebaseUser.getIdTokenResult(true);
        const idTokenResult = await firebaseUser.getIdTokenResult();

        const userDocRef = doc(firestore, "users", firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        const userData = userDocSnap.exists() ? userDocSnap.data() : {};

        const role = userData.role || "user";
        const isAdmin = role === "admin" || role === "superAdmin";
        const isSuperAdmin = role === "superAdmin";
        const locationId = userData.locationId || null;

        let subscriptionPlan = "Free";
        if (locationId) {
          const subQuery = query(
            collection(firestore, "subscriptions"),
            where("locationId", "==", locationId),
            where("status", "==", "active"),
            limit(1)
          );
          const subSnap = await getDocs(subQuery);
          if (!subSnap.empty) {
            const sub = subSnap.docs[0].data();
            subscriptionPlan = sub.plan || "Free";
          }
        }

        const finalUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || "",
          emailVerified: firebaseUser.emailVerified,
          role,
          isAdmin,
          isSuperAdmin,
          locationId,
          subscriptionPlan,
        };

        setIsAdmin(isAdmin);
        setUser(finalUser);
        dispatch(setReduxUser(finalUser));
      } catch (error) {
        console.error("Error updating user with claims:", error);
        setIsAdmin(false);
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          isAdmin: false,
          isSuperAdmin: false,
        });
      }
    } else {
      setUser(null);
      setIsAdmin(false);
    }

    setLoading(false);
  };

  useEffect(() => {
    setPersistence(auth, browserSessionPersistence).catch((error) => {
      console.log("Error setting persistence:", error);
    });

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log("Firebase User State:", firebaseUser);
      updateUserWithClaims(firebaseUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    console.log("AuthContext Updated -> User:", user, "Loading:", loading);
  }, [user, loading]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      await setPersistence(auth, browserSessionPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Login successful:", userCredential.user);

      await updateUserWithClaims(userCredential.user);

      const userDocSnap = await getDoc(doc(firestore, "users", userCredential.user.uid));
      const userData = userDocSnap.exists() ? userDocSnap.data() : {};
      const role = userData.role || "user";

      if (role === "admin" || role === "superAdmin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (error) {
      console.log("Login Error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("Registration Successful:", userCredential.user);

      const newUserDoc = {
        uid: userCredential.user.uid,
        email: email,
        loyaltyPoints: 0,           // ✅ Use consistent field name
        purchaseHistory: [],
        giftcardRedemptions: [],
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(firestore, "users", userCredential.user.uid), newUserDoc);
      await updateUserWithClaims(userCredential.user);

      return userCredential;
    } catch (error) {
      console.log("Registration Error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      console.log("User logged out");
    } catch (error) {
      console.log("Logout Error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || "user",
        isAdmin,
        login,
        register,
        logout,
        loading,
        isSuperAdmin: user?.isSuperAdmin,
        locationId: user?.locationId,
        subscriptionPlan: user?.subscriptionPlan,
        subscription,
      }}
    >
      {!loading ? children : <p>Loading authentication...</p>}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}