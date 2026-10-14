'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  Lock,
  Bell,
  User,
  Shield,
  Trash2,
  Check,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { MainLayout } from '../../../components/layout/MainLayout';
import { apiRequest } from '../../../lib/api';
import { useAuthStore } from '../../../stores/authStore';

export default function SettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();

  const [isPrivate, setIsPrivate] = useState(user?.isPrivate || false);

  // 1. Fetch Notification Preferences
  const { data: preferences, refetch: refetchPrefs } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () => apiRequest('/notifications/preferences'),
    enabled: !!user,
  });

  // Toggle Privacy Mutation
  const privacyMutation = useMutation({
    mutationFn: (newPrivate: boolean) =>
      apiRequest('/users/settings/privacy', {
        method: 'PATCH',
        body: JSON.stringify({ isPrivate: newPrivate }),
      }),
    onSuccess: (data) => {
      setIsPrivate(data.isPrivate);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  // Update Preferences Mutation
  const updatePrefMutation = useMutation({
    mutationFn: (updated: any) =>
      apiRequest('/notifications/preferences', {
        method: 'PATCH',
        body: JSON.stringify(updated),
      }),
    onSuccess: () => {
      refetchPrefs();
    },
  });

  const handlePrivacyToggle = () => {
    const next = !isPrivate;
    setIsPrivate(next);
    privacyMutation.mutate(next);
  };

  const handlePrefChange = (key: string, val: boolean) => {
    updatePrefMutation.mutate({ [key]: val });
  };

  return (
    <MainLayout>
      <div className="sticky top-0 z-30 bg-[#090B10]/80 backdrop-blur-md border-b border-[#252D3A] px-4 py-3 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-[#191F2B] text-slate-300 hover:text-white transition"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Settings size={18} className="text-blue-400" />
          Settings & Privacy
        </h2>
      </div>

      <div className="p-4 flex flex-col gap-6">
        {/* Account Details Box */}
        <section className="bg-[#11151D] border border-[#252D3A] rounded-2xl p-5 flex flex-col gap-4">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <User size={16} className="text-blue-400" />
            Account Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="flex flex-col gap-1 p-3 bg-[#191F2B] rounded-xl">
              <span className="text-slate-400">Username</span>
              <span className="font-bold text-slate-100 text-sm">@{user?.username}</span>
            </div>
            <div className="flex flex-col gap-1 p-3 bg-[#191F2B] rounded-xl">
              <span className="text-slate-400">Email Address</span>
              <span className="font-bold text-slate-100 text-sm truncate">{user?.email}</span>
            </div>
            <div className="flex flex-col gap-1 p-3 bg-[#191F2B] rounded-xl">
              <span className="text-slate-400">Role</span>
              <span className="font-bold text-blue-400 text-sm">{user?.role}</span>
            </div>
            <div className="flex flex-col gap-1 p-3 bg-[#191F2B] rounded-xl">
              <span className="text-slate-400">Status</span>
              <span className="font-bold text-emerald-400 text-sm">{user?.status}</span>
            </div>
          </div>
        </section>

        {/* Privacy & Safety Controls */}
        <section className="bg-[#11151D] border border-[#252D3A] rounded-2xl p-5 flex flex-col gap-4">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <Lock size={16} className="text-purple-400" />
            Audience & Privacy
          </h3>

          <div className="flex items-center justify-between p-3.5 bg-[#191F2B] rounded-xl">
            <div className="flex flex-col gap-0.5 max-w-sm">
              <span className="font-bold text-sm text-slate-100">Private Account</span>
              <span className="text-xs text-slate-400">
                When your account is private, only people you approve can see your Baatein and replies.
              </span>
            </div>

            <button
              onClick={handlePrivacyToggle}
              disabled={privacyMutation.isPending}
              className={`w-12 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                isPrivate ? 'bg-blue-600 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-md" />
            </button>
          </div>
        </section>

        {/* Notification Preferences */}
        <section className="bg-[#11151D] border border-[#252D3A] rounded-2xl p-5 flex flex-col gap-4">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <Bell size={16} className="text-indigo-400" />
            Notification Alerts
          </h3>

          <div className="flex flex-col divide-y divide-[#252D3A]/60">
            {[
              { key: 'pushOnLike', label: 'Push alert on likes' },
              { key: 'pushOnReply', label: 'Push alert on replies' },
              { key: 'pushOnMention', label: 'Push alert on mentions' },
              { key: 'pushOnFollow', label: 'Push alert on new followers' },
              { key: 'pushOnDM', label: 'Push alert on direct messages' },
            ].map((pref) => {
              const isChecked = preferences ? preferences[pref.key] : true;
              return (
                <div key={pref.key} className="py-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-200">{pref.label}</span>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => handlePrefChange(pref.key, e.target.checked)}
                    className="rounded bg-[#191F2B] border-[#252D3A] text-blue-600 focus:ring-0"
                  />
                </div>
              );
            })}
          </div>
        </section>

        {/* IT Rules Grievance Officer Section */}
        <section className="bg-[#11151D] border border-[#252D3A] rounded-2xl p-5 flex flex-col gap-3">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <Shield size={16} className="text-emerald-400" />
            Indian Grievance Redressal (IT Rules 2021/2023)
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            In compliance with Rule 3(2) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, VARTA has appointed a dedicated Grievance Officer for users in India.
          </p>
          <div className="p-3 bg-[#191F2B] rounded-xl text-xs flex flex-col gap-1 text-slate-300">
            <span><strong>Designation:</strong> Grievance Officer, VARTA</span>
            <span><strong>Email:</strong> grievance@varta.local</span>
            <span><strong>Address:</strong> VARTA Platforms India, New Delhi - 110001</span>
            <span><strong>Turnaround SLA:</strong> Acknowledgement within 24 hours, resolution within 15 days.</span>
          </div>
        </section>

        {/* Logout & Deactivation */}
        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={() => logout()}
            className="w-full py-3 bg-[#191F2B] hover:bg-[#252D3A] border border-[#252D3A] text-slate-200 rounded-xl font-bold text-xs transition"
          >
            Log Out of VARTA
          </button>
        </div>
      </div>
    </MainLayout>
  );
}
