"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { firebaseHelpers } from "@/lib/firebase";
import { Message, User } from "@/types";
import { useAuth } from "@/hooks/useAuth";

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

  const counterpartRole = role === "admin" ? "employee" : "admin";

  const selectedContact = useMemo(
    () => contacts.find((contact) => contact.uid === selectedContactId) || null,
    [contacts, selectedContactId]
  );

  const loadMessages = useCallback(async () => {
    if (!user?.uid || !selectedContactId) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    try {
      const conversation = await firebaseHelpers.getConversationMessages(user.uid, selectedContactId);
      setMessages(conversation);
      setError(null);
    } catch (loadError) {
      console.error("Error loading messages:", loadError);
      setError("Could not load messages right now.");
    } finally {
      setLoadingMessages(false);
    }
  }, [selectedContactId, user]);

  useEffect(() => {
    const loadContacts = async () => {
      if (!user?.uid || !role) {
        setContacts([]);
        setLoadingContacts(false);
        return;
      }

      setLoadingContacts(true);
      try {
        const list = role === "admin" ? await firebaseHelpers.getEmployees() : await firebaseHelpers.getAdmins();
        const filteredList = list.filter((contact) => contact.uid !== user.uid);
        setContacts(filteredList);

        if (!selectedContactId && filteredList.length > 0) {
          setSelectedContactId(filteredList[0].uid);
        }

        if (filteredList.length === 0) {
          setSelectedContactId("");
          setMessages([]);
        }

        setError(null);
      } catch (loadError) {
        console.error("Error loading contacts:", loadError);
        setError("Could not load available contacts.");
      } finally {
        setLoadingContacts(false);
      }
    };

    loadContacts();
  }, [role, selectedContactId, user?.uid]);

  useEffect(() => {
    if (!selectedContactId || !user?.uid) {
      return;
    }

    // Defer the initial fetch to avoid synchronous state updates directly in the effect.
    const initialLoadTimer = window.setTimeout(() => {
      void loadMessages();
    }, 0);

    const intervalId = window.setInterval(() => {
      void loadMessages();
    }, 5000);

    return () => {
      window.clearTimeout(initialLoadTimer);
      window.clearInterval(intervalId);
    };
  }, [loadMessages, selectedContactId, user?.uid]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!user?.uid || !role || !selectedContactId || !draft.trim()) {
      return;
    }

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
    } catch (sendError) {
      console.error("Error sending message:", sendError);
      setError("Could not send your message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString([], {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Messages</h1>
        <p className="mt-2 text-slate-600">
          {role === "admin"
            ? "Chat directly with employees"
            : "Chat directly with administrators"}
        </p>
      </div>

      <div className="grid min-h-[70vh] grid-cols-1 overflow-hidden rounded-xl bg-white shadow lg:grid-cols-[320px_1fr]">
        <aside className="border-b border-slate-200 lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-lg font-semibold text-slate-900">Contacts</h2>
            <p className="text-xs text-slate-500">
              {role === "admin" ? "Employees" : "Admins"}
            </p>
          </div>

          {loadingContacts ? (
            <div className="p-4 text-sm text-slate-600">Loading contacts...</div>
          ) : contacts.length === 0 ? (
            <div className="p-4 text-sm text-slate-600">
              No {counterpartRole === "admin" ? "admins" : "employees"} found.
            </div>
          ) : (
            <div className="max-h-[28rem] overflow-y-auto">
              {contacts.map((contact) => (
                <button
                  key={contact.uid}
                  onClick={() => setSelectedContactId(contact.uid)}
                  className={`w-full border-b border-slate-100 px-4 py-3 text-left transition-colors ${
                    selectedContactId === contact.uid
                      ? "bg-blue-50 text-blue-900"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <p className="font-medium">{contact.fullName || contact.email}</p>
                  <p className="truncate text-xs text-slate-500">{contact.email}</p>
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className="flex min-h-[32rem] flex-col">
          <div className="border-b border-slate-200 px-6 py-4">
            <p className="text-sm text-slate-500">Conversation with</p>
            <h3 className="text-xl font-semibold text-slate-900">
              {selectedContact?.fullName || selectedContact?.email || "Select a contact"}
            </h3>
          </div>

          {error && (
            <div className="mx-6 mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 px-6 py-4">
            {!selectedContactId ? (
              <p className="text-sm text-slate-600">Choose a contact to start messaging.</p>
            ) : loadingMessages ? (
              <p className="text-sm text-slate-600">Loading messages...</p>
            ) : messages.length === 0 ? (
              <p className="text-sm text-slate-600">No messages yet. Say hello.</p>
            ) : (
              messages.map((message) => {
                const isMine = message.senderId === user?.uid;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                        isMine
                          ? "bg-blue-600 text-white"
                          : "bg-white text-slate-900"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      <p
                        className={`mt-1 text-[11px] ${
                          isMine ? "text-blue-100" : "text-slate-500"
                        }`}
                      >
                        {formatMessageTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="border-t border-slate-200 bg-white p-4">
            <div className="flex items-end gap-3">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={selectedContactId ? "Type your message..." : "Select a contact first"}
                disabled={!selectedContactId || sending}
                rows={2}
                className="min-h-[44px] flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
              />
              <button
                type="submit"
                disabled={!selectedContactId || sending || !draft.trim()}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};
