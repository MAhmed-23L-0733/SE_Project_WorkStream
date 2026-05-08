"use client";
import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUpPage() {
  const [formData, setFormData] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    confirmPassword: "" 
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Create user with email and password
      const { user } = await createUserWithEmailAndPassword(auth, formData.email, formData.password);

      // Send email verification
      await sendEmailVerification(user);

      // Save profile to Firestore
      await setDoc(doc(db, "users", user.uid), {
        fullName: formData.name,
        email: formData.email,
        role: "employee",
        emailVerified: false,
        createdAt: new Date().toISOString()
      });

      setSuccessMessage("Account created! Check your email to verify your account.");
      setFormData({ name: "", email: "", password: "", confirmPassword: "" });

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        setErrors({ email: "This email is already registered" });
      } else if (error.code === "auth/weak-password") {
        setErrors({ password: "Password is too weak" });
      } else {
        setErrors({ form: "Error creating account. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-50 to-purple-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center text-slate-900 mb-2">Join WorkStream</h1>
        <p className="text-center text-slate-700 mb-6">Create your account to get started</p>

        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 font-medium">{successMessage}</p>
          </div>
        )}

        {errors.form && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 font-medium">{errors.form}</p>
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">Full Name</label>
            <input 
              type="text" 
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => {
                setFormData({...formData, name: e.target.value});
                if (errors.name) setErrors({...errors, name: ""});
              }}
              className={`w-full px-4 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                errors.name ? "border-red-500" : "border-slate-300"
              } text-slate-900 placeholder-slate-500`}
            />
            {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">Email Address</label>
            <input 
              type="email" 
              placeholder="name@company.com"
              value={formData.email}
              onChange={(e) => {
                setFormData({...formData, email: e.target.value});
                if (errors.email) setErrors({...errors, email: ""});
              }}
              className={`w-full px-4 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                errors.email ? "border-red-500" : "border-slate-300"
              } text-slate-900 placeholder-slate-500`}
            />
            {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => {
                setFormData({...formData, password: e.target.value});
                if (errors.password) setErrors({...errors, password: ""});
              }}
              className={`w-full px-4 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                errors.password ? "border-red-500" : "border-slate-300"
              } text-slate-900 placeholder-slate-500`}
            />
            {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">Confirm Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => {
                setFormData({...formData, confirmPassword: e.target.value});
                if (errors.confirmPassword) setErrors({...errors, confirmPassword: ""});
              }}
              className={`w-full px-4 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                errors.confirmPassword ? "border-red-500" : "border-slate-300"
              } text-slate-900 placeholder-slate-500`}
            />
            {errors.confirmPassword && <p className="text-red-600 text-xs mt-1">{errors.confirmPassword}</p>}
          </div>

          {/* Submit Button */}
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2.5 rounded-lg transition-colors mt-6"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-slate-700">
            <span className="font-semibold text-slate-900">📧 Email Verification:</span> We&apos;ll send a verification link to your email. Click it to activate your account.
          </p>
        </div>

        {/* Login Link */}
        <p className="mt-6 text-center text-sm text-slate-700">
          Already a member?{" "}
          <Link href="/login" className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}