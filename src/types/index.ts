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
  employeeId: string;
  checkInTime: any; // Using any for serverTimestamp compatibility in TS
  checkOutTime?: any;
  location: {
    latitude: number;
    longitude: number;
  };
  photoUrl?: string;
  method: "auto" | "manual";
  distanceMeters?: number;
  deviceId?: string;
  verified: boolean;
  status: "present" | "absent" | "late";
  notes?: string;
  date: string;
  createdAt?: any;
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
}

// Dashboard metrics
export interface DashboardMetrics {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  onLeaveToday: number;
  averageAttendance: number;
}

// Geolocation types
export interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}
export interface GeofenceSettings {
  id: string;
  officeName: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters
  lastUpdated?: any;
}

export interface GeofenceEvent {
  type: "enter" | "exit";
  timestamp: number;
  coords: GeolocationCoordinates;
}
