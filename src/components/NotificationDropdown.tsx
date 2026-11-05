'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  FileText, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  X,
  Sparkles
} from 'lucide-react';

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string; // info, success, warning, danger, loan, installment
  is_read: boolean;
  target_url?: string;
  created_at: string;
}

interface Props {
  onNavigate?: (targetUrl?: string) => void;
}

export const NotificationDropdown: React.FC<Props> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 8000); // Polling every 8 sec for realtime update
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data);
        setUnreadCount(res.data.unread_count);
      }
    } catch (err) {
      // Silent error
    }
  };

  const handleItemClick = async (notif: NotificationItem) => {
    if (!notif.is_read) {
      try {
        await api.post(`/notifications/${notif.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark read:', err);
      }
    }
    setIsOpen(false);

    // Smart fallback if target_url is missing or generic
    let target = notif.target_url;
    if (!target || target === '/dashboard') {
      if (notif.type === 'installment' || notif.title.toLowerCase().includes('angsuran')) {
        target = '/loans/1?modal=installments';
      } else if (notif.type === 'loan' || notif.title.toLowerCase().includes('pinjaman') || notif.title.toLowerCase().includes('spk')) {
        target = '/loans/1?modal=verify';
      } else {
        target = '/dashboard';
      }
    }

    if (onNavigate) {
      onNavigate(target);
    } else {
      window.dispatchEvent(
        new CustomEvent('NOTIF_NAVIGATE', {
          detail: { targetUrl: target },
        })
      );
    }
  };

  const handleMarkAsRead = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.post('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'danger':
        return <XCircle className="w-4 h-4 text-rose-600 shrink-0" />;
      case 'installment':
        return <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />;
      case 'loan':
        return <Sparkles className="w-4 h-4 text-gold-500 shrink-0" />;
      default:
        return <FileText className="w-4 h-4 text-emerald-600 shrink-0" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition border border-white/10 flex items-center justify-center focus:outline-none"
        title="Notifikasi Realtime System"
      >
        <Bell className="w-5 h-5 text-emerald-200" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-slate-900 shadow-md animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Window */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-kopkar-950 to-slate-900 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-400" />
              <h4 className="font-extrabold text-xs tracking-tight">Pemberitahuan Realtime</h4>
              {unreadCount > 0 && (
                <span className="bg-rose-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                  {unreadCount} Baru
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] text-emerald-300 hover:text-white font-bold flex items-center gap-1 underline"
              >
                <CheckCheck className="w-3 h-3" /> Tandai Dibaca
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-1">
                <Bell className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
                <p className="font-bold text-xs">Belum ada notifikasi baru</p>
                <p className="text-[10px]">Pemberitahuan alur kredit akan muncul di sini</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`p-3.5 flex items-start gap-3 transition cursor-pointer group ${
                    !notif.is_read ? 'bg-emerald-50/70 font-semibold hover:bg-emerald-100/80' : 'bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-xs mt-0.5 group-hover:scale-105 transition">
                    {getIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <h5 className={`text-xs ${!notif.is_read ? 'font-black text-slate-900' : 'font-bold text-slate-800'}`}>
                        {notif.title}
                      </h5>
                      <span className="text-[9px] font-mono text-slate-400 shrink-0">
                        {formatDate(notif.created_at)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                      {notif.message}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[9px] font-bold text-emerald-700 group-hover:underline flex items-center gap-1">
                        Buka Halaman Target &rarr;
                      </span>
                      {!notif.is_read && (
                        <button
                          onClick={(e) => handleMarkAsRead(notif.id, e)}
                          className="text-[9px] font-bold text-slate-400 hover:text-emerald-800 flex items-center gap-0.5"
                        >
                          <Check className="w-3 h-3" /> Dibaca
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="bg-slate-50 p-2.5 text-center text-[10px] text-slate-400 font-medium border-t border-slate-100">
            Terhubung ke Sistem Notifikasi SPK SMART Koperasi
          </div>

        </div>
      )}
    </div>
  );
};
