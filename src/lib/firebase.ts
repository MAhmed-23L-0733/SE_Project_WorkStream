import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore, collection, query, where, getDocs, addDoc, updateDoc, doc, getDoc, deleteDoc, Query, QueryConstraint } from "firebase/firestore";

// Firebase Configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { auth, db, app };

// Firestore Helpers
export const firebaseHelpers = {
  // User helpers
  async getUserById(userId: string) {
    const userDoc = await getDoc(doc(db, "users", userId));
    return userDoc.exists() ? { ...userDoc.data(), uid: userId } : null;
  },

  async getAllUsers() {
    const querySnapshot = await getDocs(collection(db, "users"));
    return querySnapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id }));
  },

  async updateUser(userId: string, data: Record<string, any>) {
    await updateDoc(doc(db, "users", userId), data);
  },

  async createUser(userId: string, userData: Record<string, any>) {
    await addDoc(collection(db, "users"), { ...userData, uid: userId });
  },

  // Attendance helpers
  async createAttendanceRecord(attendanceData: Record<string, any>) {
    const docRef = await addDoc(collection(db, "attendance"), {
      ...attendanceData,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  },

  async getAttendanceRecords(userId: string, constraints?: QueryConstraint[]) {
    const constraints_array = [where("userId", "==", userId), ...(constraints || [])];
    const q = query(collection(db, "attendance"), ...constraints_array);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  },

  async updateAttendanceRecord(recordId: string, data: Record<string, any>) {
    await updateDoc(doc(db, "attendance", recordId), data);
  },

  // Leave request helpers
  async createLeaveRequest(leaveData: Record<string, any>) {
    const docRef = await addDoc(collection(db, "leaveRequests"), {
      ...leaveData,
      status: "pending",
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  },

  async getLeaveRequests(userId: string, constraints?: QueryConstraint[]) {
    const constraints_array = [where("userId", "==", userId), ...(constraints || [])];
    const q = query(collection(db, "leaveRequests"), ...constraints_array);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  },

  async getAllLeaveRequests(constraints?: QueryConstraint[]) {
    const q = query(collection(db, "leaveRequests"), ...(constraints || []));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  },

  async updateLeaveRequest(requestId: string, data: Record<string, any>) {
    await updateDoc(doc(db, "leaveRequests", requestId), data);
  },

  async deleteLeaveRequest(requestId: string) {
    await deleteDoc(doc(db, "leaveRequests", requestId));
  }
};
