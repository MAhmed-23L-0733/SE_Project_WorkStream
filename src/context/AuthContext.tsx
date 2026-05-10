"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

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
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
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
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser({
            uid: currentUser.uid,
            email: currentUser.email,
            emailVerified: currentUser.emailVerified,
            isAnonymous: currentUser.isAnonymous
          });
          setRole(null);
        }
      } else {
        setUser(null);
        setRole(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
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
