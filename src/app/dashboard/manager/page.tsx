// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { GaugeIcon, AlertTriangleIcon, CheckCircleIcon, ClockIcon } from "@/components/icons";

interface ManagerData {
  manager: {
    managerId: string;
    name: string;
    email: string;
    contactNumber: string;
    address: string;
    pumpId: string;
    pumpName: string;
  };
}

export default function ManagerDashboardPage() {
  const [data, setData] = useState<ManagerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadManagerData();
  }, []);

  async function loadManagerData() {
    try {
      // Get the current user's session info to identify which pump they manage
      const response = await fetch("/api/auth/me");
      if (!response.ok) {
        setError("Unable to load your profile");
        setLoading(false);
        return;
      }

      const userData = await response.json();

      if (!userData.pumpId) {
        setError("No pump assigned to your account");
        setLoading(false);
        return;
      }

      // For now, we'll display a basic view. In production, you would fetch
      // the manager's profile and pump details from the database
      setData({
        manager: {
          managerId: userData.managerId || "MGR-001",
          name: userData.name || "Manager",
          email: userData.email,
          contactNumber: userData.contactNumber || "N/A",
          address: userData.address || "N/A",
          pumpId: userData.pumpId,
          pumpName: userData.pumpName || "Assigned Pump",
        },
      });
    } catch (err) {
      console.error("Error loading manager data:", err);
      setError("Failed to load your dashboard");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Manager Dashboard" description="Loading your information..." />
        <div className="text-center text-slate-600 dark:text-slate-400">Loading...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Manager Dashboard" description="Your pump operations center" />
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950">
          <p className="text-sm text-red-800 dark:text-red-200">{error || "Unable to load your dashboard"}</p>
        </div>
      </div>
    );
  }

  const { manager } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={manager.pumpName}
        description={`${manager.address} — Daily operations for your assigned pump station`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Assigned Pump"
          value={manager.pumpName}
          icon={GaugeIcon}
        />
        <StatCard
          label="Your Role"
          value="Manager"
          icon={CheckCircleIcon}
        />
        <StatCard
          label="Contact"
          value={manager.contactNumber}
          icon={ClockIcon}
        />
        <StatCard
          label="Status"
          value="Active"
          icon={CheckCircleIcon}
          trend="up"
          delta="Online"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="Pump Information">
          <div className="space-y-4 p-5">
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Pump ID</label>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{manager.pumpId}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Pump Name</label>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{manager.pumpName}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Address</label>
              <p className="text-sm text-slate-700 dark:text-slate-300">{manager.address}</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Your Profile">
          <div className="space-y-4 p-5">
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Manager Name</label>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{manager.name}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Email</label>
              <p className="text-sm font-mono text-slate-700 dark:text-slate-300">{manager.email}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Contact</label>
              <p className="text-sm text-slate-700 dark:text-slate-300">{manager.contactNumber}</p>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Quick Links">
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-200 p-4 text-center hover:border-amber-500 hover:bg-amber-50 dark:border-slate-700 dark:hover:bg-slate-800">
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Pump Operations</div>
            <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">View Details</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-4 text-center hover:border-amber-500 hover:bg-amber-50 dark:border-slate-700 dark:hover:bg-slate-800">
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Staff Management</div>
            <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">Manage Staff</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-4 text-center hover:border-amber-500 hover:bg-amber-50 dark:border-slate-700 dark:hover:bg-slate-800">
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Reports</div>
            <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">View Reports</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-4 text-center hover:border-amber-500 hover:bg-amber-50 dark:border-slate-700 dark:hover:bg-slate-800">
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Settings</div>
            <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">Account Settings</p>
          </div>
        </div>
      </SectionCard>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-950">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          As a Pump Owner Manager, you have access to <strong>only your assigned pump's data and operations</strong>.
          You cannot view other pumps or company-wide information. All your actions are logged and monitored by your
          pump owner.
        </p>
      </div>
    </div>
  );
}
