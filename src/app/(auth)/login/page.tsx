"use client";
import { useState } from "react";
import { auth, firebaseHelpers } from "@/lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        try {
          const users = await firebaseHelpers.getAllUsers();
          const userDoc = users.find((user: any) => user.email === email);

          if (userDoc && !userDoc.authCreated) {
            try {
              await createUserWithEmailAndPassword(auth, email, password);
              await firebaseHelpers.updateUser(userDoc.uid, { authCreated: true });
              router.push("/");
              return;
            } catch (createErr: any) {
              if (createErr.code === "auth/email-already-in-use") {
                setError("An account with this email already exists. Please try logging in normally.");
              } else {
                setError("Failed to create account. Please contact your administrator.");
              }
              return;
            }
          }
        } catch (firestoreErr) {
          console.error("Error checking Firestore:", firestoreErr);
        }
        setError("No account found with this email. Please sign up.");
      } else if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("Incorrect email or password. Please try again.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (err.code === "auth/user-disabled") {
        setError("This account has been disabled.");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .login-root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          font-family: 'Inter', sans-serif;
          overflow: hidden;
          padding: 1rem;
        }

        .login-bg {
          position: absolute;
          inset: 0;
          background: url('https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80') center/cover no-repeat;
          filter: blur(6px) brightness(0.85);
          transform: scale(1.05);
          z-index: 0;
        }

        .login-bg-overlay {
          position: absolute;
          inset: 0;
          background: rgba(245, 247, 255, 0.55);
          z-index: 1;
        }

        .login-header {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 1.25rem;
        }

        .login-logo {
          width: 56px;
          height: 56px;
          margin-bottom: 0.5rem;
        }

        .login-brand {
          font-size: 1.75rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          color: #1a1a2e;
        }

        .login-card {
          position: relative;
          z-index: 2;
          background: #ffffff;
          border-radius: 1.25rem;
          box-shadow: 0 20px 60px rgba(80, 40, 140, 0.12), 0 4px 16px rgba(0,0,0,0.08);
          padding: 2.5rem 2.25rem 2rem;
          width: 100%;
          max-width: 440px;
        }

        .card-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
          text-align: center;
          margin-bottom: 0.35rem;
        }

        .card-subtitle {
          font-size: 0.9rem;
          color: #64748b;
          text-align: center;
          margin-bottom: 1.75rem;
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

        .field-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.45rem;
        }

        .field-label span {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1e293b;
        }

        .forgot-link {
          font-size: 0.8rem;
          font-weight: 600;
          color: #6366f1;
          text-decoration: none;
          transition: color 0.2s;
        }

        .forgot-link:hover {
          color: #4f46e5;
        }

        .input-wrapper {
          position: relative;
          margin-bottom: 1.1rem;
        }

        .input-icon {
          position: absolute;
          left: 0.9rem;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
          display: flex;
          align-items: center;
        }

        .form-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.75rem;
          border: 1.5px solid #e2e8f0;
          border-radius: 0.625rem;
          font-size: 0.9rem;
          color: #0f172a;
          background: #f8fafc;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          box-sizing: border-box;
          font-family: 'Inter', sans-serif;
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

        .btn-signin {
          width: 100%;
          padding: 0.875rem;
          border: none;
          border-radius: 0.75rem;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 45%, #f59e0b 100%);
          color: #fff;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          margin-top: 1.5rem;
          letter-spacing: 0.02em;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35);
          font-family: 'Inter', sans-serif;
        }

        .btn-signin:hover:not(:disabled) {
          opacity: 0.93;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
        }

        .btn-signin:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-signin:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .signup-row {
          margin-top: 1.5rem;
          text-align: center;
          font-size: 0.875rem;
          color: #64748b;
        }

        .signup-row a {
          color: #6366f1;
          font-weight: 700;
          text-decoration: none;
          transition: color 0.2s;
        }

        .signup-row a:hover {
          color: #4f46e5;
        }

        .login-footer {
          position: relative;
          z-index: 2;
          margin-top: 1.5rem;
          display: flex;
          gap: 1.25rem;
        }

        .login-footer a {
          font-size: 0.78rem;
          color: #475569;
          text-decoration: none;
          transition: color 0.2s;
        }

        .login-footer a:hover {
          color: #1e293b;
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
      `}</style>

      <div className="login-root">
        {/* Background */}
        <div className="login-bg" />
        <div className="login-bg-overlay" />

        {/* Logo + Brand */}
        <div className="login-header">
          <svg className="login-logo" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="waveGrad" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366f1"/>
                <stop offset="0.5" stopColor="#a855f7"/>
                <stop offset="1" stopColor="#f59e0b"/>
              </linearGradient>
            </defs>
            <path d="M6 34 Q14 18 22 28 Q30 38 38 22 Q46 8 50 22" stroke="url(#waveGrad)" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
            <path d="M6 40 Q14 24 22 34 Q30 44 38 28 Q46 14 50 28" stroke="url(#waveGrad)" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5"/>
          </svg>
          <span className="login-brand">WORKSTREAM</span>
        </div>

        {/* Card */}
        <div className="login-card">
          <h1 className="card-title">Welcome Back</h1>
          <p className="card-subtitle">Sign in to your account to continue.</p>

          {error && <div className="error-box">{error}</div>}

          <form onSubmit={handleLogin}>
            {/* Email */}
            <div>
              <div className="field-label">
                <span>Email Address</span>
              </div>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="M22 7l-10 7L2 7"/>
                  </svg>
                </span>
                <input
                  type="email"
                  className="form-input"
                  placeholder="name@company.com"
                  required
                  disabled={loading}
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="field-label">
                <span>Password</span>
                <Link href="/forgot-password" className="forgot-link">Forgot password?</Link>
              </div>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                />
              </div>
            </div>

            <button type="submit" className="btn-signin" disabled={loading}>
              {loading && <span className="spinner" />}
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="signup-row">
            Don&apos;t have an account?{" "}
            <Link href="/signup">Sign Up</Link>
          </div>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <a href="#">Terms of Service</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Help Center</a>
        </div>
      </div>
    </>
  );
}