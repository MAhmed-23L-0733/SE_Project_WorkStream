"use client";

import { useEffect, useState } from "react";
import { firebaseHelpers } from "@/lib/firebase";
import { User, AttendanceRecord } from "@/types";
import { Trophy, Medal, Star } from "lucide-react";

interface LeaderboardEntry {
  user: User;
  totalHours: number;
  daysPresent: number;
  score: number; // custom score: say 10 points per day + 1 point per hour
}

export function AttendanceLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const [users, attendance] = await Promise.all([
          firebaseHelpers.getEmployees(),
          firebaseHelpers.getAllAttendanceRecords(),
        ]);

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const currentMonthAttendance = (attendance as AttendanceRecord[]).filter((record) => {
          const d = new Date(record.date);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const entryMap = new Map<string, LeaderboardEntry>();

        users.forEach((user) => {
          entryMap.set(user.uid, {
            user,
            totalHours: 0,
            daysPresent: 0,
            score: 0,
          });
        });

        currentMonthAttendance.forEach((record) => {
          if (!record.userId) return;
          const entry = entryMap.get(record.userId);
          if (!entry) return;

          if (record.status === "present") {
            entry.daysPresent++;
          }

          if (record.checkInTime && record.checkOutTime) {
            const t1 = new Date(record.checkInTime).getTime();
            const t2 = new Date(record.checkOutTime).getTime();
            const hours = (t2 - t1) / (1000 * 60 * 60);
            if (hours > 0) {
              // Cap at 12 hours a day for fairness
              entry.totalHours += Math.min(hours, 12);
            }
          }
        });

        const leaderboardData = Array.from(entryMap.values()).map((entry) => {
          // Calculate score: e.g. 50 points per day present + 10 points per hour worked
          entry.score = entry.daysPresent * 50 + entry.totalHours * 10;
          return entry;
        });

        // Sort descending by score
        leaderboardData.sort((a, b) => b.score - a.score);

        setEntries(leaderboardData);
      } catch (error) {
        console.error("Error fetching attendance leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="lead-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-sm text-slate-500">Loading Leaderboard...</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .lead-card {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          font-family: 'Inter', sans-serif;
        }

        .lead-header {
          background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
          padding: 1.25rem 1.5rem;
          color: white;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .lead-header h2 {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 700;
        }

        .lead-list {
          display: flex;
          flex-direction: column;
        }

        .lead-item {
          display: flex;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #f1f5f9;
          transition: background 0.2s;
        }

        .lead-item:hover {
          background: #f8fafc;
        }

        .lead-item:last-child {
          border-bottom: none;
        }

        .lead-rank {
          width: 40px;
          font-size: 1.25rem;
          font-weight: 800;
          color: #94a3b8;
          display: flex;
          justify-content: center;
        }

        .lead-rank.gold { color: #fbbf24; }
        .lead-rank.silver { color: #9ca3af; }
        .lead-rank.bronze { color: #b45309; }

        .lead-avatar {
          width: 40px;
          height: 40px;
          border-radius: 9999px;
          background: #e0e7ff;
          color: #4f46e5;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1rem;
          margin-right: 1rem;
          flex-shrink: 0;
          overflow: hidden;
        }
        
        .lead-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .lead-info {
          flex: 1;
        }

        .lead-name {
          font-weight: 600;
          color: #1e293b;
          font-size: 0.95rem;
          margin: 0 0 0.1rem 0;
        }

        .lead-dept {
          font-size: 0.75rem;
          color: #64748b;
          margin: 0;
        }

        .lead-stats {
          text-align: right;
        }

        .lead-score {
          font-size: 1.125rem;
          font-weight: 800;
          color: #4f46e5;
          margin: 0 0 0.1rem 0;
        }

        .lead-details {
          font-size: 0.75rem;
          color: #64748b;
          margin: 0;
        }

        .lead-loading {
          padding: 3rem;
          text-align: center;
        }
      `}</style>
      <div className="lead-card">
        <div className="lead-header">
          <Trophy size={20} className="text-yellow-300" />
          <h2>Attendance Champions</h2>
        </div>
        <div className="lead-list">
          {entries.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-medium">
              No attendance data available yet.
            </div>
          ) : (
            entries.map((entry, index) => {
              const name = entry.user.fullName || entry.user.email;
              const initials = name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
              return (
                <div key={entry.user.uid} className="lead-item">
                  <div className={`lead-rank ${index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : ''}`}>
                    {index === 0 ? <Trophy size={24} /> : index === 1 ? <Medal size={24} /> : index === 2 ? <Medal size={24} /> : `#${index + 1}`}
                  </div>
                  <div className="lead-avatar">
                    {entry.user.profileImage ? (
                      <img src={entry.user.profileImage} alt={name} />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="lead-info">
                    <p className="lead-name">{name}</p>
                    <p className="lead-dept">{entry.user.position || "Employee"}</p>
                  </div>
                  <div className="lead-stats">
                    <p className="lead-score">{Math.round(entry.score)} <span style={{fontSize: '0.7rem', color: '#94a3b8'}}>PTS</span></p>
                    <p className="lead-details">
                      {entry.daysPresent} days • {entry.totalHours.toFixed(1)} hrs
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
