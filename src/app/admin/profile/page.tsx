"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { firebaseHelpers } from "@/lib/firebase";
import { auth } from "@/lib/firebase";
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "firebase/auth";

export default function AdminProfilePage() {
  const { user } = useAuth();
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

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
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
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserData();
  }, [user]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
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
      // Reauthenticate with current password
      const credential = EmailAuthProvider.credential(user.email, passwordData.currentPassword);
      await reauthenticateWithCredential(auth.currentUser!, credential);

      // Update password
      await updatePassword(auth.currentUser!, passwordData.newPassword);

      setToastMessage("Password changed successfully!");
      setToastType("success");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      setPasswordErrors({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      setIsPasswordModalOpen(false);
    } catch (error: any) {
      let errorMessage = "Failed to change password";
      
      if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        errorMessage = "Current password is incorrect";
        setPasswordErrors({ ...errors, currentPassword: errorMessage });
      } else if (error.code === "auth/weak-password") {
        errorMessage = "New password is too weak. Please use a stronger password";
        setPasswordErrors({ ...errors, newPassword: errorMessage });
      } else if (error.code === "auth/user-mismatch") {
        errorMessage = "User mismatch. Please logout and try again";
        setPasswordErrors({ ...errors, currentPassword: errorMessage });
      } else if (error.code === "auth/requires-recent-login") {
        errorMessage = "Please logout and login again to change your password for security reasons";
        setPasswordErrors({ ...errors, currentPassword: errorMessage });
      } else if (error.message) {
        errorMessage = error.message;
        setPasswordErrors({ ...errors, currentPassword: errorMessage });
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user || loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {toastMessage && (
        <div className={`fixed right-6 top-6 z-50 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${
          toastType === "success" ? "bg-emerald-600" : "bg-red-600"
        }`}>
          {toastMessage}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">My Profile</h1>
        <p className="text-slate-600 mt-2">Manage your profile information</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden max-w-2xl">
        <div className="p-8">
          <div className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your full name"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
                placeholder="Your email"
              />
              <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your phone number"
              />
            </div>

            {/* Profile Image URL */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Profile Image URL
              </label>
              <input
                type="url"
                name="profileImage"
                value={formData.profileImage}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com/image.jpg"
              />
              {formData.profileImage && (
                <div className="mt-3">
                  <p className="text-xs text-slate-600 mb-2">Preview:</p>
                  <img 
                    src={formData.profileImage} 
                    alt="Profile" 
                    className="h-20 w-20 rounded-lg object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://via.placeholder.com/80?text=Invalid+Image";
                    }}
                  />
                </div>
              )}
            </div>

            {/* Account Info (Read-only) */}
            <div className="pt-4 border-t border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-xs text-slate-500 mb-1">User ID</p>
                  <p className="text-sm text-slate-900 font-medium break-all">{user.uid}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Role</p>
                  <p className="text-sm text-slate-900 font-medium capitalize">Admin</p>
                </div>
              </div>
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors"
              >
                Change Password
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-slate-200">
            <button
              onClick={() => {
                const fetchUserData = async () => {
                  if (user) {
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
                  }
                };
                fetchUserData();
              }}
              disabled={isSaving}
              className="px-6 py-2 text-slate-600 hover:text-slate-800 font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:bg-blue-400"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div 
          className="fixed inset-0 bg-transparent backdrop-blur-md flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsPasswordModalOpen(false);
              setPasswordData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: ""
              });
              setPasswordErrors({
                currentPassword: "",
                newPassword: "",
                confirmPassword: ""
              });
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                Change Password
              </h2>

              <div className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Current Password *
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                      passwordErrors.currentPassword
                        ? "border-red-500 focus:ring-red-500 bg-red-50"
                        : "border-slate-300 focus:ring-blue-500"
                    }`}
                    placeholder="Enter your current password"
                  />
                  {passwordErrors.currentPassword && (
                    <p className="text-red-600 text-xs mt-1">{passwordErrors.currentPassword}</p>
                  )}
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    New Password *
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                      passwordErrors.newPassword
                        ? "border-red-500 focus:ring-red-500 bg-red-50"
                        : "border-slate-300 focus:ring-blue-500"
                    }`}
                    placeholder="Enter your new password (min 6 characters)"
                  />
                  {passwordErrors.newPassword && (
                    <p className="text-red-600 text-xs mt-1">{passwordErrors.newPassword}</p>
                  )}
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
                      passwordErrors.confirmPassword
                        ? "border-red-500 focus:ring-red-500 bg-red-50"
                        : "border-slate-300 focus:ring-blue-500"
                    }`}
                    placeholder="Confirm your new password"
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="text-red-600 text-xs mt-1">{passwordErrors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setIsPasswordModalOpen(false);
                    setPasswordData({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: ""
                    });
                    setPasswordErrors({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: ""
                    });
                  }}
                  disabled={isChangingPassword}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:bg-blue-400"
                >
                  {isChangingPassword ? "Changing..." : "Change Password"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
