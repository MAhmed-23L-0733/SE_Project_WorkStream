"use client";

import { useEffect, useState } from "react";
import { firebaseHelpers } from "@/lib/firebase";
import { User, ProjectTask } from "@/types";
import { Trophy, Medal, Star, Target, ChevronDown, ChevronUp } from "lucide-react";

interface ProjectLeaderboardEntry {
  user: User;
  tasksCompleted: number;
  highPriorityCompleted: number;
  score: number;
}

export function ProjectLeaderboard() {
  const [entries, setEntries] = useState<ProjectLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const [users, tasks] = await Promise.all([
          firebaseHelpers.getEmployees(),
          firebaseHelpers.getAllTasks(),
        ]);

        const entryMap = new Map<string, ProjectLeaderboardEntry>();

        users.forEach((user) => {
          entryMap.set(user.uid, {
            user,
            tasksCompleted: 0,
            highPriorityCompleted: 0,
            score: 0,
          });
        });

        tasks.forEach((task: ProjectTask) => {
          if (task.status === "done" && task.assignedTo) {
            const entry = entryMap.get(task.assignedTo);
            if (entry) {
              entry.tasksCompleted++;
              
              if (task.urgency === "high") {
                entry.highPriorityCompleted++;
                entry.score += 30; // High urgency = 30 points
              } else if (task.urgency === "medium") {
                entry.score += 20; // Medium = 20 points
              } else {
                entry.score += 10; // Low = 10 points
              }
            }
          }
        });

        const leaderboardData = Array.from(entryMap.values()).filter(e => e.tasksCompleted > 0);
        
        // Sort descending by score
        leaderboardData.sort((a, b) => b.score - a.score);

        setEntries(leaderboardData);
      } catch (error) {
        console.error("Error fetching project leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="lead-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500 mx-auto"></div>
        <p className="mt-2 text-sm text-slate-500">Loading Leaderboard...</p>
      </div>
    );
  }

  return (
    <div className={`w-full sticky top-6 shrink-0 transition-all duration-300 ease-in-out ${isExpanded ? 'xl:w-[400px]' : 'xl:w-[72px]'}`}>
      <style>{`
        .lead-card {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          font-family: 'Inter', sans-serif;
          transition: all 0.3s ease;
        }

        .lead-header-proj {
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          padding: 1.25rem 1.5rem;
          color: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          user-select: none;
          min-height: 64px;
        }

        .lead-header-proj-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .lead-header-text {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 700;
          white-space: nowrap;
        }

        .lead-list {
          display: flex;
          flex-direction: column;
          animation: slideDown 0.3s ease-out forwards;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
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

        .lead-avatar-proj {
          width: 40px;
          height: 40px;
          border-radius: 9999px;
          background: #ffedd5;
          color: #ea580c;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1rem;
          margin-right: 1rem;
          flex-shrink: 0;
          overflow: hidden;
        }
        
        .lead-avatar-proj img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .lead-info {
          flex: 1;
          min-width: 0;
        }

        .lead-name {
          font-weight: 600;
          color: #1e293b;
          font-size: 0.95rem;
          margin: 0 0 0.1rem 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .lead-dept {
          font-size: 0.75rem;
          color: #64748b;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .lead-stats {
          text-align: right;
        }

        .lead-score-proj {
          font-size: 1.125rem;
          font-weight: 800;
          color: #ea580c;
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

        @media (min-width: 1280px) {
          .lead-collapsed .lead-header-text {
            display: none;
          }
          .lead-collapsed .lead-header-icon-right {
            display: none;
          }
          .lead-collapsed .lead-header-proj {
            justify-content: center;
            padding: 1.25rem 0;
          }
          .lead-collapsed .lead-header-proj-left {
            gap: 0;
          }
        }
      `}</style>
      <div className={`lead-card ${isExpanded ? 'lead-expanded' : 'lead-collapsed'}`}>
        <div className="lead-header-proj" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="lead-header-proj-left">
            <Trophy size={20} className="text-white shrink-0" />
            <h2 className="lead-header-text">Top Performers</h2>
          </div>
          <div className="lead-header-icon-right">
            {isExpanded ? <ChevronUp size={20} className="text-white opacity-80 shrink-0" /> : <ChevronDown size={20} className="text-white opacity-80 shrink-0" />}
          </div>
        </div>
        
        {isExpanded && (
          <div className="lead-list">
            {entries.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-medium">
                No tasks have been completed yet.
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
                    <div className="lead-avatar-proj">
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
                      <p className="lead-score-proj">{Math.round(entry.score)} <span style={{fontSize: '0.7rem', color: '#94a3b8'}}>PTS</span></p>
                      <p className="lead-details">
                        {entry.tasksCompleted} tasks • {entry.highPriorityCompleted} high prio
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
