"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { firebaseHelpers } from "@/lib/firebase";
import { Message, User } from "@/types";
import { useAuth } from "@/hooks/useAuth";

const getConvKey = (a: string, b: string) => [a, b].sort().join("_");

const S = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
* { box-sizing: border-box; }
.mc-root { display: flex; flex-direction: column; height: 100vh; padding: 1.75rem 2rem 0; background: #f5f7ff; font-family: 'Inter', sans-serif; }
.mc-header { margin-bottom: 1.25rem; flex-shrink: 0; }
.mc-title { font-size: 1.75rem; font-weight: 800; color: #0f172a; margin: 0; }
.mc-subtitle { font-size: 0.875rem; color: #64748b; margin: 0.25rem 0 0; }
.mc-body { flex: 1; display: grid; grid-template-columns: 290px 1fr; border-radius: 1.25rem; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.08); border: 1px solid #e8eaf0; min-height: 0; margin-bottom: 1.75rem; }

/* Sidebar */
.mc-sidebar { background: #fff; border-right: 1px solid #f0f2f8; display: flex; flex-direction: column; min-height: 0; }
.mc-sidebar-header { padding: 1.25rem 1.25rem 1rem; border-bottom: 1px solid #f0f2f8; flex-shrink: 0; }
.mc-sidebar-title { font-size: .9rem; font-weight: 700; color: #1e293b; margin: 0; }
.mc-sidebar-sub { font-size: .72rem; color: #94a3b8; font-weight: 500; margin: .15rem 0 0; }
.mc-contacts { flex: 1; overflow-y: auto; }
.mc-contact-btn { display: flex; align-items: center; gap: .75rem; padding: .85rem 1.25rem; cursor: pointer; transition: background .15s; border-bottom: 1px solid #f8fafc; width: 100%; border-left: 3px solid transparent; border-right: none; border-top: none; background: transparent; text-align: left; font-family: 'Inter', sans-serif; position: relative; }
.mc-contact-btn:hover { background: #f8faff; }
.mc-contact-btn.active { background: #eef0ff; border-left-color: #6366f1; }
.mc-contact-btn.active .mc-contact-name { color: #6366f1; }
.mc-contact-avatar-wrap { position: relative; flex-shrink: 0; }
.mc-avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg,#6366f1,#8b5cf6); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: .9rem; }
.mc-presence-dot { position: absolute; bottom: 1px; right: 1px; width: 11px; height: 11px; border-radius: 50%; border: 2px solid #fff; }
.mc-presence-dot.online { background: #10b981; }
.mc-presence-dot.offline { background: #cbd5e1; }
.mc-contact-info { flex: 1; min-width: 0; }
.mc-contact-name { font-size: .875rem; font-weight: 600; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mc-contact-sub { font-size: .7rem; color: #94a3b8; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mc-unread-badge { min-width: 20px; height: 20px; border-radius: 99px; background: linear-gradient(135deg,#6366f1,#8b5cf6); color: #fff; font-size: .65rem; font-weight: 800; display: flex; align-items: center; justify-content: center; padding: 0 5px; flex-shrink: 0; }
.mc-loading-text { padding: 1.25rem; font-size: .85rem; color: #94a3b8; text-align: center; }

/* Chat panel */
.mc-chat { background: #f8fafc; display: flex; flex-direction: column; min-height: 0; }
.mc-chat-header { background: #fff; border-bottom: 1px solid #f0f2f8; padding: 1rem 1.5rem; display: flex; align-items: center; gap: .85rem; flex-shrink: 0; }
.mc-chat-avatar { width: 42px; height: 42px; border-radius: 50%; background: linear-gradient(135deg,#6366f1,#8b5cf6); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 1rem; flex-shrink: 0; position: relative; }
.mc-chat-presence-dot { position: absolute; bottom: 1px; right: 1px; width: 12px; height: 12px; border-radius: 50%; border: 2.5px solid #fff; }
.mc-chat-presence-dot.online { background: #10b981; }
.mc-chat-presence-dot.offline { background: #cbd5e1; }
.mc-chat-name { font-size: 1rem; font-weight: 700; color: #0f172a; }
.mc-chat-status-text { font-size: .72rem; margin-top: 1px; }
.mc-chat-status-text.online { color: #10b981; font-weight: 600; }
.mc-chat-status-text.offline { color: #94a3b8; }

/* Messages */
.mc-messages { flex: 1; overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; gap: .85rem; }
.mc-msg-wrap { display: flex; align-items: flex-end; gap: .5rem; }
.mc-msg-wrap.mine { justify-content: flex-end; }
.mc-msg-wrap.theirs { justify-content: flex-start; }
.mc-msg-avatar { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg,#6366f1,#8b5cf6); display: flex; align-items: center; justify-content: center; color: #fff; font-size: .65rem; font-weight: 700; flex-shrink: 0; }
.mc-bubble { max-width: 68%; padding: .75rem 1rem; border-radius: 1.25rem; font-size: .875rem; line-height: 1.5; }
.mc-bubble.mine { background: linear-gradient(135deg,#6366f1,#8b5cf6); color: #fff; border-bottom-right-radius: .3rem; }
.mc-bubble.theirs { background: #fff; color: #1e293b; border-bottom-left-radius: .3rem; box-shadow: 0 2px 8px rgba(0,0,0,.06); }
.mc-bubble-time { font-size: .63rem; margin-top: .35rem; display: block; }
.mc-bubble.mine .mc-bubble-time { color: rgba(255,255,255,.6); text-align: right; }
.mc-bubble.theirs .mc-bubble-time { color: #94a3b8; }
.mc-read-tick { font-size: .65rem; color: rgba(255,255,255,.7); text-align: right; margin-top: 1px; }

/* Empty & spinner */
.mc-empty-chat { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; text-align: center; padding: 2rem; }
.mc-empty-chat p { font-size: .9rem; font-weight: 600; margin: .75rem 0 .25rem; color: #64748b; }
.mc-empty-chat span { font-size: .78rem; }
.mc-spinner { width: 28px; height: 28px; border: 3px solid #eef0ff; border-top-color: #6366f1; border-radius: 50%; animation: spin .7s linear infinite; margin: 1rem auto; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Composer */
.mc-composer { background: #fff; border-top: 1px solid #f0f2f8; padding: 1rem 1.5rem; flex-shrink: 0; }
.mc-composer-inner { display: flex; align-items: flex-end; gap: .75rem; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 1rem; padding: .65rem .65rem .65rem 1rem; transition: border-color .2s, box-shadow .2s; }
.mc-composer-inner:focus-within { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.1); background: #fff; }
.mc-textarea { flex: 1; border: none; background: transparent; resize: none; outline: none; font-family: 'Inter', sans-serif; font-size: .875rem; color: #1e293b; line-height: 1.5; min-height: 22px; max-height: 120px; overflow-y: auto; }
.mc-textarea::placeholder { color: #94a3b8; }
.mc-send-btn { width: 38px; height: 38px; border-radius: .75rem; background: linear-gradient(135deg,#6366f1,#8b5cf6); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: opacity .2s, transform .1s; box-shadow: 0 3px 10px rgba(99,102,241,.3); color: #fff; }
.mc-send-btn:hover:not(:disabled) { opacity: .9; transform: scale(1.05); }
.mc-send-btn:disabled { background: #e2e8f0; box-shadow: none; cursor: not-allowed; color: #94a3b8; }
.mc-error { margin: .75rem 1.5rem 0; background: #fff1f2; color: #ef4444; padding: .65rem 1rem; border-radius: .75rem; font-size: .8rem; font-weight: 600; border: 1px solid #fecdd3; flex-shrink: 0; }
`;

interface ContactPresence {
  isOnline: boolean;
  lastSeen?: string;
}

function fmtLastSeen(lastSeen?: string): string {
  if (!lastSeen) return "Offline";
  const diff = Date.now() - new Date(lastSeen).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Last seen just now";
  if (mins < 60) return `Last seen ${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Last seen ${hrs}h ago`;
  return `Last seen ${new Date(lastSeen).toLocaleDateString([], { month: "short", day: "numeric" })}`;
}

function fmtTime(ts: string) {
  return new Date(ts).toLocaleString([], { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function initials(name?: string | null) {
  return (name || "?").split(" ").map(w => w[0] || "").join("").slice(0, 2).toUpperCase();
}

export const MessageCenter = () => {
  const { user, role } = useAuth();
  const [contacts, setContacts] = useState<User[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [presenceMap, setPresenceMap] = useState<Record<string, ContactPresence>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const counterpartRole = role === "admin" ? "employee" : "admin";

  const selectedContact = useMemo(
    () => contacts.find((c) => c.uid === selectedContactId) || null,
    [contacts, selectedContactId]
  );

  const selectedPresence = selectedContactId ? presenceMap[selectedContactId] : undefined;

  // ---- Load messages ----
  const loadMessages = useCallback(async () => {
    if (!user?.uid || !selectedContactId) { setMessages([]); return; }
    setLoadingMessages(true);
    try {
      const conv = await firebaseHelpers.getConversationMessages(user.uid, selectedContactId);
      setMessages(conv);
      setError(null);
    } catch { setError("Could not load messages."); }
    finally { setLoadingMessages(false); }
  }, [selectedContactId, user?.uid]);

  // ---- Mark as read when conversation opened ----
  const markRead = useCallback(async () => {
    if (!user?.uid || !selectedContactId) return;
    const key = getConvKey(user.uid, selectedContactId);
    try {
      await firebaseHelpers.markConversationRead(key, user.uid);
      setUnreadCounts(prev => ({ ...prev, [selectedContactId]: 0 }));
    } catch { /* silent */ }
  }, [user?.uid, selectedContactId]);

  // ---- Refresh unread counts ----
  const refreshUnread = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const counts = await firebaseHelpers.getUnreadCounts(user.uid);
      setUnreadCounts(counts);
    } catch { /* silent */ }
  }, [user?.uid]);

  // ---- Refresh presence for all contacts ----
  const refreshPresence = useCallback(async (contactList: User[]) => {
    const results = await Promise.allSettled(
      contactList.map(c => firebaseHelpers.getUserPresence(c.uid).then(p => ({ uid: c.uid, ...p })))
    );
    const map: Record<string, ContactPresence> = {};
    results.forEach(r => {
      if (r.status === "fulfilled") map[r.value.uid] = { isOnline: r.value.isOnline, lastSeen: r.value.lastSeen };
    });
    setPresenceMap(map);
  }, []);

  // ---- Load contacts ----
  useEffect(() => {
    if (!user?.uid || !role) { setContacts([]); setLoadingContacts(false); return; }
    const load = async () => {
      setLoadingContacts(true);
      try {
        const list = role === "admin" ? await firebaseHelpers.getEmployees() : await firebaseHelpers.getAdmins();
        const filtered = list.filter(c => c.uid !== user.uid);
        setContacts(filtered);
        if (!selectedContactId && filtered.length > 0) setSelectedContactId(filtered[0].uid);
        if (filtered.length === 0) { setSelectedContactId(""); setMessages([]); }
        await refreshPresence(filtered);
        await refreshUnread();
      } catch { setError("Could not load contacts."); }
      finally { setLoadingContacts(false); }
    };
    load();
  }, [role, user?.uid]);

  // ---- Poll messages + presence + unread every 5s ----
  useEffect(() => {
    if (!selectedContactId || !user?.uid) return;
    const t = window.setTimeout(() => void loadMessages(), 0);
    const iv = window.setInterval(async () => {
      await loadMessages();
      if (contacts.length) await refreshPresence(contacts);
      await refreshUnread();
    }, 5000);
    return () => { window.clearTimeout(t); window.clearInterval(iv); };
  }, [loadMessages, selectedContactId, user?.uid]);

  // ---- Mark read when contact changes ----
  useEffect(() => {
    if (selectedContactId) void markRead();
  }, [selectedContactId, markRead]);

  // ---- Scroll to bottom ----
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // ---- Auto-resize textarea ----
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "22px";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [draft]);

  // ---- Send message ----
  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !role || !selectedContactId || !draft.trim()) return;
    setSending(true);
    try {
      await firebaseHelpers.sendMessage({
        senderId: user.uid,
        senderRole: role as "admin" | "employee",
        receiverId: selectedContactId,
        receiverRole: counterpartRole,
        content: draft
      });
      setDraft("");
      await loadMessages();
      setError(null);
    } catch { setError("Could not send message."); }
    finally { setSending(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSend(e as any); }
  };

  const handleSelectContact = (uid: string) => {
    setSelectedContactId(uid);
  };

  return (
    <>
      <style>{S}</style>
      <div className="mc-root">
        <div className="mc-header">
          <h1 className="mc-title">Messages</h1>
          <p className="mc-subtitle">
            {role === "admin" ? "Chat directly with your employees" : "Chat directly with administrators"}
          </p>
        </div>

        <div className="mc-body">
          {/* Contacts Sidebar */}
          <aside className="mc-sidebar">
            <div className="mc-sidebar-header">
              <div className="mc-sidebar-title">Contacts</div>
              <div className="mc-sidebar-sub">{role === "admin" ? "All Employees" : "Administrators"}</div>
            </div>
            <div className="mc-contacts">
              {loadingContacts ? (
                <div className="mc-loading-text"><div className="mc-spinner" /></div>
              ) : contacts.length === 0 ? (
                <div className="mc-loading-text">No contacts available.</div>
              ) : (
                contacts.map(contact => {
                  const presence = presenceMap[contact.uid];
                  const unread = unreadCounts[contact.uid] || 0;
                  return (
                    <button
                      key={contact.uid}
                      className={`mc-contact-btn${selectedContactId === contact.uid ? " active" : ""}`}
                      onClick={() => handleSelectContact(contact.uid)}
                    >
                      <div className="mc-contact-avatar-wrap">
                        <div className="mc-avatar">{initials(contact.fullName || contact.email)}</div>
                        <span className={`mc-presence-dot ${presence?.isOnline ? "online" : "offline"}`} />
                      </div>
                      <div className="mc-contact-info">
                        <div className="mc-contact-name">{contact.fullName || contact.email}</div>
                        <div className="mc-contact-sub">
                          {presence?.isOnline
                            ? "● Online"
                            : fmtLastSeen(presence?.lastSeen)}
                        </div>
                      </div>
                      {unread > 0 && (
                        <span className="mc-unread-badge">{unread > 99 ? "99+" : unread}</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* Chat Panel */}
          <section className="mc-chat">
            {/* Header */}
            <div className="mc-chat-header">
              {selectedContact ? (
                <>
                  <div className="mc-chat-avatar">
                    {initials(selectedContact.fullName || selectedContact.email)}
                    <span className={`mc-chat-presence-dot ${selectedPresence?.isOnline ? "online" : "offline"}`} />
                  </div>
                  <div>
                    <div className="mc-chat-name">{selectedContact.fullName || selectedContact.email}</div>
                    <div className={`mc-chat-status-text ${selectedPresence?.isOnline ? "online" : "offline"}`}>
                      {selectedPresence?.isOnline ? "● Online" : fmtLastSeen(selectedPresence?.lastSeen)}
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <div className="mc-chat-name" style={{ color: "#94a3b8" }}>No conversation selected</div>
                  <div className="mc-chat-status-text offline">Choose a contact from the left</div>
                </div>
              )}
            </div>

            {error && <div className="mc-error">⚠️ {error}</div>}

            {/* Messages */}
            <div className="mc-messages">
              {!selectedContactId ? (
                <div className="mc-empty-chat">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <p>Select a contact to start chatting</p>
                  <span>Your messages will appear here</span>
                </div>
              ) : loadingMessages && messages.length === 0 ? (
                <div className="mc-empty-chat"><div className="mc-spinner" /></div>
              ) : messages.length === 0 ? (
                <div className="mc-empty-chat">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <p>No messages yet</p>
                  <span>Say hello to {selectedContact?.fullName || "this contact"}! 👋</span>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const mine = msg.senderId === user?.uid;
                  const isLast = i === messages.length - 1;
                  return (
                    <div key={msg.id} className={`mc-msg-wrap ${mine ? "mine" : "theirs"}`}>
                      {!mine && (
                        <div className="mc-msg-avatar">{initials(selectedContact?.fullName || selectedContact?.email)}</div>
                      )}
                      <div className={`mc-bubble ${mine ? "mine" : "theirs"}`}>
                        <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{msg.content}</span>
                        <span className="mc-bubble-time">{fmtTime(msg.createdAt)}</span>
                        {mine && isLast && (
                          <div className="mc-read-tick">
                            {(msg as any).read ? "✓✓ Read" : "✓ Sent"}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Composer */}
            <form className="mc-composer" onSubmit={handleSend}>
              <div className="mc-composer-inner">
                <textarea
                  ref={textareaRef}
                  className="mc-textarea"
                  value={draft}
                  rows={1}
                  placeholder={selectedContactId ? "Type a message… (Enter to send)" : "Select a contact first"}
                  disabled={!selectedContactId || sending}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button
                  type="submit"
                  className="mc-send-btn"
                  disabled={!selectedContactId || sending || !draft.trim()}
                  aria-label="Send message"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </>
  );
};
