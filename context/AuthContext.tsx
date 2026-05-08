"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

// 1. Define what information our Auth system will share
export interface AuthContextType {
  user: User | null;         // The Firebase Auth user object
  role: string | null;       // The role from Firestore (admin or employee)
  loading: boolean;          // To prevent flickering while checking login status
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
});

// 2. The Provider component that wraps your app
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged is a "listener" that fires whenever a user logs in or out
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      
      if (currentUser) {
        setUser(currentUser);

        // Fetch the user's role from the 'users' collection in Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setRole(userDoc.data().role);
          } else {
            setRole("employee"); // Fallback role
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setRole(null);
        }
      } else {
        // No user is logged in
        setUser(null);
        setRole(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe(); // Clean up the listener on unmount
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. A custom hook so we can easily use auth data in any component
export const useAuth = () => useContext(AuthContext);