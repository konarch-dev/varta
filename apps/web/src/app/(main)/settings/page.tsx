'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  Lock,
  Bell,
  User,
  Shield,
  ArrowLeft,
  Moon,
  Sun,
  Globe2,
  Sparkles,
  CheckCircle2,
  KeyRound,
  Edit3,
  Check,
  X,
  Copy,
  AlertCircle,
  FileCheck2,
  Send,
} from 'lucide-react';
import { MainLayout } from '../../../components/layout/MainLayout';
import { apiRequest } from '../../../lib/api';
import { useAuthStore } from '../../../stores/authStore';

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'all';
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  const queryClient = useQueryClient();
  const { user, logout, updateUser, initAuth } = useAuthStore();

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync tab from URL if changed
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  // Privacy State
  const [isPrivate, setIsPrivate] = useState<boolean>(user?.isPrivate || false);
  const [allowDMsFromEveryone, setAllowDMsFromEveryone] = useState<boolean>(true);
  const [readReceipts, setReadReceipts] = useState<boolean>(true);

  useEffect(() => {
    if (user) {
      setIsPrivate(Boolean(user.isPrivate));
    }
  }, [user]);

  // Language State with Bharat greetings
  const [selectedLanguage, setSelectedLanguage] = useState<string>('English');
  useEffect(() => {
    const savedLang = localStorage.getItem('varta_lang');
    if (savedLang) setSelectedLanguage(savedLang);
  }, []);

  const languageGreetings: Record<string, { greeting: string; slogan: string }> = {
    English: { greeting: 'Welcome to VARTA', slogan: 'Baat Sabki — The Voice of Every Citizen' },
    'हिन्दी (Hindi)': { greeting: 'वार्ता में आपका स्वागत है', slogan: 'बात सबकी — हर नागरिक की आवाज़' },
    'ગુજરાતી (Gujarati)': { greeting: 'વાર્તા માં આપનું સ્વાગત છે', slogan: 'વાત સહુની — દરેક નાગરિકનો અવાજ' },
    'मराठी (Marathi)': { greeting: 'वार्ता मध्ये आपले स्वागत आहे', slogan: 'बात सबकी — प्रत्येक नागरिकाचा आवाज' },
    'தமிழ் (Tamil)': { greeting: 'வார்தாவிற்கு நல்வரவு', slogan: 'அனைவரின் பேச்சு — பாரதத்தின் குரல்' },
    'తెలుగు (Telugu)': { greeting: 'వార్తకు స్వాగతం', slogan: 'అందరి మాట — ప్రతి పౌరుడి గొంతు' },
    'বাংলা (Bengali)': { greeting: 'বার্তায় স্বাগতম', slogan: 'বার্তায় সবার কথা — দেশের কণ্ঠস্বর' },
    'ಕನ್ನಡ (Kannada)': { greeting: 'ವಾರ್ತೆಗೆ ಸುಸ್ವಾಗತ', slogan: 'ಎಲ್ಲರ ಮಾತು — ಭಾರತದ ಧ್ವನಿ' },
    'മലയാളം (Malayalam)': { greeting: 'വാർത്തയിലേക്ക് സ്വാഗതം', slogan: 'എല്ലാവരുടെയും ശബ്ദം' },
    'ਪੰਜਾਬੀ (Punjabi)': { greeting: 'ਵਾਰਤਾ ਵਿੱਚ ਜੀ ਆਇਆਂ ਨੂੰ', slogan: 'ਸਭ ਦੀ ਗੱਲ — ਭਾਰਤ ਦੀ ਆਵਾਜ਼' },
  };

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    localStorage.setItem('varta_lang', lang);
    showToast(`Language set to ${lang}`);
  };

  // Theme State
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'dim' | 'light'>('dark');
  useEffect(() => {
    const savedTheme = (localStorage.getItem('varta_theme') as 'dark' | 'dim' | 'light') || 'dark';
    setCurrentTheme(savedTheme);
    applyThemeClass(savedTheme);
  }, []);

  const applyThemeClass = (theme: 'dark' | 'dim' | 'light') => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  };

  const handleThemeChange = (theme: 'dark' | 'dim' | 'light') => {
    setCurrentTheme(theme);
    localStorage.setItem('varta_theme', theme);
    applyThemeClass(theme);
    showToast(`Theme changed to ${theme === 'dark' ? 'Dark Premium' : theme === 'dim' ? 'Dim Midnight' : 'Clean Daylight'}`);
  };

  // Notification Preferences Query
  const { data: preferences, refetch: refetchPrefs } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () => apiRequest<any>('/notifications/preferences'),
    enabled: !!user,
  });

  // Privacy Mutation
  const privacyMutation = useMutation({
    mutationFn: (newPrivate: boolean) =>
      apiRequest<{ isPrivate: boolean }>('/users/settings/privacy', {
        method: 'PATCH',
        body: JSON.stringify({ isPrivate: newPrivate }),
      }),
    onSuccess: (data) => {
      setIsPrivate(data.isPrivate);
      updateUser({ isPrivate: data.isPrivate });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      showToast(data.isPrivate ? 'Account is now Private' : 'Account is now Public');
    },
    onError: () => {
      showToast('Failed to update privacy settings');
    },
  });

  // Preferences Mutation
  const updatePrefMutation = useMutation({
    mutationFn: (updated: any) =>
      apiRequest('/notifications/preferences', {
        method: 'PATCH',
        body: JSON.stringify(updated),
      }),
    onSuccess: () => {
      refetchPrefs();
      showToast('Notification preferences updated');
    },
    onError: () => {
      showToast('Failed to save preference');
    },
  });

  // Premium Toggle Mutation
  const [isActivatingPremium, setIsActivatingPremium] = useState(false);
  const handleTogglePremium = async () => {
    setIsActivatingPremium(true);
    try {
      const res = await apiRequest<{ success: boolean; isVerified: boolean; message: string }>(
        '/users/settings/premium',
        { method: 'POST' }
      );
      updateUser({ isVerified: res.isVerified });
      await initAuth();
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      showToast(res.message);
    } catch {
      showToast('Failed to update VARTA+ subscription');
    } finally {
      setIsActivatingPremium(false);
    }
  };

  // Edit Account Info Modal State
  const [isEditAccountOpen, setIsEditAccountOpen] = useState(false);
  const [editUsername, setEditUsername] = useState(user?.username || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [accountError, setAccountError] = useState<string | null>(null);
  const [accountSaving, setAccountSaving] = useState(false);

  const openEditAccount = () => {
    setEditUsername(user?.username || '');
    setEditEmail(user?.email || '');
    setAccountError(null);
    setIsEditAccountOpen(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountSaving(true);
    setAccountError(null);
    try {
      const updated = await apiRequest<any>('/users/settings/account', {
        method: 'PATCH',
        body: JSON.stringify({ username: editUsername, email: editEmail }),
      });
      updateUser(updated);
      setIsEditAccountOpen(false);
      showToast('Account details updated successfully!');
    } catch (err: any) {
      setAccountError(err.message || 'Failed to update account information');
    } finally {
      setAccountSaving(false);
    }
  };

  // Change Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const openPasswordModal = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
    setIsPasswordModalOpen(true);
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setPasswordSaving(true);
    setPasswordError(null);
    try {
      await apiRequest('/users/settings/password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setIsPasswordModalOpen(false);
      showToast('Password changed successfully!');
    } catch (err: any) {
      setPasswordError(err.message || 'Incorrect current password or server error');
    } finally {
      setPasswordSaving(false);
    }
  };

  // IT Grievance Filing State
  const [isGrievanceModalOpen, setIsGrievanceModalOpen] = useState(false);
  const [grievanceCategory, setGrievanceCategory] = useState('Content Violation / Hate Speech');
  const [grievanceUrl, setGrievanceUrl] = useState('');
  const [grievanceDetails, setGrievanceDetails] = useState('');
  const [grievanceEmail, setGrievanceEmail] = useState(user?.email || '');
  const [filedTicketId, setFiledTicketId] = useState<string | null>(null);
  const [copiedTicket, setCopiedTicket] = useState(false);

  const handleSubmitGrievance = (e: React.FormEvent) => {
    e.preventDefault();
    const ticketId = `VARTA-IT2021-${Math.floor(100000 + Math.random() * 900000)}`;
    setFiledTicketId(ticketId);
    showToast(`Grievance filed successfully! Ticket: ${ticketId}`);
  };

  const copyTicketId = () => {
    if (filedTicketId) {
      navigator.clipboard.writeText(filedTicketId);
      setCopiedTicket(true);
      setTimeout(() => setCopiedTicket(false), 2000);
      showToast('Ticket reference ID copied to clipboard');
    }
  };

  const tabs = [
    { id: 'all', label: 'All Settings' },
    { id: 'account', label: 'Account' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'language', label: 'Bharat Language' },
    { id: 'privacy', label: 'Privacy' },
    { id: 'notifications', label: 'Alerts' },
    { id: 'premium', label: 'VARTA+' },
    { id: 'grievance', label: 'IT Grievance' },
  ];

  return (
    <MainLayout>
      {/* Sticky Top Header */}
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-[#050B14]/90 backdrop-blur-md border-b border-slate-200 dark:border-[#1E293B] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-[#101D2D] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
            title="Go back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Settings size={18} className="text-[#FF9933]" />
              Settings & Privacy
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Manage your VARTA account, preferences, and Bharat compliance
            </p>
          </div>
        </div>

        {user?.isVerified && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-[#FF9933]/15 border border-[#FF9933]/30 rounded-full text-[11px] font-bold text-[#FF9933]">
            <Sparkles size={13} />
            <span>VARTA+ Verified</span>
          </div>
        )}
      </div>

      {/* Settings Navigation Pills */}
      <div className="border-b border-slate-200 dark:border-[#1E293B] px-4 py-2.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none bg-slate-50/70 dark:bg-[#0B1422]/60">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-[#FF9933] text-white shadow-md shadow-[#FF9933]/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-[#101D2D]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4 flex flex-col gap-6 max-w-3xl pb-16">
        {/* ================= 1. ACCOUNT INFORMATION ================= */}
        {(activeTab === 'all' || activeTab === 'account') && (
          <section className="bg-white dark:bg-[#0B1422] border border-slate-200 dark:border-[#1E293B] rounded-3xl p-5 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <User size={16} className="text-[#FF9933]" />
                Account Information
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={openEditAccount}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#101D2D] hover:bg-slate-200 dark:hover:bg-[#1A2C42] border border-slate-200 dark:border-[#1E293B] text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Edit3 size={13} className="text-[#FF9933]" />
                  <span>Edit Info</span>
                </button>
                <button
                  onClick={openPasswordModal}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#101D2D] hover:bg-slate-200 dark:hover:bg-[#1A2C42] border border-slate-200 dark:border-[#1E293B] text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <KeyRound size={13} className="text-[#38BDF8]" />
                  <span>Password</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex flex-col gap-1 p-3.5 bg-slate-50 dark:bg-[#101D2D] rounded-2xl border border-slate-200 dark:border-[#1E293B]">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Username</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                  @{user?.username}
                  {user?.isVerified && (
                    <span className="text-[#FF9933]" title="Verified Account">
                      <CheckCircle2 size={14} className="fill-[#FF9933] text-white dark:text-[#050B14]" />
                    </span>
                  )}
                </span>
              </div>
              <div className="flex flex-col gap-1 p-3.5 bg-slate-50 dark:bg-[#101D2D] rounded-2xl border border-slate-200 dark:border-[#1E293B]">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Email Address</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm truncate">{user?.email || 'Not configured'}</span>
              </div>
              <div className="flex flex-col gap-1 p-3.5 bg-slate-50 dark:bg-[#101D2D] rounded-2xl border border-slate-200 dark:border-[#1E293B]">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Role</span>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#FF9933]/15 text-[#FF9933] font-extrabold text-xs tracking-wider border border-[#FF9933]/30">
                    {user?.role || 'USER'}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1 p-3.5 bg-slate-50 dark:bg-[#101D2D] rounded-2xl border border-slate-200 dark:border-[#1E293B]">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Status</span>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00C853] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00C853]"></span>
                  </span>
                  <span className="font-extrabold text-[#00C853] text-sm">
                    {user?.status || 'ACTIVE'}
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ================= 2. THEME & APPEARANCE ================= */}
        {(activeTab === 'all' || activeTab === 'appearance') && (
          <section className="bg-white dark:bg-[#0B1422] border border-slate-200 dark:border-[#1E293B] rounded-3xl p-5 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                {currentTheme === 'light' ? (
                  <Sun size={16} className="text-[#FF9933]" />
                ) : (
                  <Moon size={16} className="text-[#FF9933]" />
                )}
                Theme & Appearance
              </h2>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-[#101D2D] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#1E293B]">
                Current: {currentTheme === 'dark' ? 'Dark Premium' : currentTheme === 'dim' ? 'Dim Midnight' : 'Clean Light'}
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Personalize how VARTA looks across your desktop and mobile devices.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: Dark Premium */}
              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={`p-3.5 rounded-2xl border text-left flex flex-col gap-2 transition-all ${
                  currentTheme === 'dark'
                    ? 'border-[#FF9933] bg-[#101D2D] shadow-md shadow-[#FF9933]/15'
                    : 'border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#050B14] hover:border-slate-400 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-5 h-5 rounded-full bg-[#050B14] border border-[#FF9933] flex items-center justify-center">
                    <Moon size={12} className="text-[#FF9933]" />
                  </div>
                  {currentTheme === 'dark' && (
                    <Check size={14} className="text-[#FF9933]" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-slate-900 dark:text-white text-xs">Dark Premium</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Deep obsidian & saffron</span>
                </div>
              </button>

              {/* Option 2: Dim Midnight */}
              <button
                type="button"
                onClick={() => handleThemeChange('dim')}
                className={`p-3.5 rounded-2xl border text-left flex flex-col gap-2 transition-all ${
                  currentTheme === 'dim'
                    ? 'border-[#38BDF8] bg-[#101D2D] shadow-md shadow-[#38BDF8]/15'
                    : 'border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#0B1422] hover:border-slate-400 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-5 h-5 rounded-full bg-[#101D2D] border border-[#38BDF8] flex items-center justify-center">
                    <Moon size={12} className="text-[#38BDF8]" />
                  </div>
                  {currentTheme === 'dim' && (
                    <Check size={14} className="text-[#38BDF8]" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-slate-900 dark:text-white text-xs">Dim Midnight</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Deep navy slate tone</span>
                </div>
              </button>

              {/* Option 3: Clean Daylight */}
              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                className={`p-3.5 rounded-2xl border text-left flex flex-col gap-2 transition-all ${
                  currentTheme === 'light'
                    ? 'border-[#FF9933] bg-amber-500/10 shadow-md shadow-amber-500/15'
                    : 'border-slate-200 dark:border-[#1E293B] bg-slate-50 dark:bg-[#101D2D] hover:border-slate-400 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-5 h-5 rounded-full bg-white border border-amber-500 flex items-center justify-center">
                    <Sun size={12} className="text-amber-500" />
                  </div>
                  {currentTheme === 'light' && (
                    <Check size={14} className="text-amber-500" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-slate-900 dark:text-white text-xs">Clean Daylight</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">High contrast daylight</span>
                </div>
              </button>
            </div>
          </section>
        )}

        {/* ================= 3. LANGUAGE & BHARAT LOCALIZATION ================= */}
        {(activeTab === 'all' || activeTab === 'language') && (
          <section className="bg-white dark:bg-[#0B1422] border border-slate-200 dark:border-[#1E293B] rounded-3xl p-5 flex flex-col gap-4 shadow-sm">
            <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Globe2 size={16} className="text-[#38BDF8]" />
              Language & Bharat Localization
            </h2>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Preferred Interface & Conversation Language
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#101D2D] border border-slate-200 dark:border-[#1E293B] focus:border-[#FF9933] rounded-2xl p-3 text-sm text-slate-900 dark:text-white outline-none cursor-pointer"
              >
                {Object.keys(languageGreetings).map((lang) => (
                  <option key={lang} value={lang} className="bg-white dark:bg-[#0B1422] text-slate-900 dark:text-white">
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {/* Live Cultural Greeting Banner */}
            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-[#101D2D] dark:to-[#0B1422] rounded-2xl border border-amber-200 dark:border-[#1E293B] flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FF9933]/15 border border-[#FF9933]/30 flex items-center justify-center shrink-0">
                <Globe2 size={20} className="text-[#FF9933]" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {languageGreetings[selectedLanguage]?.greeting || 'Welcome to VARTA'}
                </span>
                <span className="text-xs text-[#FF9933] font-medium">
                  {languageGreetings[selectedLanguage]?.slogan || 'Baat Sabki'}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* ================= 4. AUDIENCE & PRIVACY ================= */}
        {(activeTab === 'all' || activeTab === 'privacy') && (
          <section className="bg-white dark:bg-[#0B1422] border border-slate-200 dark:border-[#1E293B] rounded-3xl p-5 flex flex-col gap-4 shadow-sm">
            <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Lock size={16} className="text-[#FF9933]" />
              Audience & Privacy
            </h2>

            <div className="flex flex-col divide-y divide-slate-200 dark:divide-[#1E293B]/60">
              {/* Private Account */}
              <div className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5 max-w-md">
                  <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    Private Account
                    {isPrivate && (
                      <span className="text-[10px] px-2 py-0.5 bg-[#FF9933]/15 text-[#FF9933] rounded-full border border-[#FF9933]/30 font-bold">
                        Protected
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    When enabled, only approved followers can view your posts and media. Existing followers are not affected.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => privacyMutation.mutate(!isPrivate)}
                  disabled={privacyMutation.isPending}
                  className={`w-12 h-6 rounded-full transition-colors p-0.5 flex items-center shrink-0 ${
                    isPrivate ? 'bg-[#FF9933] justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-md" />
                </button>
              </div>

              {/* Direct Messages */}
              <div className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5 max-w-md">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">Allow Direct Message Requests</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Receive message requests from people you do not follow back.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const next = !allowDMsFromEveryone;
                    setAllowDMsFromEveryone(next);
                    showToast(next ? 'Message requests open to everyone' : 'Messages restricted to followers');
                  }}
                  className={`w-12 h-6 rounded-full transition-colors p-0.5 flex items-center shrink-0 ${
                    allowDMsFromEveryone ? 'bg-[#FF9933] justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-md" />
                </button>
              </div>

              {/* Read Receipts */}
              <div className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5 max-w-md">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">Send Read Receipts</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Let conversation participants know when you have read their direct messages.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const next = !readReceipts;
                    setReadReceipts(next);
                    showToast(next ? 'Read receipts enabled' : 'Read receipts disabled');
                  }}
                  className={`w-12 h-6 rounded-full transition-colors p-0.5 flex items-center shrink-0 ${
                    readReceipts ? 'bg-[#FF9933] justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-md" />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ================= 5. NOTIFICATION ALERTS ================= */}
        {(activeTab === 'all' || activeTab === 'notifications') && (
          <section className="bg-white dark:bg-[#0B1422] border border-slate-200 dark:border-[#1E293B] rounded-3xl p-5 flex flex-col gap-4 shadow-sm">
            <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Bell size={16} className="text-[#FF9933]" />
              Notification Alerts & Delivery
            </h2>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Choose which in-app and push events alert you instantly on VARTA.
            </p>

            <div className="flex flex-col divide-y divide-slate-200 dark:divide-[#1E293B]/60">
              {[
                { key: 'pushOnLike', label: 'Push alert on likes and reactions' },
                { key: 'pushOnReply', label: 'Push alert on replies to your posts' },
                { key: 'pushOnMention', label: 'Push alert when you are mentioned (@)' },
                { key: 'pushOnFollow', label: 'Push alert on new followers' },
                { key: 'pushOnDM', label: 'Push alert on direct messages' },
                { key: 'emailOnDM', label: 'Email notifications for important direct messages' },
              ].map((pref) => {
                const isChecked = preferences ? preferences[pref.key] !== false : true;
                return (
                  <label
                    key={pref.key}
                    className="py-3 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 dark:hover:bg-[#101D2D]/40 px-2 rounded-xl transition"
                  >
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200">{pref.label}</span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => updatePrefMutation.mutate({ [pref.key]: e.target.checked })}
                      className="w-4 h-4 rounded bg-white dark:bg-[#101D2D] border-slate-300 dark:border-[#1E293B] text-[#FF9933] focus:ring-[#FF9933] cursor-pointer"
                    />
                  </label>
                );
              })}
            </div>
          </section>
        )}

        {/* ================= 6. VARTA+ PREMIUM (CREATOR TIER) ================= */}
        {(activeTab === 'all' || activeTab === 'premium') && (
          <section className="bg-gradient-to-br from-amber-50 via-orange-50/50 to-white dark:from-[#101D2D] dark:to-[#0B1422] border border-amber-200 dark:border-[#FF9933]/30 rounded-3xl p-5 sm:p-6 flex flex-col gap-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF9933]/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-[#FF9933] text-white font-black text-xs tracking-wider">
                    VARTA+
                  </span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white">Bharat Creator Tier</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Elevate your voice with official verification, extended post edits, and prioritized ranking.
                </p>
              </div>

              {user?.isVerified ? (
                <span className="px-3 py-1 bg-[#00C853]/15 border border-[#00C853]/40 rounded-full text-xs font-bold text-[#00C853] flex items-center gap-1.5 shrink-0">
                  <CheckCircle2 size={14} />
                  Active Member
                </span>
              ) : (
                <span className="px-3 py-1 bg-slate-200 dark:bg-slate-800 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-400 shrink-0">
                  Standard Tier
                </span>
              )}
            </div>

            {/* Feature List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white/90 dark:bg-[#050B14]/80 rounded-2xl border border-slate-200 dark:border-[#1E293B] flex items-center gap-2.5 shadow-sm">
                <CheckCircle2 size={16} className="text-[#FF9933] shrink-0" />
                <span className="text-slate-800 dark:text-slate-200 font-medium">Official Saffron Verified Checkmark</span>
              </div>
              <div className="p-3 bg-white/90 dark:bg-[#050B14]/80 rounded-2xl border border-slate-200 dark:border-[#1E293B] flex items-center gap-2.5 shadow-sm">
                <CheckCircle2 size={16} className="text-[#FF9933] shrink-0" />
                <span className="text-slate-800 dark:text-slate-200 font-medium">Edit posts up to 1 hour after publishing</span>
              </div>
              <div className="p-3 bg-white/90 dark:bg-[#050B14]/80 rounded-2xl border border-slate-200 dark:border-[#1E293B] flex items-center gap-2.5 shadow-sm">
                <CheckCircle2 size={16} className="text-[#FF9933] shrink-0" />
                <span className="text-slate-800 dark:text-slate-200 font-medium">Prioritized ranking in trending & discovery</span>
              </div>
              <div className="p-3 bg-white/90 dark:bg-[#050B14]/80 rounded-2xl border border-slate-200 dark:border-[#1E293B] flex items-center gap-2.5 shadow-sm">
                <CheckCircle2 size={16} className="text-[#FF9933] shrink-0" />
                <span className="text-slate-800 dark:text-slate-200 font-medium">Full 1080p HD media uploads</span>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 dark:border-[#1E293B]">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {user?.isVerified
                  ? 'Your subscription is active and verified.'
                  : 'Start your free 30-day creator trial. Cancel anytime.'}
              </div>

              <button
                type="button"
                onClick={handleTogglePremium}
                disabled={isActivatingPremium}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-full text-xs font-bold transition flex items-center justify-center gap-2 ${
                  user?.isVerified
                    ? 'bg-slate-100 hover:bg-red-500/15 hover:text-red-500 border border-slate-200 dark:bg-[#101D2D] dark:hover:bg-red-500/15 dark:hover:text-red-400 dark:border-[#1E293B] text-slate-700 dark:text-slate-300'
                    : 'bg-[#FF9933] hover:bg-[#E68525] text-white shadow-lg shadow-[#FF9933]/25'
                }`}
              >
                <Sparkles size={14} />
                <span>
                  {isActivatingPremium
                    ? 'Updating...'
                    : user?.isVerified
                    ? 'Cancel VARTA+ Subscription'
                    : 'Activate VARTA+ 30-Day Free Trial'}
                </span>
              </button>
            </div>
          </section>
        )}

        {/* ================= 7. IT RULES GRIEVANCE REDRESSAL ================= */}
        {(activeTab === 'all' || activeTab === 'grievance') && (
          <section className="bg-white dark:bg-[#0B1422] border border-slate-200 dark:border-[#1E293B] rounded-3xl p-5 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Shield size={16} className="text-[#00C853]" />
                Indian Grievance Redressal (IT Rules 2021/2023)
              </h2>
              <button
                onClick={() => {
                  setFiledTicketId(null);
                  setIsGrievanceModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-[#00C853] hover:bg-[#00A844] text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              >
                <Send size={13} />
                <span>File Grievance</span>
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              In full compliance with Rule 3(2) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules 2021 &amp; Amendments 2023, VARTA has instituted a dedicated Grievance Redressal Mechanism for Indian citizens.
            </p>

            <div className="p-4 bg-slate-50 dark:bg-[#101D2D] rounded-2xl border border-slate-200 dark:border-[#1E293B] text-xs flex flex-col gap-2 text-slate-700 dark:text-slate-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <span>
                  <strong className="text-slate-900 dark:text-white">Designation:</strong> Chief Grievance Officer, VARTA Platforms
                </span>
                <span>
                  <strong className="text-slate-900 dark:text-white">Official Email:</strong>{' '}
                  <a href="mailto:grievance@varta.local" className="text-[#38BDF8] hover:underline">
                    grievance@varta.local
                  </a>
                </span>
              </div>
              <div>
                <strong className="text-slate-900 dark:text-white">Address:</strong> VARTA Platforms India Pvt Ltd, Barakhamba Road, Connaught Place, New Delhi - 110001
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-[#1E293B] flex items-center gap-2 text-[#00C853] font-medium">
                <FileCheck2 size={15} />
                <span>Statutory SLA: Acknowledgement within 24 hours, resolution within 15 days.</span>
              </div>
            </div>
          </section>
        )}

        {/* ================= 8. LOGOUT & DANGER ZONE ================= */}
        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={() => logout()}
            className="w-full py-3.5 bg-slate-100 hover:bg-red-500/10 text-slate-700 hover:text-red-500 dark:bg-[#101D2D] dark:hover:bg-red-500/10 dark:hover:text-red-400 border border-slate-200 dark:border-[#1E293B] dark:text-slate-200 rounded-2xl font-bold text-xs transition flex items-center justify-center gap-2"
          >
            Log Out of @{user?.username || 'VARTA'}
          </button>
        </div>
      </div>

      {/* ================= MODAL: EDIT ACCOUNT INFO ================= */}
      {isEditAccountOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0B1422] border border-slate-200 dark:border-[#1E293B] rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1E293B] pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Edit3 size={18} className="text-[#FF9933]" />
                Edit Account Details
              </h3>
              <button
                onClick={() => setIsEditAccountOpen(false)}
                className="p-1 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-[#101D2D]"
              >
                <X size={18} />
              </button>
            </div>

            {accountError && (
              <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-500 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{accountError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAccount} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-400 text-sm">@</span>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    className="w-full bg-slate-50 dark:bg-[#101D2D] border border-slate-200 dark:border-[#1E293B] focus:border-[#FF9933] rounded-xl py-2.5 pl-8 pr-3 text-sm text-slate-900 dark:text-white outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#101D2D] border border-slate-200 dark:border-[#1E293B] focus:border-[#FF9933] rounded-xl p-2.5 text-sm text-slate-900 dark:text-white outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setIsEditAccountOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#101D2D]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={accountSaving}
                  className="px-5 py-2 bg-[#FF9933] hover:bg-[#E68525] text-white rounded-xl text-xs font-bold shadow-md shadow-[#FF9933]/25 disabled:opacity-50"
                >
                  {accountSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CHANGE PASSWORD ================= */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0B1422] border border-slate-200 dark:border-[#1E293B] rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1E293B] pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <KeyRound size={18} className="text-[#38BDF8]" />
                Change Password
              </h3>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-[#101D2D]"
              >
                <X size={18} />
              </button>
            </div>

            {passwordError && (
              <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-500 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleSavePassword} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full bg-slate-50 dark:bg-[#101D2D] border border-slate-200 dark:border-[#1E293B] focus:border-[#38BDF8] rounded-xl p-2.5 text-sm text-slate-900 dark:text-white outline-none"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-slate-50 dark:bg-[#101D2D] border border-slate-200 dark:border-[#1E293B] focus:border-[#38BDF8] rounded-xl p-2.5 text-sm text-slate-900 dark:text-white outline-none"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full bg-slate-50 dark:bg-[#101D2D] border border-slate-200 dark:border-[#1E293B] focus:border-[#38BDF8] rounded-xl p-2.5 text-sm text-slate-900 dark:text-white outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#101D2D]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="px-5 py-2 bg-[#38BDF8] hover:bg-[#0284C7] text-white rounded-xl text-xs font-bold shadow-md shadow-[#38BDF8]/25 disabled:opacity-50"
                >
                  {passwordSaving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: GRIEVANCE FILING ================= */}
      {isGrievanceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0B1422] border border-slate-200 dark:border-[#1E293B] rounded-3xl p-6 w-full max-w-lg shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1E293B] pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Shield size={18} className="text-[#00C853]" />
                File Statutory Grievance (IT Rules 2021)
              </h3>
              <button
                onClick={() => setIsGrievanceModalOpen(false)}
                className="p-1 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-[#101D2D]"
              >
                <X size={18} />
              </button>
            </div>

            {filedTicketId ? (
              <div className="flex flex-col gap-4 py-2">
                <div className="p-4 bg-[#00C853]/10 border border-[#00C853]/30 rounded-2xl flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-[#00C853] font-bold text-sm">
                    <CheckCircle2 size={18} />
                    <span>Grievance Report Formally Lodged</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    Your report has been assigned an official reference ID and forwarded to the Chief Grievance Officer.
                  </p>
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#101D2D] rounded-xl border border-slate-200 dark:border-[#1E293B] mt-1">
                    <span className="font-mono text-xs font-extrabold text-[#0284C7] dark:text-[#38BDF8]">{filedTicketId}</span>
                    <button
                      onClick={copyTicketId}
                      className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-[#1E293B] dark:hover:bg-[#2A3E59] text-xs font-bold text-slate-800 dark:text-white rounded-lg flex items-center gap-1 transition"
                    >
                      {copiedTicket ? <Check size={12} className="text-[#00C853]" /> : <Copy size={12} />}
                      <span>{copiedTicket ? 'Copied' : 'Copy ID'}</span>
                    </button>
                  </div>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed space-y-1">
                  <div>• Acknowledgement receipt will be dispatched within 24 hours.</div>
                  <div>• Statutory resolution SLA: 15 business days.</div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsGrievanceModalOpen(false)}
                  className="w-full py-2.5 bg-[#00C853] hover:bg-[#00A844] text-white font-bold rounded-xl text-xs transition"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitGrievance} className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Complaint Category</label>
                  <select
                    value={grievanceCategory}
                    onChange={(e) => setGrievanceCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#101D2D] border border-slate-200 dark:border-[#1E293B] focus:border-[#00C853] rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none"
                  >
                    <option value="Content Violation / Hate Speech">Content Violation / Hate Speech</option>
                    <option value="Copyright & Trademark Infringement">Copyright &amp; Trademark Infringement</option>
                    <option value="Impersonation / Fake Profile">Impersonation / Fake Profile</option>
                    <option value="Harassment & Online Bullying">Harassment &amp; Online Bullying</option>
                    <option value="Account Compromise / Unauthorized Access">Account Compromise / Unauthorized Access</option>
                    <option value="Other Statutory Issue">Other Statutory Issue</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Content / Post URL or Username</label>
                  <input
                    type="text"
                    value={grievanceUrl}
                    onChange={(e) => setGrievanceUrl(e.target.value)}
                    placeholder="https://varta.in/post/xxx or @username"
                    className="w-full bg-slate-50 dark:bg-[#101D2D] border border-slate-200 dark:border-[#1E293B] focus:border-[#00C853] rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Statement of Complaint</label>
                  <textarea
                    rows={3}
                    value={grievanceDetails}
                    onChange={(e) => setGrievanceDetails(e.target.value)}
                    placeholder="Describe the nature of violation with details..."
                    className="w-full bg-slate-50 dark:bg-[#101D2D] border border-slate-200 dark:border-[#1E293B] focus:border-[#00C853] rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none resize-none"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Official Contact Email</label>
                  <input
                    type="email"
                    value={grievanceEmail}
                    onChange={(e) => setGrievanceEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#101D2D] border border-slate-200 dark:border-[#1E293B] focus:border-[#00C853] rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-[#1E293B]">
                  <button
                    type="button"
                    onClick={() => setIsGrievanceModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#101D2D]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#00C853] hover:bg-[#00A844] text-white rounded-xl text-xs font-bold shadow-md shadow-[#00C853]/25"
                  >
                    Submit Grievance
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ================= FLOATING TOAST NOTIFICATION ================= */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="bg-slate-900 dark:bg-[#101D2D] border border-[#FF9933] text-white text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[#FF9933]" />
            <span className="font-medium">{toastMessage}</span>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white dark:bg-[#050B14] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#FF9933] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
