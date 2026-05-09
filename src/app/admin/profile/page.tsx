"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { firebaseHelpers } from "@/lib/firebase";

export default function AdminProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    profileImage: ""
  });

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: (user as any).fullName || "",
        email: user.email || "",
        phoneNumber: (user as any).phoneNumber || "",
        profileImage: (user as any).profileImage || ""
      });
    }
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

  const handleSave = async () => {
    if (!user) return;

    if (!formData.fullName.trim()) {
      setToastMessage("Full name cannot be empty");
      setToastType("error");
      return;
    }

    setLoading(true);
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
      setLoading(false);
    }
  };

  if (!user) {
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">User ID</p>
                  <p className="text-sm text-slate-900 font-medium break-all">{user.uid}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Role</p>
                  <p className="text-sm text-slate-900 font-medium capitalize">Admin</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-slate-200">
            <button
              onClick={() => {
                if (user) {
                  setFormData({
                    fullName: (user as any).fullName || "",
                    email: user.email || "",
                    phoneNumber: (user as any).phoneNumber || "",
                    profileImage: (user as any).profileImage || ""
                  });
                }
              }}
              disabled={loading}
              className="px-6 py-2 text-slate-600 hover:text-slate-800 font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:bg-blue-400"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
