"use client";
import { useState } from "react";
import { auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import Link from "next/link";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Check your inbox for reset instructions. The link will expire in 1 hour.");
      setEmail("");
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email address.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError("Error sending reset email. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .reset-root {
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

        .reset-bg {
          position: absolute;
          inset: 0;
          background: url('https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80') center/cover no-repeat;
          filter: blur(6px) brightness(0.85);
          transform: scale(1.05);
          z-index: 0;
        }

        .reset-bg-overlay {
          position: absolute;
          inset: 0;
          background: rgba(245, 247, 255, 0.55);
          z-index: 1;
        }

        .reset-header {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 1.25rem;
        }

        .reset-logo {
          width: 56px;
          height: 56px;
          margin-bottom: 0.5rem;
        }

        .reset-brand {
          font-size: 1.75rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          color: #1a1a2e;
        }

        .reset-card {
          position: relative;
          z-index: 2;
          background: #ffffff;
          border-radius: 1.25rem;
          box-shadow: 0 20px 60px rgba(80, 40, 140, 0.12), 0 4px 16px rgba(0,0,0,0.08);
          padding: 2.5rem 2.25rem 2rem;
          width: 100%;
          max-width: 440px;
        }

        .card-icon-wrap {
          display: flex;
          justify-content: center;
          margin-bottom: 1.25rem;
        }

        .card-icon-circle {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(99,102,241,0.12), rgba(245,158,11,0.1));
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1.5px solid rgba(99,102,241,0.18);
        }

        .card-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
          text-align: center;
          margin-bottom: 0.35rem;
        }

        .card-subtitle {
          font-size: 0.875rem;
          color: #64748b;
          text-align: center;
          margin-bottom: 1.75rem;
          line-height: 1.6;
        }

        .success-box {
          background: #f0fdf4;
          border: 1px solid #86efac;
          border-radius: 0.75rem;
          padding: 1rem 1.1rem;
          margin-bottom: 1.25rem;
          display: flex;
          gap: 0.75rem;
          align-items: flex-start;
        }

        .success-box-icon {
          color: #16a34a;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .success-box p {
          font-size: 0.875rem;
          color: #166534;
          font-weight: 500;
          margin: 0;
          line-height: 1.5;
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
          font-size: 0.875rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 0.45rem;
          display: block;
        }

        .input-wrapper {
          position: relative;
          margin-bottom: 1.5rem;
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

        .btn-reset {
          width: 100%;
          padding: 0.875rem;
          border: none;
          border-radius: 0.75rem;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 45%, #f59e0b 100%);
          color: #fff;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          letter-spacing: 0.02em;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35);
          font-family: 'Inter', sans-serif;
        }

        .btn-reset:hover:not(:disabled) {
          opacity: 0.93;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
        }

        .btn-reset:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-reset:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .back-link {
          margin-top: 1.5rem;
          text-align: center;
          font-size: 0.875rem;
        }

        .back-link a {
          color: #6366f1;
          font-weight: 600;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          transition: color 0.2s;
        }

        .back-link a:hover {
          color: #4f46e5;
        }

        .tip-box {
          margin-top: 1.25rem;
          padding: 0.75rem 1rem;
          background: rgba(99,102,241,0.05);
          border: 1px solid rgba(99,102,241,0.15);
          border-radius: 0.625rem;
          font-size: 0.78rem;
          color: #475569;
          line-height: 1.5;
        }

        .tip-box strong {
          color: #1e293b;
        }

        .reset-footer {
          position: relative;
          z-index: 2;
          margin-top: 1.5rem;
          display: flex;
          gap: 1.25rem;
        }

        .reset-footer a {
          font-size: 0.78rem;
          color: #475569;
          text-decoration: none;
          transition: color 0.2s;
        }

        .reset-footer a:hover {
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

      <div className="reset-root">
        {/* Background */}
        <div className="reset-bg" />
        <div className="reset-bg-overlay" />

        {/* Logo + Brand */}
        <div className="reset-header">
          <svg className="reset-logo" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="waveGradR" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366f1"/>
                <stop offset="0.5" stopColor="#a855f7"/>
                <stop offset="1" stopColor="#f59e0b"/>
              </linearGradient>
            </defs>
            <path d="M6 34 Q14 18 22 28 Q30 38 38 22 Q46 8 50 22" stroke="url(#waveGradR)" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
            <path d="M6 40 Q14 24 22 34 Q30 44 38 28 Q46 14 50 28" stroke="url(#waveGradR)" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5"/>
          </svg>
          <span className="reset-brand">WORKSTREAM</span>
        </div>

        {/* Card */}
        <div className="reset-card">
          {/* Lock icon circle */}
          <div className="card-icon-wrap">
            <div className="card-icon-circle">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="url(#lockGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <defs>
                  <linearGradient id="lockGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#6366f1"/>
                    <stop offset="1" stopColor="#f59e0b"/>
                  </linearGradient>
                </defs>
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
          </div>

          <h1 className="card-title">Reset Password</h1>
          <p className="card-subtitle">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>

          {message && (
            <div className="success-box">
              <span className="success-box-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <path d="M22 4L12 14.01l-3-3"/>
                </svg>
              </span>
              <p>{message}</p>
            </div>
          )}

          {error && <div className="error-box">{error}</div>}

          {!message && (
            <form onSubmit={handleReset}>
              <label className="field-label">Email Address</label>
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

              <button type="submit" className="btn-reset" disabled={loading}>
                {loading && <span className="spinner" />}
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          )}

          <div className="back-link">
            <Link href="/login">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back to Login
            </Link>
          </div>

          <div className="tip-box">
            <strong>💡 Tip:</strong> Check your spam folder if you don&apos;t see the email within a few minutes.
          </div>
        </div>

        {/* Footer */}
        <div className="reset-footer">
          <a href="#">Terms of Service</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Help Center</a>
        </div>
      </div>
    </>
  );
}