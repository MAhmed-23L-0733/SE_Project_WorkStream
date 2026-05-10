"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, MessageSquare, Folder, CheckSquare, Calendar, Info, Check, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { firebaseHelpers } from "@/lib/firebase";
import { AppNotification } from "@/types";

export function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = firebaseHelpers.subscribeToNotifications(user.uid, (data) => {
      setNotifications(data);
    });

    return () => unsubscribe();
  }, [user]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 top-12 z-[100] w-80 sm:w-96 rounded-xl border border-slate-200 bg-white shadow-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50">
            <h3 className="font-semibold text-slate-800">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
              >
                <Check size={14} /> Mark all as read
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto max-h-[400px]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <Bell size={24} className="text-slate-400" />
                </div>
                <p className="text-slate-500 font-medium">No notifications yet</p>
                <p className="text-slate-400 text-sm mt-1">When you get notifications, they'll show up here.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {notifications.map((notification) => (
                  <li 
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex items-start gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors ${!notification.read ? 'bg-blue-50/30' : ''}`}
                  >
                    <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${!notification.read ? 'bg-white shadow-sm border border-slate-100' : 'bg-slate-100'}`}>
                      {getIconForType(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className={`text-sm font-semibold truncate ${!notification.read ? 'text-slate-900' : 'text-slate-700'}`}>
                          {notification.title}
                        </p>
                        <span className="text-[10px] text-slate-400 font-medium shrink-0 whitespace-nowrap mt-0.5">
                          {formatTime(notification.createdAt)}
                        </span>
                      </div>
                      <p className={`text-xs line-clamp-2 leading-relaxed ${!notification.read ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                        {notification.message}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="h-2 w-2 rounded-full bg-blue-500 mt-2 shrink-0"></div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="border-t border-slate-100 p-2 bg-slate-50 text-center">
              <span className="text-xs text-slate-400 font-medium">You have {unreadCount} unread notifications</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
