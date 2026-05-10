// User types
export interface User {
  uid: string;
  email: string;
  fullName: string;
  role: "admin" | "employee";
  department?: string;
  position?: string;
  createdAt?: string;
  phoneNumber?: string;
  profileImage?: string;
  authCreated?: boolean;
}

// Attendance types
export interface AttendanceRecord {
  id?: string;
  userId: string;
  checkInTime: string;
  checkOutTime?: string;
  location: {
    latitude: number;
    longitude: number;
  };
  status: "present" | "absent" | "late";
  notes?: string;
  date: string;
  createdAt?: string;
}

// Leave types
export enum LeaveType {
  CASUAL = "casual",
  SICK = "sick",
  ANNUAL = "annual",
  UNPAID = "unpaid"
}

export enum LeaveStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected"
}

export interface LeaveRequest {
  id?: string;
  userId: string;
  userName?: string;
  startDate: string;
  endDate: string;
  leaveType: LeaveType;
  reason: string;
  status: LeaveStatus;
  approvedBy?: string;
  approvalDate?: string;
  createdAt?: string;
  adminRemarks?: string;
}

// Dashboard metrics
export interface DashboardMetrics {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  onLeaveToday: number;
  averageAttendance: number;
}

// Messaging types
export interface Message {
  id?: string;
  senderId: string;
  senderRole: "admin" | "employee";
  receiverId: string;
  receiverRole: "admin" | "employee";
  conversationKey: string;
  content: string;
  createdAt: string;
}

// Announcement types
export type AnnouncementPriority = "low" | "medium" | "high";
export type AnnouncementType = "timing_change" | "policy_update" | "general" | "company_change";

export interface Announcement {
  id?: string;
  title: string;
  detail: string;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  startDate: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
}

// Project and task types
export type TaskUrgency = "low" | "medium" | "high" | "critical";
export type TaskStatus = "todo" | "in_progress" | "done";

export interface Project {
  id?: string;
  title: string;
  description?: string;
  createdBy: string;
  createdByName?: string;
  memberIds?: string[];
  memberNames?: string[];
  createdAt: string;
}

export interface ProjectTask {
  id?: string;
  projectId: string;
  title: string;
  description?: string;
  urgency: TaskUrgency;
  deadline?: string;
  status: TaskStatus;
  assignedTo?: string;
  assignedToName?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

// Geolocation types
export interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

// Notification types
export interface AppNotification {
  id?: string;
  recipientId: string;
  title: string;
  message: string;
  type: "message" | "project" | "attendance" | "task" | "leave" | "general";
  read: boolean;
  createdAt: string;
  link?: string;
}
