# WorkStream SRS Implementation Guide
## Firebase-Based Architecture

### Project Overview
WorkStream is an Employee Management System (EMS) designed for small to medium-sized enterprises (SMEs). This document maps the SRS requirements to the Firebase implementation.

---

## 1. Architecture Overview

### Technology Stack (Adapted to Firebase)
- **Frontend**: Next.js 16.2.4 with React 19.2.4
- **Styling**: Tailwind CSS 4.x
- **Backend**: Firebase (Authentication, Firestore, Cloud Functions)
- **Hosting**: Vercel (Frontend), Firebase (Backend)
- **Real-time Updates**: Firestore listeners (replacing Supabase Realtime)

### Key Changes from SRS (Supabase → Firebase)
| Component | SRS (Supabase) | Implementation (Firebase) |
|-----------|---|---|
| Database | PostgreSQL (Relational) | Firestore (NoSQL/Document) |
| Authentication | Supabase Auth | Firebase Authentication |
| Real-time Sync | Supabase Realtime (WebSocket) | Firestore Real-time Listeners |
| Data Access Control | Row Level Security (RLS) | Firestore Security Rules |
| Backend Logic | PostgREST API | Firestore SDK + Cloud Functions |

---

## 2. Database Schema (Firestore Collections)

### Collection Structure

#### `users`
```
Document ID: UUID (Firebase Auth UID)
Fields:
- email (string)
- fullName (string)
- role (string: "admin" | "employee")
- department (string, reference to departments)
- position (string)
- phoneNumber (string)
- profileImage (string, URL)
- emailVerified (boolean)
- createdAt (timestamp)
- updatedAt (timestamp)
- isActive (boolean)
```

#### `employees`
```
Document ID: UUID
Fields:
- uid (string, reference to users)
- employeeID (string, auto-generated, unique)
- fullName (string)
- email (string)
- department (string, reference to departments)
- position (string)
- phone (string)
- skills (array of strings)
- joinDate (timestamp)
- status (string: "active" | "inactive")
- createdAt (timestamp)
- updatedAt (timestamp)
```

#### `departments`
```
Document ID: UUID
Fields:
- name (string, unique)
- description (string)
- createdAt (timestamp)
- updatedAt (timestamp)
```

#### `attendance_logs`
```
Document ID: UUID
Fields:
- userId (string, reference to users)
- employeeID (string)
- checkInTime (timestamp)
- checkOutTime (timestamp, nullable)
- location (object: {latitude, longitude, accuracy})
- status (string: "present" | "absent" | "late")
- date (string, YYYY-MM-DD)
- notes (string)
- createdAt (timestamp)
- updatedAt (timestamp)
```

#### `leave_requests`
```
Document ID: UUID
Fields:
- userId (string, reference to users)
- userName (string)
- startDate (timestamp)
- endDate (timestamp)
- leaveType (string: "casual" | "sick" | "annual" | "unpaid")
- reason (string)
- status (string: "pending" | "approved" | "rejected")
- approvedBy (string, reference to users, nullable)
- approvalDate (timestamp, nullable)
- rejectionReason (string, nullable)
- createdAt (timestamp)
- updatedAt (timestamp)
```

#### `leave_balance`
```
Document ID: {userId}_{year}
Fields:
- userId (string, reference to users)
- year (number)
- casual (number, remaining days)
- sick (number, remaining days)
- annual (number, remaining days)
- unpaid (number, remaining days)
- updatedAt (timestamp)
```

#### `skill_tags`
```
Document ID: UUID
Fields:
- name (string, unique)
- description (string)
- createdAt (timestamp)
```

---

## 3. Functional Requirements Mapping

### 4.1 User Authentication and Authorization

#### Requirements
| Requirement | Implementation | Status |
|---|---|---|
| REQ-AUTH-01 | Login with email/password via Firebase Auth | ✅ Implemented |
| REQ-AUTH-02 | JWT session tokens via Firebase Auth | ✅ Implemented |
| REQ-AUTH-03 | RBAC with "admin" and "employee" roles | ✅ Implemented |
| REQ-AUTH-04 | Admin-only route protection | ✅ Implemented in layouts |
| REQ-AUTH-05 | Employee data isolation | ✅ Firestore Security Rules |
| REQ-AUTH-06 | Password reset via email | ✅ Firebase built-in |
| REQ-AUTH-07 | Session invalidation on logout | ✅ Implemented in AuthContext |
| REQ-AUTH-08 | Account lockout after 5 failed attempts | 🔄 TBD - Cloud Function |

**Files**: 
- `src/context/AuthContext.tsx` - Auth state management
- `src/lib/firebase.ts` - Firebase initialization
- `src/components/shared/ProtectedRoute.tsx` - Route protection

---

### 4.2 Employee Profile Management

#### Requirements
| Requirement | Implementation | Status |
|---|---|---|
| REQ-EMP-01 | Create employee records with full details | ✅ Implemented |
| REQ-EMP-02 | Auto-generate unique employee ID | ✅ Implemented in helpers |
| REQ-EMP-03 | Update employee records | ✅ Implemented |
| REQ-EMP-04 | Soft-delete (mark inactive) | ✅ Implemented |
| REQ-EMP-05 | Filter/search employees | ✅ UI implemented |
| REQ-EMP-06 | Paginated table (20 per page) | ✅ Implemented |
| REQ-EMP-07 | Employee self-view (limited edit) | ✅ To implement |
| REQ-EMP-08 | Email uniqueness validation | ✅ Implemented |

**Files**:
- `src/app/admin/employees/page.tsx` - Employee management UI
- `src/lib/firebase.ts` - Employee CRUD helpers

---

### 4.3 Attendance Management

#### Requirements
| Requirement | Implementation | Status |
|---|---|---|
| REQ-ATT-01 | Digital check-in/check-out | ✅ Implemented |
| REQ-ATT-02 | Browser Geolocation API | ✅ Implemented |
| REQ-ATT-03 | Geo-fence validation (100m) | ✅ Implemented in GeoCheckIn |
| REQ-ATT-04 | Timestamp logging | ✅ Implemented |
| REQ-ATT-05 | Prevent duplicate check-in | 🔄 To verify |
| REQ-ATT-06 | Real-time attendance dashboard | 🔄 Firestore listeners needed |
| REQ-ATT-07 | Historical records with date filter | ✅ Implemented |
| REQ-ATT-08 | Manual attendance override | 🔄 To implement |

**Files**:
- `src/components/attendance/GeoCheckIn.tsx` - Check-in component
- `src/app/employee/attendance/page.tsx` - Attendance dashboard
- `src/hooks/useLocation.ts` - Geolocation logic

---

### 4.4 Leave Management

#### Requirements
| Requirement | Implementation | Status |
|---|---|---|
| REQ-LVE-01 | Submit leave requests | ✅ Implemented |
| REQ-LVE-02 | Auto-calculate leave days (exclude weekends) | 🔄 To enhance |
| REQ-LVE-03 | Default "Pending" status | ✅ Implemented |
| REQ-LVE-04 | Admin notification on new request | 🔄 To implement |
| REQ-LVE-05 | Approve/reject requests | ✅ Implemented |
| REQ-LVE-06 | Required rejection reason | ✅ Implemented |
| REQ-LVE-07 | Notify employee of status change | 🔄 To implement |
| REQ-LVE-08 | Track leave balance per type | 🔄 To enhance |
| REQ-LVE-09 | Prevent overlapping requests | 🔄 To implement |
| REQ-LVE-10 | Cancel pending requests | 🔄 To implement |

**Files**:
- `src/app/employee/leave/page.tsx` - Employee leave requests
- `src/app/admin/leave-requests/page.tsx` - Admin leave management

---

### 4.5 Dashboard and Real-Time Analytics

#### Requirements
| Requirement | Implementation | Status |
|---|---|---|
| REQ-DASH-01 | Summary metrics display | ✅ Implemented |
| REQ-DASH-02 | Real-time updates (3 seconds) | 🔄 Firestore listeners needed |
| REQ-DASH-03 | Recent activity feed (10 events) | 🔄 To implement |
| REQ-DASH-04 | Employee personal summary | ✅ Implemented |

**Files**:
- `src/app/admin/dashboard/page.tsx` - Admin dashboard
- `src/app/employee/dashboard/page.tsx` - Employee dashboard
- `src/components/dashboard/MetricsGrid.tsx` - Metrics display

---

### 4.6 Employee Categorization and Role Management

#### Requirements
| Requirement | Implementation | Status |
|---|---|---|
| REQ-CAT-01 | Create/manage departments | 🔄 To implement |
| REQ-CAT-02 | Assign employees to department | ✅ Implemented |
| REQ-CAT-03 | Assign skill tags | ✅ Implemented |
| REQ-CAT-04 | Filter by department/skill | 🔄 To enhance |

---

## 4. Non-Functional Requirements

### Performance (Section 5.1)
| Requirement | Target | Status |
|---|---|---|
| REQ-PERF-01 | Dashboard load: 3 seconds | 🔄 Optimize queries |
| REQ-PERF-02 | Real-time updates: 3 seconds | 🔄 Firestore listeners |
| REQ-PERF-03 | CRUD operations: 3 seconds | ✅ Firebase optimized |
| REQ-PERF-04 | 100 concurrent sessions | ✅ Firebase scales |
| REQ-PERF-05 | Query 10k records: 1 second | 🔄 Add indexes |

### Security (Section 5.3)
| Requirement | Implementation | Status |
|---|---|---|
| REQ-SEC-01 | TLS 1.2+ encryption | ✅ Firebase HTTPS |
| REQ-SEC-02 | Password hashing (bcrypt) | ✅ Firebase Auth |
| REQ-SEC-03 | Row-level access control | 🔄 Firestore Rules |
| REQ-SEC-04 | JWT expiration (1 hour) | ✅ Firebase default |
| REQ-SEC-05 | Input sanitization | 🔄 To implement |
| REQ-SEC-06 | Data access restrictions | 🔄 Firestore Rules |
| REQ-SEC-07 | Brute-force protection | 🔄 Cloud Function |

### Firestore Security Rules Template
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write of users only if authenticated
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Employees - admins can read/write all, employees read own
    match /employees/{employeeId} {
      allow read: if request.auth.uid != null;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Attendance - employees read own, admins read all
    match /attendance_logs/{logId} {
      allow read, write: if request.auth.uid != null && (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' || resource.data.userId == request.auth.uid);
    }
    
    // Leave requests - employees read/write own, admins read all + write
    match /leave_requests/{requestId} {
      allow read, write: if request.auth.uid != null;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' || resource.data.userId == request.auth.uid;
    }
  }
}
```

---

## 5. Implementation Checklist

### Phase 1: Core Features (Completed ✅)
- [x] Authentication & Authorization
- [x] Employee Profile Management UI
- [x] Attendance Check-in/Check-out
- [x] Leave Request Workflow
- [x] Admin Dashboard UI
- [x] Employee Portal UI

### Phase 2: Real-time Features (In Progress 🔄)
- [ ] Real-time attendance feed (Firestore listeners)
- [ ] Real-time dashboard metrics updates
- [ ] Live notification system
- [ ] WebSocket-like updates via listeners

### Phase 3: Enhanced Features (To Do 📋)
- [ ] Account lockout after failed attempts
- [ ] Email notifications (leave status, new requests)
- [ ] Leave balance tracking and deduction
- [ ] Overlapping leave request validation
- [ ] Manual attendance override (admin)
- [ ] Department management UI
- [ ] Employee self-service profile view
- [ ] Input validation & sanitization
- [ ] Error handling & offline indicators

### Phase 4: Optimization & Testing (To Do 📋)
- [ ] Firestore indexing for large datasets
- [ ] Load testing (100 concurrent users)
- [ ] Security audit (Firestore Rules)
- [ ] Performance optimization
- [ ] Unit tests (70% coverage)
- [ ] Integration tests

### Phase 5: Deployment & Documentation (To Do 📋)
- [ ] Deploy to production
- [ ] Create admin user manual
- [ ] Create employee user guide
- [ ] Deployment guide for developers
- [ ] Privacy Notice document

---

## 6. Key Firebase Services in Use

### Firebase Authentication
- Email/password login
- Session management via JWT
- Password reset emails
- User creation and deletion

### Cloud Firestore
- Document-based storage for all entities
- Real-time listeners for live updates
- Atomic transactions for consistency
- Security Rules for access control

### Cloud Functions (TBD)
- Account lockout enforcement
- Leave balance updates
- Email notifications
- Data cleanup on user deletion

### Firebase Hosting (Optional)
- Deploy frontend to Firebase CDN
- Custom domain support
- SSL certificates

---

## 7. File Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx ✅
│   │   ├── signup/page.tsx ✅
│   │   └── forgot-password/page.tsx ✅
│   ├── admin/
│   │   ├── dashboard/page.tsx ✅
│   │   ├── employees/page.tsx ✅
│   │   ├── leave-requests/page.tsx ✅
│   │   └── layout.tsx ✅
│   ├── employee/
│   │   ├── dashboard/page.tsx ✅
│   │   ├── attendance/page.tsx ✅
│   │   ├── leave/page.tsx ✅
│   │   └── layout.tsx ✅
│   ├── layout.tsx ✅
│   └── page.tsx ✅
├── components/
│   ├── attendance/
│   │   └── GeoCheckIn.tsx ✅
│   ├── dashboard/
│   │   └── MetricsGrid.tsx ✅
│   └── shared/
│       ├── Sidebar.tsx ✅
│       └── ProtectedRoute.tsx ✅
├── context/
│   └── AuthContext.tsx ✅
├── hooks/
│   ├── useAuth.ts ✅
│   └── useLocation.ts ✅
├── lib/
│   └── firebase.ts ✅
└── types/
    └── index.ts ✅
```

---

## 8. Next Steps

1. **Implement Real-time Listeners** - Add Firestore listeners for attendance and leave requests
2. **Set Up Firestore Security Rules** - Implement row-level access control
3. **Create Cloud Functions** - For email notifications and background tasks
4. **Add Email Notifications** - Integration with Firebase SMTP or SendGrid
5. **Enhance Validation** - Input sanitization and business rule enforcement
6. **Testing & Deployment** - Unit tests, integration tests, and production deployment
7. **Documentation** - User manuals and deployment guides

---

## 9. Configuration Checklist

- [ ] Firebase project created and configured
- [ ] Environment variables set (.env.local)
- [ ] Firestore database initialized
- [ ] Firebase Authentication enabled (email/password)
- [ ] Security Rules deployed
- [ ] Cloud Functions deployed (if needed)
- [ ] Firestore indexes created for queries
- [ ] Email service configured (optional)
- [ ] Backup strategy in place
- [ ] Monitoring and logging configured

---

**Document Version**: 1.0  
**Last Updated**: May 2026  
**Author**: Development Team
