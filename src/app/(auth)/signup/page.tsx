"use client";
import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Full name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.role) newErrors.role = "Please select a role";
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Minimum 6 characters";
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
    if (!validateForm()) return;
    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await updateProfile(user, { displayName: formData.name });
      await sendEmailVerification(user);
      await setDoc(doc(db, "users", user.uid), {
        fullName: formData.name,
        email: formData.email,
        role: formData.role,
        department: "",
        position: "",
        emailVerified: false,
        createdAt: new Date().toISOString(),
      });
      setSuccessMessage("Account created! Check your email to verify your account.");
      setFormData({ name: "", email: "", role: "", password: "", confirmPassword: "" });
      setTimeout(() => router.push("/login"), 2000);
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

  const update = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        * { box-sizing: border-box; }

        .signup-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f0f2f8;
          font-family: 'Inter', sans-serif;
          padding: 1.5rem;
        }

        .signup-card {
          display: flex;
          width: 100%;
          max-width: 960px;
          border-radius: 1.5rem;
          overflow: hidden;
          box-shadow: 0 24px 80px rgba(80, 40, 160, 0.18), 0 4px 20px rgba(0,0,0,0.1);
          min-height: 580px;
        }

        /* ---- LEFT PANEL ---- */
        .left-panel {
          flex: 0 0 42%;
          background: linear-gradient(145deg, #6366f1 0%, #8b5cf6 40%, #c084fc 70%, #f59e0b 100%);
          padding: 2.5rem 2rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }

        .left-panel::before {
          content: '';
          position: absolute;
          width: 260px;
          height: 260px;
          border-radius: 50%;
          background: rgba(255,255,255,0.07);
          top: -60px;
          right: -80px;
        }

        .left-panel::after {
          content: '';
          position: absolute;
          width: 180px;
          height: 180px;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
          bottom: 60px;
          left: -60px;
        }

        .lp-logo {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          position: relative;
          z-index: 1;
        }

        .lp-logo svg {
          flex-shrink: 0;
        }

        .lp-logo-text {
          font-size: 1.15rem;
          font-weight: 700;
          color: #fff;
          letter-spacing: 0.02em;
        }

        .lp-body {
          position: relative;
          z-index: 1;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 1.5rem 0 1rem;
        }

        .lp-headline {
          font-size: 1.75rem;
          font-weight: 800;
          color: #fff;
          line-height: 1.25;
          margin-bottom: 0.75rem;
        }

        .lp-desc {
          font-size: 0.875rem;
          color: rgba(255,255,255,0.82);
          line-height: 1.6;
          margin-bottom: 1.75rem;
        }

        .lp-features {
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
        }

        .lp-feature {
          display: flex;
          gap: 0.85rem;
          align-items: flex-start;
        }

        .lp-feat-icon {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(255,255,255,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          backdrop-filter: blur(6px);
        }

        .lp-feat-text h4 {
          font-size: 0.875rem;
          font-weight: 700;
          color: #fff;
          margin: 0 0 0.2rem;
        }

        .lp-feat-text p {
          font-size: 0.78rem;
          color: rgba(255,255,255,0.75);
          margin: 0;
          line-height: 1.5;
        }

        .lp-divider {
          height: 1px;
          background: rgba(255,255,255,0.2);
          margin: 1.25rem 0;
          position: relative;
          z-index: 1;
        }

        .lp-quote {
          font-size: 0.78rem;
          color: rgba(255,255,255,0.75);
          font-style: italic;
          line-height: 1.6;
          position: relative;
          z-index: 1;
        }

        /* ---- RIGHT PANEL ---- */
        .right-panel {
          flex: 1;
          background: #fff;
          padding: 2.75rem 2.5rem 2.25rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .rp-title {
          font-size: 1.625rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 0.35rem;
        }

        .rp-subtitle {
          font-size: 0.875rem;
          color: #64748b;
          margin-bottom: 1.75rem;
        }

        .success-box {
          background: #f0fdf4;
          border: 1px solid #86efac;
          border-radius: 0.625rem;
          padding: 0.75rem 1rem;
          margin-bottom: 1.25rem;
          font-size: 0.85rem;
          color: #166534;
          font-weight: 500;
        }

        .error-box {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 0.625rem;
          padding: 0.75rem 1rem;
          margin-bottom: 1.25rem;
          font-size: 0.85rem;
          color: #dc2626;
          font-weight: 500;
        }

        .rp-form {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .field-group {
          margin-bottom: 1rem;
        }

        .field-label {
          font-size: 0.82rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.4rem;
          display: block;
        }

        .form-input {
          width: 100%;
          padding: 0.7rem 0.9rem;
          border: 1.5px solid #e2e8f0;
          border-radius: 0.6rem;
          font-size: 0.875rem;
          color: #0f172a;
          background: #f8fafc;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          font-family: 'Inter', sans-serif;
          appearance: none;
        }

        .form-input::placeholder {
          color: #94a3b8;
        }

        .form-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
          background: #fff;
        }

        .form-input:disabled {
          background: #f1f5f9;
          cursor: not-allowed;
        }

        .form-input.has-error {
          border-color: #f87171;
        }

        .select-wrapper {
          position: relative;
        }

        .select-wrapper::after {
          content: '';
          position: absolute;
          right: 0.9rem;
          top: 50%;
          transform: translateY(-50%);
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 6px solid #94a3b8;
          pointer-events: none;
        }

        .select-wrapper select {
          cursor: pointer;
        }

        .field-error {
          font-size: 0.75rem;
          color: #ef4444;
          margin-top: 0.3rem;
          font-weight: 500;
        }

        .row-two {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.85rem;
        }

        .btn-create {
          width: 100%;
          padding: 0.875rem;
          border: none;
          border-radius: 0.75rem;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #f59e0b 100%);
          color: #fff;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          margin-top: 1.25rem;
          letter-spacing: 0.02em;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35);
          font-family: 'Inter', sans-serif;
        }

        .btn-create:hover:not(:disabled) {
          opacity: 0.93;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
        }

        .btn-create:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-create:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .login-row {
          margin-top: 1.25rem;
          text-align: center;
          font-size: 0.875rem;
          color: #64748b;
        }

        .login-row a {
          color: #6366f1;
          font-weight: 700;
          text-decoration: none;
          transition: color 0.2s;
        }

        .login-row a:hover {
          color: #4f46e5;
        }

        .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          vertical-align: middle;
          margin-right: 8px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 680px) {
          .signup-card {
            flex-direction: column;
            border-radius: 1rem;
          }
          .left-panel {
            flex: none;
            padding: 1.75rem 1.5rem;
          }
          .right-panel {
            padding: 2rem 1.5rem 1.75rem;
          }
          .row-two {
            grid-template-columns: 1fr;
          }
          .lp-features {
            display: none;
          }
        }
      `}</style>

      <div className="signup-root">
        <div className="signup-card">
          {/* ---- LEFT PANEL ---- */}
          <div className="left-panel">
            {/* Logo */}
            <div className="lp-logo">
              <svg width="32" height="22" viewBox="0 0 32 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 16 Q8 4 14 11 Q20 18 26 6 Q29 1 30 8" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                <path d="M2 19 Q8 7 14 14 Q20 21 26 9 Q29 4 30 11" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              </svg>
              <span className="lp-logo-text">WorkStream</span>
            </div>

            {/* Headline + Features */}
            <div className="lp-body">
              <h2 className="lp-headline">Join the Workforce Management Portal</h2>
              <p className="lp-desc">Create your account to start collaborating with your team and streamline your daily operations.</p>

              <div className="lp-features">
                <div className="lp-feature">
                  <div className="lp-feat-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <div className="lp-feat-text">
                    <h4>Streamlined Collaboration</h4>
                    <p>Connect instantly with colleagues and share resources effortlessly.</p>
                  </div>
                </div>

                <div className="lp-feature">
                  <div className="lp-feat-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <div className="lp-feat-text">
                    <h4>Secure Access</h4>
                    <p>Your data is protected with enterprise-grade security and encryption.</p>
                  </div>
                </div>

                <div className="lp-feature">
                  <div className="lp-feat-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                  </div>
                  <div className="lp-feat-text">
                    <h4>Real-time Updates</h4>
                    <p>Stay informed with live notifications on tasks and approvals.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quote */}
            <div>
              <div className="lp-divider" />
              <p className="lp-quote">&ldquo;This portal has transformed how our team manages projects and communicates.&rdquo;</p>
            </div>
          </div>

          {/* ---- RIGHT PANEL ---- */}
          <div className="right-panel">
            <h1 className="rp-title">Create an account</h1>
            <p className="rp-subtitle">Fill in your details below to get started.</p>

            {successMessage && <div className="success-box">{successMessage}</div>}
            {errors.form && <div className="error-box">{errors.form}</div>}

            <form className="rp-form" onSubmit={handleSignUp}>
              {/* Full Name */}
              <div className="field-group">
                <label className="field-label">Full Name</label>
                <input
                  type="text"
                  className={`form-input${errors.name ? " has-error" : ""}`}
                  placeholder="Enter your full name"
                  value={formData.name}
                  disabled={loading}
                  onChange={(e) => update("name", e.target.value)}
                />
                {errors.name && <p className="field-error">{errors.name}</p>}
              </div>

              {/* Work Email */}
              <div className="field-group">
                <label className="field-label">Work Email</label>
                <input
                  type="email"
                  className={`form-input${errors.email ? " has-error" : ""}`}
                  placeholder="name@company.com"
                  value={formData.email}
                  disabled={loading}
                  onChange={(e) => update("email", e.target.value)}
                />
                {errors.email && <p className="field-error">{errors.email}</p>}
              </div>

              {/* Role */}
              <div className="field-group">
                <label className="field-label">Role</label>
                <div className="select-wrapper">
                  <select
                    className={`form-input${errors.role ? " has-error" : ""}`}
                    value={formData.role}
                    disabled={loading}
                    onChange={(e) => update("role", e.target.value)}
                  >
                    <option value="">Select your role</option>
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {errors.role && <p className="field-error">{errors.role}</p>}
              </div>

              {/* Password + Confirm */}
              <div className="row-two">
                <div className="field-group">
                  <label className="field-label">Password</label>
                  <input
                    type="password"
                    className={`form-input${errors.password ? " has-error" : ""}`}
                    placeholder="••••••••"
                    value={formData.password}
                    disabled={loading}
                    onChange={(e) => update("password", e.target.value)}
                  />
                  {errors.password && <p className="field-error">{errors.password}</p>}
                </div>
                <div className="field-group">
                  <label className="field-label">Confirm Password</label>
                  <input
                    type="password"
                    className={`form-input${errors.confirmPassword ? " has-error" : ""}`}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    disabled={loading}
                    onChange={(e) => update("confirmPassword", e.target.value)}
                  />
                  {errors.confirmPassword && <p className="field-error">{errors.confirmPassword}</p>}
                </div>
              </div>

              <button type="submit" className="btn-create" disabled={loading}>
                {loading && <span className="spinner" />}
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <div className="login-row">
              Already have an account?{" "}
              <Link href="/login">Log In</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}