"use client";

import React, { useState } from "react";
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  Plus,
  Key,
  Check,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  Trash2,
  CheckCircle2,
  SlidersHorizontal,
  Building2,
  Truck,
  IndianRupee,
  LayoutDashboard,
  History,
  UserCheck,
  FileBarChart,
  Receipt,
  FileCheck,
  CloudDownload,
} from "lucide-react";
import { useConstruction } from "@/lib/store";
import { PagePermission, CustomRole, AppUser } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/dialog";
import { TeamRolesSkeleton } from "@/components/ui/page-skeletons";

const ALL_PAGES: { id: PagePermission; label: string; desc: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", desc: "Overview cards & activity", icon: LayoutDashboard },
  { id: "sites", label: "Sites & Clients", desc: "Site costs & client statements", icon: Building2 },
  { id: "vendors", label: "Vendors & Credit", desc: "Material bills & voucher entry", icon: Truck },
  { id: "workers", label: "Workers & Wages", desc: "Daily attendance & labor muster roll", icon: Users },
  { id: "salary-slips", label: "Salary Slips", desc: "Monthly salary calculation & printable pay slips", icon: FileCheck },
  { id: "cashflow", label: "Cash Flow & Treasury", desc: "Actual cash in hand & movements", icon: IndianRupee },
  { id: "company-expenses", label: "Company Expenses", desc: "Room rent, company petrol & mess", icon: Receipt },
  { id: "reports", label: "Financial Reports", desc: "Audited accountant model reports", icon: FileBarChart },
  { id: "audit-logs", label: "Audit Logs", desc: "Security audit trail (Owner)", icon: History },
  { id: "team-roles", label: "Team & Permissions", desc: "User creation & page RBAC", icon: Key },
  { id: "backup", label: "Backup & CSV Export", desc: "CSV export, offline backups & recovery", icon: CloudDownload },
];

export default function TeamRolesPage() {
  const {
    role,
    isDbLoading,
    canAccessPage,
    roles,
    users,
    createCustomRole,
    deleteCustomRole,
    updateRolePermissions,
    createAppUser,
    deleteAppUser,
  } = useConstruction();

  const [activeTab, setActiveTab] = useState<"roles" | "users">("roles");

  // Role Permissions edit state
  const [selectedRoleId, setSelectedRoleId] = useState<string>(roles[0]?.id || "");
  const [editPermissions, setEditPermissions] = useState<Record<string, PagePermission[]>>(() => {
    const map: Record<string, PagePermission[]> = {};
    roles.forEach((r) => {
      map[r.id] = [...r.permissions];
    });
    return map;
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New Role Modal
  const [isNewRoleOpen, setIsNewRoleOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDisplay, setNewRoleDisplay] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [newRolePermissions, setNewRolePermissions] = useState<PagePermission[]>([
    "dashboard",
    "sites",
    "vendors",
  ]);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);

  // New User Modal
  const [isNewUserOpen, setIsNewUserOpen] = useState(false);
  const [newFullName, setNewFullName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRoleId, setNewRoleId] = useState(roles[1]?.id || roles[0]?.id || "");
  const [showPassword, setShowPassword] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);

  // Keep selectedRoleId, newRoleId, and editPermissions synced with live database roles
  React.useEffect(() => {
    if (roles.length > 0) {
      if (!selectedRoleId || !roles.some((r) => r.id === selectedRoleId)) {
        setSelectedRoleId(roles[0].id);
      }
      if (!newRoleId || !roles.some((r) => r.id === newRoleId)) {
        setNewRoleId(roles[1]?.id || roles[0]?.id || "");
      }
      setEditPermissions((prev) => {
        const map = { ...prev };
        roles.forEach((r) => {
          if (!map[r.id]) {
            map[r.id] = [...r.permissions];
          }
        });
        return map;
      });
    }
  }, [roles, selectedRoleId, newRoleId]);

  if (isDbLoading) {
    return <TeamRolesSkeleton />;
  }

  const hasAccess = canAccessPage("team-roles");

  if (!hasAccess) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-6">
        <div className="rounded-2xl bg-rose-50 p-4 text-rose-600 border border-rose-200 mb-4 shadow-sm">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Access Restricted by RBAC</h2>
        <p className="mt-2 text-sm text-slate-500 max-w-md">
          Only the <strong>Owner</strong> has administrative privileges to configure page visibility, create custom roles, and generate user accounts.
        </p>
      </div>
    );
  }

  const selectedRole = roles.find((r) => r.id === selectedRoleId) || roles[0];
  const currentPermissions = editPermissions[selectedRole.id] || selectedRole.permissions;

  // Toggle page permission for selected role
  const handleTogglePermission = (permId: PagePermission) => {
    const current = editPermissions[selectedRole.id] || [...selectedRole.permissions];
    let updated: PagePermission[];
    if (current.includes(permId)) {
      // Do not allow removing dashboard or core from owner
      if (selectedRole.name === "OWNER" && permId === "team-roles") return;
      updated = current.filter((p) => p !== permId);
    } else {
      updated = [...current, permId];
    }
    setEditPermissions((prev) => ({
      ...prev,
      [selectedRole.id]: updated,
    }));
    setSaveSuccess(false);
  };

  const handleSavePermissions = () => {
    updateRolePermissions(selectedRole.id, currentPermissions);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleCreateRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoleError(null);
    if (!newRoleName || !newRoleDisplay) return;

    setIsSubmittingRole(true);
    try {
      const ok = await createCustomRole({
        name: newRoleName.toUpperCase().replace(/\s+/g, "_"),
        displayName: newRoleDisplay,
        description: newRoleDesc || `Custom role with ${newRolePermissions.length} accessible pages`,
        permissions: newRolePermissions,
        isSystem: false,
      });

      if (ok === false) {
        setRoleError(`Failed to create role. The code "${newRoleName.toUpperCase().replace(/\s+/g, "_")}" may already exist.`);
        return;
      }

      setNewRoleName("");
      setNewRoleDisplay("");
      setNewRoleDesc("");
      setNewRolePermissions(["dashboard", "sites"]);
      setIsNewRoleOpen(false);
    } finally {
      setIsSubmittingRole(false);
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (confirm(`Are you sure you want to delete the custom role "${roleName}"?`)) {
      const ok = await deleteCustomRole?.(roleId);
      if (ok === false) {
        alert("Cannot delete role. There may be users assigned to this role.");
      } else {
        if (selectedRoleId === roleId) {
          setSelectedRoleId(roles[0]?.id || "");
        }
      }
    }
  };

  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUserError(null);
    if (!newUsername || !newPassword || !newFullName || !newRoleId) return;

    const ok = createAppUser({
      username: newUsername.trim(),
      password: newPassword,
      fullName: newFullName.trim(),
      roleId: newRoleId,
      isActive: true,
    });

    if (!ok) {
      setUserError(`Username "@${newUsername}" is already taken. Please choose another.`);
      return;
    }

    setNewFullName("");
    setNewUsername("");
    setNewPassword("");
    setIsNewUserOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-amber-500 text-slate-950 p-2 shadow-sm">
              <Key className="h-5 w-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              RBAC Permissions &amp; User Accounts
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure which pages Accountant and Manager can view, create custom roles, and generate separate usernames/passwords.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200">
          <button
            onClick={() => setActiveTab("roles")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer ${activeTab === "roles"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
              }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Page Visibility Model
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer ${activeTab === "users"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
              }`}
          >
            <Users className="h-3.5 w-3.5" />
            User Accounts ({users.length})
          </button>
        </div>
      </div>

      {/* ─── TAB 1: ROLE & PAGE PERMISSION MATRIX ─────────────────────────── */}
      {activeTab === "roles" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Configure Which Pages Each Role Can See
              </h2>
              <p className="text-xs text-slate-500">
                Select a role below to turn page access on or off in the sidebar and navigation.
              </p>
            </div>
            <Button
              onClick={() => setIsNewRoleOpen(true)}
              className="bg-amber-600 hover:bg-amber-700"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Create New Role
            </Button>
          </div>

          {/* Role selector tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {roles.map((r) => {
              const isSelected = r.id === selectedRole.id;
              const perms = editPermissions[r.id] || r.permissions;
              return (
                <div
                  key={r.id}
                  onClick={() => {
                    setSelectedRoleId(r.id);
                    setSaveSuccess(false);
                  }}
                  className={`rounded-xl border p-4 cursor-pointer transition-all ${isSelected
                      ? "border-amber-500 bg-amber-50/50 shadow-md ring-2 ring-amber-500/20"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs"
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{r.displayName}</h3>
                      <span className="font-mono text-[10px] text-slate-400 uppercase">
                        @{r.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={r.name === "OWNER" ? "warning" : "secondary"} className="text-[10px]">
                        {perms.length} Pages Visible
                      </Badge>
                      {!r.isSystem && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRole(r.id, r.displayName);
                          }}
                          className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete custom role"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                    {r.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Selected Role Permissions Card */}
          <Card className="border-slate-300 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-bold text-slate-900">
                      Page Access Permissions for: {selectedRole.displayName}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs bg-white">
                      Role Code: {selectedRole.name}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    Toggle which pages are visible in the sidebar and accessible to {selectedRole.displayName} users.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  {saveSuccess && (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in">
                      <CheckCircle2 className="h-4 w-4" />
                      Permissions Saved!
                    </span>
                  )}
                  <Button
                    onClick={handleSavePermissions}
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    Save Permissions
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {ALL_PAGES.map((page) => {
                  const Icon = page.icon;
                  const isChecked = currentPermissions.includes(page.id);
                  const isLocked = selectedRole.name === "OWNER" && page.id === "team-roles";

                  return (
                    <div
                      key={page.id}
                      onClick={() => !isLocked && handleTogglePermission(page.id)}
                      className={`flex items-start gap-3 rounded-xl border p-3.5 transition-all cursor-pointer ${isChecked
                          ? "border-emerald-300 bg-emerald-50/40 shadow-xs"
                          : "border-slate-200 bg-white opacity-75 hover:opacity-100 hover:border-slate-300"
                        } ${isLocked ? "cursor-not-allowed opacity-90" : ""}`}
                    >
                      <div
                        className={`rounded-lg p-2 shrink-0 ${isChecked ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
                          }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                            {page.label}
                          </p>
                          <div
                            className={`flex h-5 w-5 items-center justify-center rounded-md border text-xs transition-all ${isChecked
                                ? "border-emerald-500 bg-emerald-600 text-white"
                                : "border-slate-300 bg-white"
                              }`}
                          >
                            {isChecked && <Check className="h-3 w-3" />}
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          {page.desc}
                        </p>
                        <span
                          className={`mt-1.5 inline-block text-[10px] font-bold ${isChecked ? "text-emerald-700" : "text-slate-400"
                            }`}
                        >
                          {isChecked ? "✓ Visible in Sidebar" : "✕ Hidden"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── TAB 2: USER ACCOUNTS & PASSWORDS ─────────────────────────────── */}
      {activeTab === "users" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Company User Credentials Directory
              </h2>
              <p className="text-xs text-slate-500">
                Every team member has their own unique username and password. Their assigned role controls which pages they see.
              </p>
            </div>
            <Button
              onClick={() => setIsNewUserOpen(true)}
              className="bg-amber-600 hover:bg-amber-700"
              size="sm"
            >
              <UserPlus className="h-4 w-4 mr-1.5" />
              + Create New User
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-semibold">User / Full Name</th>
                      <th className="py-3 px-4 font-semibold">Username</th>
                      <th className="py-3 px-4 font-semibold">Assigned Role</th>
                      <th className="py-3 px-4 font-semibold">Allowed Pages</th>
                      <th className="py-3 px-4 font-semibold">Password</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u) => {
                      const userRole = roles.find((r) => r.id === u.roleId);
                      const isOwner = userRole?.name === "OWNER";
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-amber-400 font-bold text-xs shrink-0">
                                {u.fullName.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block">
                                  {u.fullName}
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  {u.email || "No email linked"}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-xs border border-amber-200">
                              @{u.username}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={isOwner ? "warning" : "secondary"}
                              className="text-xs"
                            >
                              {userRole?.displayName || "Role"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-600">
                            <span>{userRole?.permissions.length || 0} Pages</span>
                            <span className="text-[10px] text-slate-400 block truncate max-w-xs">
                              {userRole?.permissions.join(", ")}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-slate-500">
                            ••••••••
                          </td>
                          <td className="py-3 px-4 text-right">
                            {!isOwner && (
                              <button
                                onClick={() => deleteAppUser(u.id)}
                                className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Remove user account"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── MODAL: CREATE NEW ROLE ─────────────────────────────────────── */}
      <Modal
        isOpen={isNewRoleOpen}
        onClose={() => setIsNewRoleOpen(false)}
        title="Create New Custom Role"
        description="Define a new role and customize exactly which pages this role can access."
      >
        <form onSubmit={handleCreateRoleSubmit} className="space-y-4">
          {roleError && (
            <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              {roleError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Role Display Name *
            </label>
            <Input
              placeholder="e.g. Site Supervisor, Junior Accountant"
              value={newRoleDisplay}
              onChange={(e) => {
                setNewRoleDisplay(e.target.value);
                setNewRoleName(e.target.value.toUpperCase().replace(/\s+/g, "_"));
              }}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Role Code (Identifier)
            </label>
            <Input
              placeholder="e.g. SITE_SUPERVISOR"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value.toUpperCase())}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description
            </label>
            <Input
              placeholder="e.g. Field supervisor logging materials & labor"
              value={newRoleDesc}
              onChange={(e) => setNewRoleDesc(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Select Visible Pages for this Role:
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border rounded-lg border-slate-200">
              {ALL_PAGES.map((page) => {
                const checked = newRolePermissions.includes(page.id);
                return (
                  <label
                    key={page.id}
                    className={`flex items-center gap-2 p-2 rounded-md border text-xs cursor-pointer ${checked
                        ? "border-amber-400 bg-amber-50/60 font-semibold text-slate-900"
                        : "border-slate-200 text-slate-600"
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setNewRolePermissions((prev) =>
                          checked ? prev.filter((p) => p !== page.id) : [...prev, page.id]
                        );
                      }}
                      className="rounded text-amber-600"
                    />
                    <span>{page.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsNewRoleOpen(false)} disabled={isSubmittingRole}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmittingRole}>
              {isSubmittingRole ? "Creating..." : "Create Role"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL: CREATE NEW USER WITH PASSWORD ────────────────────────── */}
      <Modal
        isOpen={isNewUserOpen}
        onClose={() => setIsNewUserOpen(false)}
        title="Create New User Account"
        description="Assign a separate username and password for a manager, accountant, or team member."
      >
        <form onSubmit={handleCreateUserSubmit} className="space-y-4">
          {userError && (
            <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              {userError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name *
            </label>
            <Input
              placeholder="e.g. Priya Sharma"
              value={newFullName}
              onChange={(e) => setNewFullName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Username (for login) *
            </label>
            <Input
              placeholder="e.g. priya_accounts"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
              required
            />
            <span className="text-[10px] text-slate-400">
              User will sign in using this username.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password *
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter secure password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assign Role *
            </label>
            <select
              value={newRoleId}
              onChange={(e) => setNewRoleId(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.displayName} ({r.permissions.length} pages accessible)
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsNewUserOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create User Account</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

