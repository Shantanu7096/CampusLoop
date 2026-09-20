'use client';

import React from 'react';
import { Shield, UserCheck, Wrench, AlertTriangle, RefreshCw, Sparkles } from 'lucide-react';
import { Role } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
  slaBreachCount: number;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export function Navbar({
  currentRole,
  onRoleChange,
  slaBreachCount,
  onRefresh,
  isRefreshing,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 shadow-sm">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/20 ring-2 ring-indigo-400/30">
            <Wrench className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                FixFlow
              </span>
              <span className="hidden sm:inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                Enterprise v1.0
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Real-Time Campus & Facility Issue Resolution
            </p>
          </div>
        </div>

        {/* Global SLA Alert Badge */}
        {slaBreachCount > 0 && (
          <div className="hidden md:flex items-center space-x-2 rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs text-red-700 dark:bg-red-950/50 dark:border-red-900 dark:text-red-300 animate-pulse">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="font-medium">{slaBreachCount} SLA Breach{slaBreachCount > 1 ? 'es' : ''} Active</span>
          </div>
        )}

        {/* Multi-Role Switcher Bar */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => onRoleChange('CITIZEN')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                currentRole === 'CITIZEN'
                  ? 'bg-white dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Citizen Portal</span>
            </button>

            <button
              onClick={() => onRoleChange('STAFF')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                currentRole === 'STAFF'
                  ? 'bg-white dark:bg-slate-950 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Wrench className="h-3.5 w-3.5" />
              <span>Staff Mobile</span>
            </button>

            <button
              onClick={() => onRoleChange('ADMIN')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                currentRole === 'ADMIN'
                  ? 'bg-white dark:bg-slate-950 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Admin Center</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-9 w-9 p-0 rounded-xl"
            title="Refresh Data"
          >
            <RefreshCw className={`h-4 w-4 text-slate-600 dark:text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
    </header>
  );
}
