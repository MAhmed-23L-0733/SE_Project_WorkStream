"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Bell, MessageSquare, Folder, CheckSquare, Calendar, Info, Check, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { firebaseHelpers } from "@/lib/firebase";
import { AppNotification } from "@/types";

export function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = firebaseHelpers.subscribeToNotifications(user.uid, (data) => {
      setNotifications(data);
    });

    return () => unsubscribe();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.read) {
      await firebaseHelpers.markNotificationAsRead(notification.id!);
    }
    if (notification.link) {
      setIsOpen(false);
      router.push(notification.link);
    }
  };

  const markAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (user?.uid) {
      await firebaseHelpers.markAllNotificationsAsRead(user.uid);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case "message": return <MessageSquare size={16} className="text-blue-500" />;
      case "project": return <Folder size={16} className="text-orange-500" />;
      case "task": return <CheckSquare size={16} className="text-emerald-500" />;
      case "attendance": return <Calendar size={16} className="text-indigo-500" />;
      case "leave": return <Calendar size={16} className="text-violet-500" />;
      default: return <Info size={16} className="text-slate-500" />;
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (!user) return null;

  return (
    <div className="relative">
      {/* Bell Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Portal Modal Panel */}
      {mounted && isOpen && createPortal(
        <div className="fixed inset-0 z-[99999] flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Sliding Panel */}
          <div className="relative w-full max-w-sm sm:max-w-md h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">Notifications</h3>
              <div className="flex items-center gap-4">
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                  >
                    <Check size={14} /> Mark all read
                  </button>
                )}
                <button 
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                  <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
                    <Bell size={32} className="text-slate-300" />
                  </div>
                  <p className="text-slate-600 font-bold text-lg">You're all caught up!</p>
                  <p className="text-slate-400 text-sm mt-2 max-w-[250px]">When you get new notifications, they will appear right here.</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-50">
                  {notifications.map((notification) => (
                    <li 
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`flex items-start gap-4 p-5 cursor-pointer hover:bg-slate-50 transition-colors ${!notification.read ? 'bg-blue-50/20' : ''}`}
                    >
                      <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${!notification.read ? 'bg-white shadow-sm border border-slate-100' : 'bg-slate-100'}`}>
                        {getIconForType(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <p className={`text-sm font-bold truncate ${!notification.read ? 'text-slate-900' : 'text-slate-700'}`}>
                            {notification.title}
                          </p>
                          <span className="text-[10px] text-slate-400 font-bold shrink-0 whitespace-nowrap mt-0.5">
                            {formatTime(notification.createdAt)}
                          </span>
                        </div>
                        <p className={`text-sm line-clamp-3 leading-relaxed ${!notification.read ? 'text-slate-600 font-medium' : 'text-slate-500'}`}>
                          {notification.message}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="h-2.5 w-2.5 rounded-full bg-blue-500 mt-2 shrink-0 shadow-sm"></div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            {notifications.length > 0 && (
              <div className="border-t border-slate-100 p-3 bg-slate-50 text-center">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  You have {unreadCount} unread notifications
                </span>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
