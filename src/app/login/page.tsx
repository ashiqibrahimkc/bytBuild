"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  HardHat,
  Building2,
  Truck,
  Users,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  Lock,
  Wallet,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ status?: number; message: string } | null>(null);

  async function completeLogin(
    username: string,
    fullName: string,
    email: string,
    role: string
  ) {
    const sessionData = {
      username,
      fullName,
      email,
      role,
    };

    // Set cookies for Next.js middleware authentication
    const encoded = encodeURIComponent(JSON.stringify(sessionData));
    document.cookie = `bytbuild_session=${encoded}; path=/; max-age=604800; SameSite=Lax`;
    document.cookie = `buildflow_session=${encoded}; path=/; max-age=604800; SameSite=Lax`;

    localStorage.setItem("bytbuild_user", JSON.stringify(sessionData));
    localStorage.setItem("buildflow_user", JSON.stringify(sessionData));
    router.push("/");
    router.refresh();
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    const cleanId = identifier.trim();
    if (!cleanId || !password) {
      setError({ message: "Please enter your username/email and password." });
      return;
    }

    setLoading(true);
    setError(null);

    // 1. Authenticate with server PostgreSQL database API (Prisma AppUser)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: cleanId, password }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success && data?.user) {
        await completeLogin(
          data.user.username,
          data.user.fullName,
          data.user.email,
          data.user.role
        );
        return;
      }

      // Check HTTP error status codes and provide precise human-readable messages
      const statusCode = res.status;
      let rawMessage = data?.message || "";

      // Sanitize any accidental technical/API key messages
      if (!rawMessage || /api\s*key/i.test(rawMessage)) {
        if (statusCode === 401) {
          rawMessage = "Invalid username or password. Please verify your credentials.";
        } else if (statusCode === 403) {
          rawMessage = "This account has been deactivated. Please contact your administrator.";
        } else if (statusCode === 503) {
          rawMessage = "Database server is currently unavailable. Please verify PostgreSQL connection.";
        } else {
          rawMessage = "Authentication failed. Please check your username and password.";
        }
      }

      setError({ status: statusCode, message: rawMessage });
      setLoading(false);
    } catch (err: unknown) {
      console.error("Login authentication network error:", err);
      setError({
        status: 0,
        message: "Unable to connect to authentication server. Please check your network connection.",
      });
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-900">
      {/* Left Brand Showcase Panel */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-r border-slate-800 text-white overflow-hidden">
        {/* Glow backdrop effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center overflow-hidden shadow-lg border border-slate-700/50">
            <Image
              src="/image/logo.png"
              alt="BytBuild Logo"
              width={40}
              height={40}
              className="w-full h-full object-contain p-1"
              priority
            />
          </div>
          <div>
            <span className="font-extrabold text-2xl tracking-tight text-white">
              bytBuild<span className="text-amber-500">.</span>
            </span>
            <span className="block text-[11px] font-mono uppercase tracking-widest text-slate-400">
              by byten • Construction ERP
            </span>
          </div>
        </div>

        <div className="relative z-10 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Role-Based Access Control Active</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-black tracking-tight leading-tight text-white">
            Multi-Site Construction Cash Flow &amp; Site ERP
          </h1>

          <p className="text-slate-400 text-sm leading-relaxed">
            Real-time tracking of company cash in hand, vendor credits, daily labor wages,
            overhead expenses, and certified client billing statements.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
              <div className="flex items-center gap-2 text-amber-400 mb-1">
                <Wallet className="h-4 w-4" />
                <span className="font-bold text-xs uppercase font-mono">Liquid Treasury</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Live net cash in hand ledger with bank vs physical cash box tracking.
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
              <div className="flex items-center gap-2 text-blue-400 mb-1">
                <Building2 className="h-4 w-4" />
                <span className="font-bold text-xs uppercase font-mono">Multi-Site Ledger</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Scalable architecture supporting 100+ active construction sites simultaneously.
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/80 pt-6">
          <span>&copy; 2026 byten. All rights reserved. • bytBuild ERP</span>
          <div className="flex items-center gap-3">
            <span>Audit Trail Enabled</span>
            <span>&bull;</span>
            <span>Enterprise Security</span>
          </div>
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12 sm:px-12">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile brand header */}
          <div className="flex lg:hidden items-center gap-3 justify-center mb-4">
            <div className="bg-white rounded-xl p-1 shadow-md border border-slate-200 h-9 w-9 overflow-hidden flex items-center justify-center">
              <Image
                src="/image/logo.png"
                alt="bytBuild Logo"
                width={36}
                height={36}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="text-slate-900 text-xl font-bold">bytBuild</span>
              <span className="text-[10px] block text-slate-400 uppercase tracking-wider font-mono">
                MK Builders Workspace
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-800 font-mono">
              <span>Customer: MK Builders</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Sign In to Your Workspace
            </h2>
            <p className="text-slate-500 text-sm">
              Enter your registered username or email to access the MK Builders workspace.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-xs flex items-start gap-2.5">
              <Lock className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                {error.status ? (
                  <span className="inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-red-100 text-red-800 mr-1.5">
                    HTTP {error.status}
                  </span>
                ) : null}
                <span className="font-medium leading-relaxed">{error.message}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="identifier"
                className="block text-xs font-semibold text-slate-700"
              >
                Username or Email Address
              </label>
              <Input
                id="identifier"
                type="text"
                autoComplete="username"
                required
                placeholder="Enter your username or email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={loading}
                className="h-10 text-sm border-slate-300 focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 h-10 text-sm border-slate-300 focus:border-amber-500"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 h-11 text-sm shadow-md shadow-amber-600/20 cursor-pointer transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying Credentials…
                </>
              ) : (
                "Sign In to Workspace"
              )}
            </Button>
          </form>

          {/* Seeded Workspace Credentials Card */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-700">MK Builders Workspace:</span>
                <div className="text-[11px] font-mono text-slate-500">
                  User: <span className="font-semibold text-amber-800">mkbuilders</span> • Pass: <span className="font-semibold text-amber-800">mkbuilders123</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIdentifier("mkbuilders");
                  setPassword("mkbuilders123");
                  setError(null);
                }}
                className="px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg border border-amber-300 transition-colors cursor-pointer"
              >
                Fill MK Builders
              </button>
            </div>

            <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60">
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-700">System Admin:</span>
                <div className="text-[11px] font-mono text-slate-500">
                  User: <span className="font-semibold text-amber-800">admin</span> • Pass: <span className="font-semibold text-amber-800">password123</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIdentifier("admin");
                  setPassword("password123");
                  setError(null);
                }}
                className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-200/80 hover:bg-slate-300 rounded-lg border border-slate-300 transition-colors cursor-pointer"
              >
                Fill Admin
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              256-bit Encrypted Session
            </span>
            <span className="font-mono">bytBuild by byten v2.4</span>
          </div>
        </div>
      </div>
    </div>
  );
}
