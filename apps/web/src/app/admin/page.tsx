'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  Users,
  MessageSquare,
  AlertTriangle,
  Lock,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { VartaLogo } from '../../components/common/VartaLogo';
import { apiRequest } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { ReportStatus, ModerationActionType } from '@varta/shared';

export default function AdminDashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'reports' | 'audit'>('reports');
  const [selectedReportStatus, setSelectedReportStatus] = useState<ReportStatus>(ReportStatus.PENDING);

  // 1. Fetch Metrics
  const { data: metrics, isLoading: isMetricsLoading } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: () => apiRequest('/admin/metrics'),
    enabled: user?.role === 'ADMIN' || user?.role === 'MODERATOR',
  });

  // 2. Fetch Reports Queue
  const { data: reports, isLoading: isReportsLoading, refetch: refetchReports } = useQuery({
    queryKey: ['admin-reports', selectedReportStatus],
    queryFn: () => apiRequest(`/admin/reports?status=${selectedReportStatus}&limit=30`),
    enabled: user?.role === 'ADMIN' || user?.role === 'MODERATOR',
  });

  // 3. Fetch Audit Logs
  const { data: auditLogs, isLoading: isAuditLoading } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => apiRequest('/admin/audit-logs?limit=40'),
    enabled: (user?.role === 'ADMIN' || user?.role === 'MODERATOR') && activeTab === 'audit',
  });

  // Update Report Status Mutation
  const updateReportMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReportStatus }) =>
      apiRequest(`/admin/reports/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      refetchReports();
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
    },
  });

  // Sanction Action Mutation
  const applyActionMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest('/admin/actions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      refetchReports();
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
      alert('Moderation action applied and audit logged.');
    },
  });

  if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
    return (
      <div className="min-h-screen bg-[#090B10] flex flex-col items-center justify-center p-4 text-center">
        <Lock size={48} className="text-red-400 mb-2" />
        <h2 className="text-xl font-bold text-slate-100">Access Restricted</h2>
        <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">
          This administration and grievance console requires active administrator or moderator credentials.
        </p>
        <Link
          href="/login"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition"
        >
          Sign In as Admin
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090B10] text-slate-100 flex flex-col">
      {/* Admin Top Header */}
      <header className="sticky top-0 z-40 bg-[#11151D] border-b border-[#252D3A] px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/home" className="p-2 rounded-full hover:bg-[#191F2B] text-slate-300 transition">
            <ArrowLeft size={18} />
          </Link>
          <VartaLogo size={34} showText={true} showTagline={false} />
          <span className="hidden sm:inline px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
            Admin Console
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">
            Logged in as <strong className="text-slate-200">@{user.username}</strong> ({user.role})
          </span>
          <Link
            href="/home"
            className="px-3.5 py-1.5 rounded-xl border border-[#252D3A] text-xs font-semibold hover:bg-[#191F2B] transition"
          >
            Back to App
          </Link>
        </div>
      </header>

      {/* Main Admin Body */}
      <main className="w-full max-w-7xl mx-auto p-6 flex flex-col gap-6">
        {/* Aggregate Platform Metrics Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 bg-[#11151D] border border-[#252D3A] rounded-2xl flex flex-col gap-1 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Users size={14} className="text-blue-400" /> Total Users
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-100">
              {metrics?.totalUsers?.toLocaleString('en-IN') || 0}
            </span>
          </div>

          <div className="p-5 bg-[#11151D] border border-[#252D3A] rounded-2xl flex flex-col gap-1 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <MessageSquare size={14} className="text-purple-400" /> Active Baatein
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-100">
              {metrics?.totalPosts?.toLocaleString('en-IN') || 0}
            </span>
          </div>

          <div className="p-5 bg-[#11151D] border border-[#252D3A] rounded-2xl flex flex-col gap-1 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-yellow-400" /> Pending Grievances
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-yellow-400">
              {metrics?.pendingReports || 0}
            </span>
          </div>

          <div className="p-5 bg-[#11151D] border border-[#252D3A] rounded-2xl flex flex-col gap-1 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Lock size={14} className="text-red-400" /> Active Sanctions
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-red-400">
              {metrics?.activeSuspensions || 0}
            </span>
          </div>
        </section>

        {/* Section Tabs: Moderation Queue vs Audit Log */}
        <div className="flex border-b border-[#252D3A] gap-4">
          <button
            onClick={() => setActiveTab('reports')}
            className={`pb-3 text-sm font-bold transition flex items-center gap-2 border-b-2 ${
              activeTab === 'reports'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle size={16} />
            Grievance Moderation Queue
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-3 text-sm font-bold transition flex items-center gap-2 border-b-2 ${
              activeTab === 'audit'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText size={16} />
            Compliance Audit Log Trail
          </button>
        </div>

        {/* Moderation Queue Tab */}
        {activeTab === 'reports' && (
          <section className="bg-[#11151D] border border-[#252D3A] rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <ShieldCheck size={18} className="text-blue-400" />
                Intermediary Grievance Redressal Queue
              </h3>

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-[#191F2B] p-1 rounded-xl text-xs">
                {Object.values(ReportStatus).map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedReportStatus(status)}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                      selectedReportStatus === status
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Reports List */}
            <div className="flex flex-col divide-y divide-[#252D3A]">
              {isReportsLoading ? (
                <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin text-blue-500" />
                  <span>Loading review queue...</span>
                </div>
              ) : reports && reports.length > 0 ? (
                reports.map((r: any) => (
                  <div key={r.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[11px] font-bold uppercase">
                          {r.category}
                        </span>
                        <span className="text-xs text-slate-400">
                          Filed by <strong>@{r.reporter?.username}</strong>
                        </span>
                        {r.reportedUser && (
                          <span className="text-xs text-slate-400">
                            against <strong>@{r.reportedUser.username}</strong>
                          </span>
                        )}
                        <span className="text-xs text-slate-500">
                          {new Date(r.createdAt).toLocaleString('en-IN')}
                        </span>
                      </div>

                      <p className="text-sm text-slate-200 mt-1 font-medium bg-[#191F2B] p-2.5 rounded-xl border border-[#252D3A]">
                        &ldquo;{r.reason}&rdquo;
                      </p>

                      {r.post && (
                        <div className="text-xs text-slate-400 pl-2 border-l-2 border-blue-500/50 mt-1">
                          Reported Baat Content: {r.post.content}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {selectedReportStatus === ReportStatus.PENDING && (
                        <>
                          <button
                            onClick={() =>
                              updateReportMutation.mutate({
                                id: r.id,
                                status: ReportStatus.RESOLVED,
                              })
                            }
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                          >
                            <CheckCircle size={14} /> Resolve
                          </button>

                          <button
                            onClick={() =>
                              updateReportMutation.mutate({
                                id: r.id,
                                status: ReportStatus.DISMISSED,
                              })
                            }
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1"
                          >
                            <XCircle size={14} /> Dismiss
                          </button>

                          {r.reportedUser && (
                            <button
                              onClick={() => {
                                const reason = prompt('Specify suspension reason:') || 'Violation of Community Guidelines';
                                applyActionMutation.mutate({
                                  targetUserId: r.reportedUser.id,
                                  actionType: ModerationActionType.TEMPORARY_SUSPENSION,
                                  reason,
                                  postId: r.postId,
                                });
                              }}
                              className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 rounded-xl text-xs font-bold transition"
                            >
                              Sanction User
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  No {selectedReportStatus.toLowerCase()} grievance reports in queue.
                </div>
              )}
            </div>
          </section>
        )}

        {/* Audit Log Tab */}
        {activeTab === 'audit' && (
          <section className="bg-[#11151D] border border-[#252D3A] rounded-2xl p-5 flex flex-col gap-4">
            <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
              <FileText size={18} className="text-blue-400" />
              Administrative Audit Log History
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#252D3A] text-slate-400">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Actor</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Entity</th>
                    <th className="py-2.5 px-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#252D3A]/60">
                  {isAuditLoading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Loading audit trail...
                      </td>
                    </tr>
                  ) : auditLogs && auditLogs.length > 0 ? (
                    auditLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-[#191F2B]/40">
                        <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-200">
                          @{log.actor?.username}
                        </td>
                        <td className="py-2.5 px-3 text-blue-400 font-mono">
                          {log.action}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">
                          {log.entity} #{log.entityId?.slice(0, 8)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 truncate max-w-xs">
                          {log.details || '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No audit events recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
