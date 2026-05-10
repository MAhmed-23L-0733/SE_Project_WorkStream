"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { firebaseHelpers } from "@/lib/firebase";
import { Message, User } from "@/types";
import { useAuth } from "@/hooks/useAuth";

const S = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
* { box-sizing: border-box; }
.mc-root { display: flex; flex-direction: column; height: 100vh; padding: 1.75rem 2rem 0; background: #f5f7ff; font-family: 'Inter', sans-serif; }
.mc-header { margin-bottom: 1.25rem; flex-shrink: 0; }
.mc-title { font-size: 1.75rem; font-weight: 800; color: #0f172a; margin: 0; }
.mc-subtitle { font-size: 0.875rem; color: #64748b; margin: 0.25rem 0 0; }
.mc-body { flex: 1; display: grid; grid-template-columns: 280px 1fr; border-radius: 1.25rem; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.08); border: 1px solid #e8eaf0; min-height: 0; margin-bottom: 1.75rem; }
@media (max-width: 768px) { .mc-body { grid-template-columns: 1fr; } }

/* Contacts sidebar */
.mc-sidebar { background: #fff; border-right: 1px solid #f0f2f8; display: flex; flex-direction: column; min-height: 0; }
.mc-sidebar-header { padding: 1.25rem 1.25rem 1rem; border-bottom: 1px solid #f0f2f8; flex-shrink: 0; }
.mc-sidebar-title { font-size: .9rem; font-weight: 700; color: #1e293b; margin: 0; }
.mc-sidebar-sub { font-size: .72rem; color: #94a3b8; font-weight: 500; margin: .15rem 0 0; }
.mc-contacts { flex: 1; overflow-y: auto; }
.mc-contact { display: flex; align-items: center; gap: .75rem; padding: .85rem 1.25rem; cursor: pointer; transition: background .15s; border-bottom: 1px solid #f8fafc; width: 100%; border-left: none; border-right: none; border-top: none; background: transparent; text-align: left; font-family: 'Inter', sans-serif; }
.mc-contact:hover { background: #f8faff; }
.mc-contact.active { background: #eef0ff; border-left: 3px solid #6366f1; }
.mc-contact.active .mc-contact-name { color: #6366f1; }
.mc-contact-avatar { width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg,#6366f1,#8b5cf6); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: .85rem; flex-shrink: 0; }
.mc-contact-name { font-size: .875rem; font-weight: 600; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mc-contact-email { font-size: .72rem; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }
.mc-contact-info { flex: 1; min-width: 0; }
.mc-loading-text { padding: 1.25rem; font-size: .85rem; color: #94a3b8; }

/* Chat panel */
.mc-chat { background: #f8fafc; display: flex; flex-direction: column; min-height: 0; }
.mc-chat-header { background: #fff; border-bottom: 1px solid #f0f2f8; padding: 1rem 1.5rem; display: flex; align-items: center; gap: .85rem; flex-shrink: 0; }
.mc-chat-header-avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg,#6366f1,#8b5cf6); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: .95rem; flex-shrink: 0; }
.mc-chat-name { font-size: 1rem; font-weight: 700; color: #0f172a; }
.mc-chat-status { font-size: .72rem; color: #94a3b8; margin-top: 1px; }
.mc-online-dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; display: inline-block; margin-right: .35rem; }

/* Messages area */
.mc-messages { flex: 1; overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; gap: .85rem; }
.mc-msg-wrap { display: flex; }
.mc-msg-wrap.mine { justify-content: flex-end; }
.mc-msg-wrap.theirs { justify-content: flex-start; }
.mc-bubble { max-width: 72%; padding: .75rem 1rem; border-radius: 1.25rem; font-size: .875rem; line-height: 1.5; position: relative; }
.mc-bubble.mine { background: linear-gradient(135deg,#6366f1,#8b5cf6); color: #fff; border-bottom-right-radius: .3rem; }
.mc-bubble.theirs { background: #fff; color: #1e293b; border-bottom-left-radius: .3rem; box-shadow: 0 2px 8px rgba(0,0,0,.06); }
.mc-bubble-time { font-size: .65rem; margin-top: .35rem; display: block; }
.mc-bubble.mine .mc-bubble-time { color: rgba(255,255,255,.65); text-align: right; }
.mc-bubble.theirs .mc-bubble-time { color: #94a3b8; }
.mc-empty-chat { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; text-align: center; padding: 2rem; }
.mc-empty-chat p { font-size: .875rem; font-weight: 600; margin: .75rem 0 .25rem; color: #64748b; }
.mc-empty-chat span { font-size: .78rem; }

/* Composer */
.mc-composer { background: #fff; border-top: 1px solid #f0f2f8; padding: 1rem 1.5rem; flex-shrink: 0; }
.mc-composer-inner { display: flex; align-items: flex-end; gap: .75rem; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 1rem; padding: .65rem .65rem .65rem 1rem; transition: border-color .2s, box-shadow .2s; }
.mc-composer-inner:focus-within { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.1); background: #fff; }
.mc-textarea { flex: 1; border: none; background: transparent; resize: none; outline: none; font-family: 'Inter', sans-serif; font-size: .875rem; color: #1e293b; line-height: 1.5; min-height: 22px; max-height: 120px; overflow-y: auto; }
.mc-textarea::placeholder { color: #94a3b8; }
.mc-send-btn { width: 38px; height: 38px; border-radius: .75rem; background: linear-gradient(135deg,#6366f1,#8b5cf6); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: opacity .2s, transform .1s; box-shadow: 0 3px 10px rgba(99,102,241,.3); }
.mc-send-btn:hover:not(:disabled) { opacity: .9; transform: scale(1.05); }
.mc-send-btn:disabled { background: #e2e8f0; box-shadow: none; cursor: not-allowed; }
.mc-send-btn:disabled svg { stroke: #94a3b8; }
.mc-spinner { width: 30px; height: 30px; border: 3px solid #eef0ff; border-top-color: #6366f1; border-radius: 50%; animation: spin .7s linear infinite; margin: 2rem auto; }
@keyframes spin { to { transform: rotate(360deg); } }
.mc-error { margin: .75rem 1.5rem 0; background: #fff1f2; color: #ef4444; padding: .65rem 1rem; border-radius: .75rem; font-size: .8rem; font-weight: 600; border: 1px solid #fecdd3; flex-shrink: 0; }
`;

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
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const counterpartRole = role === "admin" ? "employee" : "admin";

  const selectedContact = useMemo(
    () => contacts.find((c) => c.uid === selectedContactId) || null,
    [contacts, selectedContactId]
  );

  const loadMessages = useCallback(async () => {
    if (!user?.uid || !selectedContactId) { setMessages([]); return; }
    setLoadingMessages(true);
    try {
      const conv = await firebaseHelpers.getConversationMessages(user.uid, selectedContactId);
      setMessages(conv);
      setError(null);
    } catch { setError("Could not load messages."); }
    finally { setLoadingMessages(false); }
  }, [selectedContactId, user]);

  useEffect(() => {
    const load = async () => {
      if (!user?.uid || !role) { setContacts([]); setLoadingContacts(false); return; }
      setLoadingContacts(true);
      try {
        const list = role === "admin" ? await firebaseHelpers.getEmployees() : await firebaseHelpers.getAdmins();
        const filtered = list.filter((c) => c.uid !== user.uid);
        setContacts(filtered);
        if (!selectedContactId && filtered.length > 0) setSelectedContactId(filtered[0].uid);
        if (filtered.length === 0) { setSelectedContactId(""); setMessages([]); }
        setError(null);
      } catch { setError("Could not load contacts."); }
      finally { setLoadingContacts(false); }
    };
    load();
  }, [role, user?.uid]);

  useEffect(() => {
    if (!selectedContactId || !user?.uid) return;
    const t = window.setTimeout(() => void loadMessages(), 0);
    const iv = window.setInterval(() => void loadMessages(), 5000);
    return () => { window.clearTimeout(t); window.clearInterval(iv); };
  }, [loadMessages, selectedContactId, user?.uid]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "22px";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [draft]);

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
    } catch { setError("Could not send message. Please try again."); }
    finally { setSending(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend(e as any);
    }
  };

  const fmt = (ts: string) =>
    new Date(ts).toLocaleString([], { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });

  const initials = (name?: string | null) =>
    (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

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
          {/* Contacts sidebar */}
          <aside className="mc-sidebar">
            <div className="mc-sidebar-header">
              <h2 className="mc-sidebar-title">Contacts</h2>
              <p className="mc-sidebar-sub">{role === "admin" ? "All Employees" : "Administrators"}</p>
            </div>
            <div className="mc-contacts">
              {loadingContacts ? (
                <div className="mc-loading-text"><div className="mc-spinner" style={{ width: 24, height: 24, margin: "1rem auto" }} /></div>
              ) : contacts.length === 0 ? (
                <div className="mc-loading-text">No contacts available.</div>
              ) : (
                contacts.map(contact => (
                  <button
                    key={contact.uid}
                    className={`mc-contact${selectedContactId === contact.uid ? " active" : ""}`}
                    onClick={() => setSelectedContactId(contact.uid)}
                  >
                    <div className="mc-contact-avatar">{initials(contact.fullName || contact.email)}</div>
                    <div className="mc-contact-info">
                      <div className="mc-contact-name">{contact.fullName || contact.email}</div>
                      <div className="mc-contact-email">{contact.email}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </aside>

          {/* Chat panel */}
          <section className="mc-chat">
            {/* Chat header */}
            <div className="mc-chat-header">
              {selectedContact ? (
                <>
                  <div className="mc-chat-header-avatar">{initials(selectedContact.fullName || selectedContact.email)}</div>
                  <div>
                    <div className="mc-chat-name">{selectedContact.fullName || selectedContact.email}</div>
                    <div className="mc-chat-status">
                      <span className="mc-online-dot" />
                      {selectedContact.position || (counterpartRole === "employee" ? "Employee" : "Administrator")}
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <div className="mc-chat-name" style={{ color: "#94a3b8" }}>No conversation selected</div>
                  <div className="mc-chat-status">Choose a contact from the left</div>
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
                messages.map(msg => {
                  const mine = msg.senderId === user?.uid;
                  return (
                    <div key={msg.id} className={`mc-msg-wrap ${mine ? "mine" : "theirs"}`}>
                      <div className={`mc-bubble ${mine ? "mine" : "theirs"}`}>
                        <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{msg.content}</span>
                        <span className="mc-bubble-time">{fmt(msg.createdAt)}</span>
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
                  disabled={!selectedContactId || sending || !draft?.trim()}
                  aria-label="Send message"
                >
                  <svg 
                    width="18" 
                    height="18" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" // Using 'currentColor' is better for CSS control
                    strokeWidth="2.2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
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
