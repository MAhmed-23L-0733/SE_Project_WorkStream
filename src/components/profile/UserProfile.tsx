"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { firebaseHelpers } from "@/lib/firebase";
import { auth } from "@/lib/firebase";
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "firebase/auth";

export function UserProfile() {
  const { user, updateUserData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    profileImage: ""
  });

  const resetForm = async () => {
    if (!user) return;
    
    try {
      const userData = await firebaseHelpers.getUserById(user.uid);
      if (userData) {
        setFormData({
          fullName: userData.fullName || "",
          email: userData.email || "",
          phoneNumber: userData.phoneNumber || "",
          profileImage: userData.profileImage || ""
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  useEffect(() => {
    resetForm().finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    if (!formData.fullName.trim()) {
      setToastMessage("Full name cannot be empty");
      setToastType("error");
      return;
    }

    setIsSaving(true);
    try {
      await firebaseHelpers.updateUser(user.uid, {
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        profileImage: formData.profileImage
      });

      updateUserData({
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        profileImage: formData.profileImage
      });

      setToastMessage("Profile updated successfully!");
      setToastType("success");
    } catch (error) {
      console.error("Error updating profile:", error);
      setToastMessage("Failed to update profile");
      setToastType("error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user || !user.email) return;

    const errors = { currentPassword: "", newPassword: "", confirmPassword: "" };

    if (!passwordData.currentPassword.trim()) {
      errors.currentPassword = "Current password is required";
    }

    if (!passwordData.newPassword.trim()) {
      errors.newPassword = "New password is required";
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = "New password must be at least 6 characters";
    }

    if (!passwordData.confirmPassword.trim()) {
      errors.confirmPassword = "Please confirm your new password";
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setPasswordErrors(errors);

    if (errors.currentPassword || errors.newPassword || errors.confirmPassword) {
      return;
    }

    setIsChangingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, passwordData.currentPassword);
      await reauthenticateWithCredential(auth.currentUser!, credential);
      await updatePassword(auth.currentUser!, passwordData.newPassword);

      setToastMessage("Password changed successfully!");
      setToastType("success");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordErrors({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setIsPasswordModalOpen(false);
    } catch (error: any) {
      let errorMessage = "Failed to change password";
      if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        errorMessage = "Current password is incorrect";
        setPasswordErrors(prev => ({ ...prev, currentPassword: errorMessage }));
      } else if (error.code === "auth/weak-password") {
        errorMessage = "New password is too weak. Please use a stronger password";
        setPasswordErrors(prev => ({ ...prev, newPassword: errorMessage }));
      } else if (error.code === "auth/user-mismatch") {
        errorMessage = "User mismatch. Please logout and try again";
        setPasswordErrors(prev => ({ ...prev, currentPassword: errorMessage }));
      } else if (error.code === "auth/requires-recent-login") {
        errorMessage = "Please logout and login again to change your password for security reasons";
        setPasswordErrors(prev => ({ ...prev, currentPassword: errorMessage }));
      } else if (error.message) {
        errorMessage = error.message;
        setPasswordErrors(prev => ({ ...prev, currentPassword: errorMessage }));
      }
      setToastMessage(errorMessage);
      setToastType("error");
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user || loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const profileName = formData.fullName || user.email || "User";
  const initials = profileName.split(" ").filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join("");

  return (
    <div className="relative min-h-full overflow-x-hidden bg-[#f5f7fb] p-4 md:p-6 lg:p-8">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');`}</style>
      <div className="pointer-events-none absolute -top-24 -right-25 h-72 w-72 rounded-full bg-linear-to-br from-indigo-200/40 to-purple-100/0 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 -left-30 h-72 w-72 rounded-full bg-linear-to-br from-blue-200/35 to-cyan-100/0 blur-3xl" />

      {toastMessage && (
        <div className={`fixed right-6 top-6 z-50 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] flex items-center gap-3 transition-all ${
          toastType === "success" ? "bg-emerald-500" : "bg-rose-500"
        }`}>
          {toastType === "success" ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          )}
          {toastMessage}
        </div>
      )}

      <div className="relative mx-auto max-w-4xl font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              My Profile
            </h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Manage your personal information and security settings
            </p>
          </div>
        </div>

        <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_28px_-20px_rgba(15,23,42,0.4)]">
          <div className="h-2 w-full bg-linear-to-r from-indigo-500 via-violet-500 to-blue-500" />
          <div className="p-6 md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-start">
              <div className="flex-shrink-0">
                {formData.profileImage ? (
                  <img
                    src={formData.profileImage}
                    alt={profileName}
                    className="h-24 w-24 rounded-full border-4 border-indigo-50 object-cover shadow-sm"
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/96?text=Image"; }}
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-indigo-50 bg-linear-to-br from-indigo-500 to-violet-500 text-3xl font-bold text-white shadow-sm">
                    {initials || "U"}
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-6">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900">{profileName}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-500">
                    <span className="rounded-full bg-slate-100 px-3 py-1 uppercase tracking-wider text-slate-600">
                      {user.role}
                    </span>
                    {user.department && <span>• {user.department}</span>}
                    {user.position && <span>• {user.position}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border-1.5 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full rounded-xl border-1.5 border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-500 outline-none cursor-not-allowed"
                      placeholder="Your email"
                    />
                    <p className="mt-1 text-xs font-semibold text-slate-400">Email cannot be changed.</p>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">Phone Number</label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border-1.5 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                      placeholder="e.g. +1 234 567 8900"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">Profile Image URL</label>
                    <input
                      type="url"
                      name="profileImage"
                      value={formData.profileImage}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border-1.5 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center gap-4 border-t border-slate-100">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex items-center rounded-xl bg-linear-to-r from-indigo-500 to-violet-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 hover:shadow-indigo-500/40 disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    onClick={resetForm}
                    disabled={isSaving}
                    className="inline-flex items-center rounded-xl bg-white px-6 py-3 text-sm font-bold text-slate-600 shadow-sm ring-1 ring-inset ring-slate-200 transition-all hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_28px_-20px_rgba(15,23,42,0.4)]">
          <div className="p-6 md:p-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">Security</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">Update your password to keep your account secure.</p>
              </div>
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="inline-flex items-center rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-slate-800/20 transition-all hover:-translate-y-0.5 hover:bg-slate-700"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>

      {isPasswordModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm transition-opacity"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsPasswordModalOpen(false);
              setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
              setPasswordErrors({ currentPassword: "", newPassword: "", confirmPassword: "" });
            }
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl font-['Plus_Jakarta_Sans',sans-serif]">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-extrabold text-slate-900">Change Password</h2>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Current Password *</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordInputChange}
                  className={`w-full rounded-xl border-1.5 px-4 py-3 text-sm font-semibold outline-none transition-all ${
                    passwordErrors.currentPassword
                      ? "border-rose-300 bg-rose-50 text-rose-900 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
                      : "border-slate-200 bg-slate-50 text-slate-800 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  }`}
                  placeholder="Enter current password"
                />
                {passwordErrors.currentPassword && <p className="mt-1 text-xs font-bold text-rose-500">{passwordErrors.currentPassword}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">New Password *</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordInputChange}
                  className={`w-full rounded-xl border-1.5 px-4 py-3 text-sm font-semibold outline-none transition-all ${
                    passwordErrors.newPassword
                      ? "border-rose-300 bg-rose-50 text-rose-900 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
                      : "border-slate-200 bg-slate-50 text-slate-800 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  }`}
                  placeholder="Min. 6 characters"
                />
                {passwordErrors.newPassword && <p className="mt-1 text-xs font-bold text-rose-500">{passwordErrors.newPassword}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Confirm New Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordInputChange}
                  className={`w-full rounded-xl border-1.5 px-4 py-3 text-sm font-semibold outline-none transition-all ${
                    passwordErrors.confirmPassword
                      ? "border-rose-300 bg-rose-50 text-rose-900 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
                      : "border-slate-200 bg-slate-50 text-slate-800 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  }`}
                  placeholder="Confirm new password"
                />
                {passwordErrors.confirmPassword && <p className="mt-1 text-xs font-bold text-rose-500">{passwordErrors.confirmPassword}</p>}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 bg-slate-50 px-6 py-4 border-t border-slate-100">
              <button
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                  setPasswordErrors({ currentPassword: "", newPassword: "", confirmPassword: "" });
                }}
                disabled={isChangingPassword}
                className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-700 hover:shadow-indigo-600/30 disabled:opacity-50"
              >
                {isChangingPassword ? "Updating..." : "Update Password"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
