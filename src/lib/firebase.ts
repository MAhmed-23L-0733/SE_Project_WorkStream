import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, Auth, createUserWithEmailAndPassword, deleteUser, signOut } from "firebase/auth";
import { getFirestore, Firestore, collection, query, where, getDocs, addDoc, updateDoc, doc, getDoc, deleteDoc, QueryConstraint } from "firebase/firestore";
import { Message, Project, ProjectTask, TaskStatus, TaskUrgency, User } from "@/types";

interface Department {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { auth, db, app };

const getConversationKey = (userAId: string, userBId: string) => {
  return [userAId, userBId].sort().join("_");
};

export const firebaseHelpers = {
  async getUserById(userId: string): Promise<User | null> {
    const userDoc = await getDoc(doc(db, "users", userId));
    return userDoc.exists() ? { ...userDoc.data(), uid: userId } as User : null;
  },

  async getAllUsers(): Promise<User[]> {
    const querySnapshot = await getDocs(collection(db, "users"));
    return querySnapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as User));
  },

  async getUsersByRole(role: "admin" | "employee"): Promise<User[]> {
    const usersQuery = query(collection(db, "users"), where("role", "==", role));
    const querySnapshot = await getDocs(usersQuery);
    return querySnapshot.docs.map((docSnapshot) => ({
      ...docSnapshot.data(),
      uid: docSnapshot.id
    } as User));
  },

  async getAdmins(): Promise<User[]> {
    return this.getUsersByRole("admin");
  },

  async getEmployees(): Promise<User[]> {
    return this.getUsersByRole("employee");
  },

  async sendMessage(data: {
    senderId: string;
    senderRole: "admin" | "employee";
    receiverId: string;
    receiverRole: "admin" | "employee";
    content: string;
  }) {
    const trimmedContent = data.content.trim();
    if (!trimmedContent) {
      throw new Error("Message content is required");
    }

    const docRef = await addDoc(collection(db, "messages"), {
      senderId: data.senderId,
      senderRole: data.senderRole,
      receiverId: data.receiverId,
      receiverRole: data.receiverRole,
      conversationKey: getConversationKey(data.senderId, data.receiverId),
      content: trimmedContent,
      createdAt: new Date().toISOString()
    });

    return docRef.id;
  },

  async getConversationMessages(currentUserId: string, otherUserId: string): Promise<Message[]> {
    const conversationQuery = query(
      collection(db, "messages"),
      where("conversationKey", "==", getConversationKey(currentUserId, otherUserId))
    );

    const querySnapshot = await getDocs(conversationQuery);
    return querySnapshot.docs.map((docSnapshot) => ({
      id: docSnapshot.id,
      ...docSnapshot.data()
    } as Message)).sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  },

  async createProject(projectData: {
    title: string;
    description?: string;
    createdBy: string;
    createdByName?: string;
  }) {
    const docRef = await addDoc(collection(db, "projects"), {
      title: projectData.title.trim(),
      description: projectData.description?.trim() || "",
      createdBy: projectData.createdBy,
      createdByName: projectData.createdByName || "",
      createdAt: new Date().toISOString()
    });

    return docRef.id;
  },

  async getAllProjects(): Promise<Project[]> {
    const querySnapshot = await getDocs(collection(db, "projects"));
    return querySnapshot.docs
      .map((docSnapshot) => ({
        id: docSnapshot.id,
        ...docSnapshot.data()
      } as Project))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async createTask(taskData: {
    projectId: string;
    title: string;
    description?: string;
    urgency: TaskUrgency;
    deadline?: string;
    assignedTo?: string;
    assignedToName?: string;
    createdBy: string;
    createdByName?: string;
  }) {
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, "tasks"), {
      projectId: taskData.projectId,
      title: taskData.title.trim(),
      description: taskData.description?.trim() || "",
      urgency: taskData.urgency,
      deadline: taskData.deadline || "",
      status: "todo",
      assignedTo: taskData.assignedTo || "",
      assignedToName: taskData.assignedToName || "",
      createdBy: taskData.createdBy,
      createdByName: taskData.createdByName || "",
      createdAt: now,
      updatedAt: now
    });

    return docRef.id;
  },

  async getProjectTasks(projectId: string): Promise<ProjectTask[]> {
    const taskQuery = query(collection(db, "tasks"), where("projectId", "==", projectId));
    const querySnapshot = await getDocs(taskQuery);
    return querySnapshot.docs
      .map((docSnapshot) => ({
        id: docSnapshot.id,
        ...docSnapshot.data()
      } as ProjectTask))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  async updateTask(taskId: string, data: Partial<ProjectTask>) {
    await updateDoc(doc(db, "tasks", taskId), {
      ...data,
      updatedAt: new Date().toISOString()
    });
  },

  async updateTaskStatus(taskId: string, status: TaskStatus) {
    await updateDoc(doc(db, "tasks", taskId), {
      status,
      updatedAt: new Date().toISOString()
    });
  },

  async assignTask(taskId: string, assignedTo: string, assignedToName: string) {
    await updateDoc(doc(db, "tasks", taskId), {
      assignedTo,
      assignedToName,
      updatedAt: new Date().toISOString()
    });
  },

  async updateUser(userId: string, data: Record<string, any>) {
    await updateDoc(doc(db, "users", userId), data);
  },

  async deleteUser(userId: string) {
    try {
      // Delete from Firestore first
      await deleteDoc(doc(db, "users", userId));
      
      // Attempt to delete from Firebase Auth if it's the current user
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.uid === userId) {
        await deleteUser(currentUser);
        console.log(`User ${userId} deleted from both database and Auth`);
      } else {
        console.log(`User ${userId} deleted from database. Auth account remains (requires admin privileges to delete other users)`);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  },

  async createUser(userId: string, userData: Record<string, any>) {
    await addDoc(collection(db, "users"), { ...userData, uid: userId });
  },

  async addEmployee(employeeData: Record<string, any>) {
    try {
      // Generate a unique ID for the employee
      const employeeId = doc(collection(db, "users")).id;

      // Only create Firestore document - Auth account will be created on first login
      await addDoc(collection(db, "users"), {
        uid: employeeId, // Use generated ID as uid
        fullName: employeeData.fullName,
        email: employeeData.email,
        department: employeeData.department || "",
        position: employeeData.position || "",
        role: employeeData.role || "employee",
        dateOfJoin: employeeData.dateOfJoin || "",
        createdAt: new Date().toISOString(),
        authCreated: false // Flag to indicate Auth account not yet created
      });

      return employeeId;
    } catch (error) {
      console.error("Error adding employee:", error);
      throw error;
    }
  },

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
  },

  async getAllAttendanceRecords(constraints?: QueryConstraint[]) {
    const q = query(collection(db, "attendance"), ...(constraints || []));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  },

  async getDashboardMetrics() {
    const today = new Date().toISOString().split('T')[0];
    
    
    const usersSnapshot = await getDocs(
      query(collection(db, "users"), where("role", "==", "employee"))
    );
    const totalEmployees = usersSnapshot.size;

    
    const attendanceSnapshot = await getDocs(
      query(collection(db, "attendance"), where("date", "==", today))
    );
    const attendanceRecords = attendanceSnapshot.docs.map(doc => doc.data());
    
    const presentToday = attendanceRecords.filter(r => r.status === "present").length;
    const absentToday = attendanceRecords.filter(r => r.status === "absent").length;

    
    const leaveRequestsSnapshot = await getDocs(
      query(collection(db, "leaveRequests"), where("status", "==", "approved"))
    );
    const leaveRecords = leaveRequestsSnapshot.docs.map(doc => doc.data());
    const onLeaveToday = leaveRecords.filter(
      r => r.startDate <= today && r.endDate >= today
    ).length;

    
    const allAttendanceSnapshot = await getDocs(collection(db, "attendance"));
    const allRecords = allAttendanceSnapshot.docs.map(doc => doc.data());
    const presentDays = allRecords.filter(r => r.status === "present").length;
    const totalDays = allRecords.length || 1;
    const averageAttendance = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    return {
      totalEmployees,
      presentToday,
      absentToday,
      onLeaveToday,
      averageAttendance
    };
  },

  // Department management functions
  async createDepartment(departmentData: Record<string, any>) {
    const docRef = await addDoc(collection(db, "departments"), {
      ...departmentData,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  },

  async getAllDepartments() {
    const querySnapshot = await getDocs(collection(db, "departments"));
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id,
      name: doc.data().name || "",
      description: doc.data().description || "",
      createdAt: doc.data().createdAt || ""
    } as Department));
  },

  async updateDepartment(departmentId: string, data: Record<string, any>) {
    await updateDoc(doc(db, "departments", departmentId), data);
  },

  async deleteDepartment(departmentId: string) {
    // First, get the department details to know the name
    const departmentDoc = await getDoc(doc(db, "departments", departmentId));
    if (!departmentDoc.exists()) {
      throw new Error("Department not found");
    }
    const departmentData = departmentDoc.data();
    const departmentName = departmentData.name;

    // Find all employees in this department and reset their department and position
    const usersQuery = query(collection(db, "users"), where("department", "==", departmentName));
    const usersSnapshot = await getDocs(usersQuery);
    
    const updatePromises = usersSnapshot.docs.map(userDoc => 
      updateDoc(doc(db, "users", userDoc.id), {
        department: null,
        position: null
      })
    );

    // Wait for all employee updates to complete
    await Promise.all(updatePromises);

    // Then delete the department
    await deleteDoc(doc(db, "departments", departmentId));
  }
};
