"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { firebaseHelpers } from "@/lib/firebase";

export interface AuthUser {
  uid: string;
  email: string | null;
  fullName?: string;
  phoneNumber?: string;
  profileImage?: string;
  role?: "admin" | "employee";
  department?: string;
  position?: string;
  createdAt?: string;
  authCreated?: boolean;
  emailVerified: boolean;
  isAnonymous: boolean;
 
}

export interface AuthContextType {
  user: AuthUser | null;
  role: string | null;
  loading: boolean;
  updateUserData: (data: Partial<AuthUser>) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  updateUserData: () => {}
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubDoc: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setLoading(true);
      
      if (unsubDoc) {
        unsubDoc();
      }

      if (currentUser) {
        unsubDoc = onSnapshot(doc(db, "users", currentUser.uid), (userDoc) => {
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              uid: currentUser.uid,
              email: currentUser.email,
              emailVerified: currentUser.emailVerified,
              isAnonymous: currentUser.isAnonymous,
              fullName: userData.fullName,
              phoneNumber: userData.phoneNumber,
              profileImage: userData.profileImage,
              role: userData.role,
              department: userData.department,
              position: userData.position,
              createdAt: userData.createdAt,
              authCreated: userData.authCreated
            });
            setRole(userData.role);
            // Mark user as online
            void firebaseHelpers.setUserOnlineStatus(currentUser.uid, true);
          } else {
            setUser({
              uid: currentUser.uid,
              email: currentUser.email,
              emailVerified: currentUser.emailVerified,
              isAnonymous: currentUser.isAnonymous,
              role: "employee"
            });
            setRole("employee");
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching user data:", error);
          setUser({
            uid: currentUser.uid,
            email: currentUser.email,
            emailVerified: currentUser.emailVerified,
            isAnonymous: currentUser.isAnonymous
          });
          setRole(null);
          setLoading(false);
        });
      } else {
        setUser(null);
        setRole(null);
        setLoading(false);
      }
    });

    // Mark offline on tab/browser close
    const handleBeforeUnload = () => {
      const uid = auth.currentUser?.uid;
      if (uid) {
        // Use sendBeacon or synchronous approach for reliability
        void firebaseHelpers.setUserOnlineStatus(uid, false);
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      unsubscribeAuth();
      if (unsubDoc) unsubDoc();
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Mark offline when component unmounts (logout)
      const uid = auth.currentUser?.uid;
      if (uid) void firebaseHelpers.setUserOnlineStatus(uid, false);
    };
  }, []);

  const updateUserData = (data: Partial<AuthUser>) => {
    setUser((prevUser) => prevUser ? { ...prevUser, ...data } : prevUser);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, updateUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
