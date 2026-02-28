"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { useProgram } from "./hooks/useProgram";
import {
  findRootAuthority,
  findRole,
  findPermission,
  findRolePermission,
  findUserRole,
} from "./hooks/usePda";


const Icons = {
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  key: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  link: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  box: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
    </svg>
  ),
  copy: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  ),
};

// ── Types ──────────────────────────────────────────

type Tab = "roles" | "permissions" | "users" | "check";

interface RoleData {
  name: string;
  pda: PublicKey;
  permissions: string[];
}

interface PermData {
  name: string;
  pda: PublicKey;
}

interface UserRoleData {
  user: string;
  roleName: string;
  rolePda: PublicKey;
  userRolePda: PublicKey;
  expiresAt: number;
  grantedBy: string;
}

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

let toastId = 0;


const shorten = (addr: string, n = 4) => addr.slice(0, n) + "…" + addr.slice(-n);

// New account size: 8 (discriminator) + 32 (root) + 4 (string len) + 32 (max name) + 1 (bump)
const ROLE_PERM_ACCOUNT_SIZE = 77;

const tabMeta: Record<Tab, { label: string; icon: JSX.Element; desc: string }> = {
  roles: { label: "Roles", icon: Icons.shield, desc: "Create and manage access roles" },
  permissions: { label: "Permissions", icon: Icons.key, desc: "Define granular permission primitives" },
  users: { label: "Users", icon: Icons.users, desc: "Assign roles to wallet addresses" },
  check: { label: "Check Access", icon: Icons.check, desc: "Verify user permissions on-chain" },
};

// ── Component ──────────────────────────────────────

export default function Dashboard() {
  const { publicKey, connected } = useWallet();
  const { program } = useProgram();

  const [tab, setTab] = useState<Tab>("roles");
  const [rootPda, setRootPda] = useState<PublicKey | null>(null);
  const [rootExists, setRootExists] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roleCount, setRoleCount] = useState(0);
  const [permCount, setPermCount] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);

  // form state
  const [newRoleName, setNewRoleName] = useState("");
  const [newPermName, setNewPermName] = useState("");
  const [assignUserAddr, setAssignUserAddr] = useState("");
  const [assignRoleName, setAssignRoleName] = useState("");
  const [assignExpiry, setAssignExpiry] = useState("");
  const [assignNeverExpires, setAssignNeverExpires] = useState(true);
  const [checkUserAddr, setCheckUserAddr] = useState("");
  const [checkRoleName, setCheckRoleName] = useState("");
  const [checkPermName, setCheckPermName] = useState("");
  const [checkResult, setCheckResult] = useState<string | null>(null);
  const [bindRoleName, setBindRoleName] = useState("");
  const [bindPermName, setBindPermName] = useState("");

  // data
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [permissions, setPermissions] = useState<PermData[]>([]);
  const [userRoles, setUserRoles] = useState<UserRoleData[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: "success" | "error") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 1500);
  };

  // ── Load Root Authority ────────────────────────────

  const loadRoot = useCallback(async () => {
    if (!program || !publicKey) return;
    const [pda] = findRootAuthority(publicKey);
    setRootPda(pda);
    try {
      const root = await program.account.rootAuthority.fetch(pda);
      setRootExists(true);
      setRoleCount(root.roleCount.toNumber());
      setPermCount(root.permissionCount.toNumber());
    } catch {
      setRootExists(false);
    }
  }, [program, publicKey]);

  useEffect(() => { loadRoot(); }, [loadRoot]);

  // ── Load Roles ─────────────────────────────────────

  const loadRoles = useCallback(async () => {
    if (!program || !rootPda || !rootExists) return;
    try {
      const allRoles = await program.account.role.all([
        { memcmp: { offset: 8, bytes: rootPda.toBase58() } },
        { dataSize: ROLE_PERM_ACCOUNT_SIZE },
      ]);
      const allRolePerms = await program.account.rolePermission.all();
      const allPerms = await program.account.permission.all([
        { memcmp: { offset: 8, bytes: rootPda.toBase58() } },
        { dataSize: ROLE_PERM_ACCOUNT_SIZE },
      ]);
      const permMap = new Map(allPerms.map((p) => [p.publicKey.toBase58(), p]));

      const rolesData: RoleData[] = allRoles.map((r) => {
        const name = (r.account as any).name || shorten(r.publicKey.toBase58(), 6);
        const linkedPerms = allRolePerms
          .filter((rp) => rp.account.role.equals(r.publicKey))
          .map((rp) => {
            const pm = permMap.get(rp.account.permission.toBase58());
            if (!pm) return "?";
            return (pm.account as any).name || shorten(pm.publicKey.toBase58(), 6);
          });
        return { name, pda: r.publicKey, permissions: linkedPerms };
      });
      setRoles(rolesData);
    } catch (err) {
      console.error("loadRoles error:", err);
    }
  }, [program, rootPda, rootExists]);

  // ── Load Permissions ───────────────────────────────

  const loadPermissions = useCallback(async () => {
    if (!program || !rootPda || !rootExists) return;
    try {
      const allPerms = await program.account.permission.all([
        { memcmp: { offset: 8, bytes: rootPda.toBase58() } },
        { dataSize: ROLE_PERM_ACCOUNT_SIZE },
      ]);
      setPermissions(
        allPerms.map((p) => ({
          name: (p.account as any).name || shorten(p.publicKey.toBase58(), 6),
          pda: p.publicKey,
        }))
      );
    } catch (err) {
      console.error("loadPermissions error:", err);
    }
  }, [program, rootPda, rootExists]);

  // ── Load User Roles ────────────────────────────────

  const loadUserRoles = useCallback(async () => {
    if (!program || !rootPda || !rootExists) return;
    try {
      const allUr = await program.account.userRole.all([
        { memcmp: { offset: 8 + 32 + 32, bytes: rootPda.toBase58() } },
      ]);
      // fetch role names from on-chain role accounts
      const allRoles = await program.account.role.all([
        { memcmp: { offset: 8, bytes: rootPda.toBase58() } },
        { dataSize: ROLE_PERM_ACCOUNT_SIZE },
      ]);
      const roleNameMap = new Map(allRoles.map((r) => [r.publicKey.toBase58(), (r.account as any).name as string]));

      setUserRoles(
        allUr.map((ur) => {
          const roleKey = ur.account.role.toBase58();
          return {
            user: ur.account.user.toBase58(),
            roleName: roleNameMap.get(roleKey) || shorten(roleKey, 6),
            rolePda: ur.account.role,
            userRolePda: ur.publicKey,
            expiresAt: ur.account.expiresAt.toNumber(),
            grantedBy: ur.account.grantedBy.toBase58(),
          };
        })
      );
    } catch (err) {
      console.error("loadUserRoles error:", err);
    }
  }, [program, rootPda, rootExists]);

  useEffect(() => {
    if (rootExists) { loadRoles(); loadPermissions(); loadUserRoles(); }
  }, [rootExists, loadRoles, loadPermissions, loadUserRoles]);

  // ── Actions ────────────────────────────────────────

  const initRoot = async () => {
    if (!program || !publicKey || !rootPda) return;
    setLoading(true);
    try {
      await program.methods.initializeRoot()
        .accounts({ rootAuthority: rootPda, authority: publicKey, systemProgram: SystemProgram.programId })
        .rpc();
      addToast("Root authority initialized", "success");
      await loadRoot();
    } catch (err: any) {
      addToast(err.message?.slice(0, 80) || "Failed to initialize", "error");
    }
    setLoading(false);
  };

  const createRole = async () => {
    if (!program || !publicKey || !rootPda || !newRoleName.trim()) return;
    setLoading(true);
    try {
      const name = newRoleName.trim();
      const [rolePda] = findRole(rootPda, name);
      await program.methods.createRole(name)
        .accounts({ role: rolePda, rootAuthority: rootPda, authority: publicKey, systemProgram: SystemProgram.programId })
        .rpc();
      addToast(`Role "${name}" created`, "success");
      setNewRoleName("");
      await loadRoot(); await loadRoles();
    } catch (err: any) {
      addToast(err.message?.slice(0, 80) || "Failed to create role", "error");
    }
    setLoading(false);
  };

  const createPermission = async () => {
    if (!program || !publicKey || !rootPda || !newPermName.trim()) return;
    setLoading(true);
    try {
      const name = newPermName.trim();
      const [permPda] = findPermission(rootPda, name);
      await program.methods.createPermission(name)
        .accounts({ permission: permPda, rootAuthority: rootPda, authority: publicKey, systemProgram: SystemProgram.programId })
        .rpc();
      addToast(`Permission "${name}" created`, "success");
      setNewPermName("");
      await loadRoot(); await loadPermissions();
    } catch (err: any) {
      addToast(err.message?.slice(0, 80) || "Failed to create permission", "error");
    }
    setLoading(false);
  };

  const assignPermToRole = async () => {
    if (!program || !publicKey || !rootPda || !bindRoleName.trim() || !bindPermName.trim()) return;
    setLoading(true);
    try {
      const [rolePda] = findRole(rootPda, bindRoleName.trim());
      const [permPda] = findPermission(rootPda, bindPermName.trim());
      const [rpPda] = findRolePermission(rolePda, permPda);
      await program.methods.assignPermissionToRole()
        .accounts({ rolePermission: rpPda, role: rolePda, permission: permPda, rootAuthority: rootPda, authority: publicKey, systemProgram: SystemProgram.programId })
        .rpc();
      addToast(`"${bindPermName.trim()}" → "${bindRoleName.trim()}"`, "success");
      setBindRoleName(""); setBindPermName("");
      await loadRoles();
    } catch (err: any) {
      addToast(err.message?.slice(0, 80) || "Failed to bind permission", "error");
    }
    setLoading(false);
  };

  const assignRole = async () => {
    if (!program || !publicKey || !rootPda || !assignUserAddr.trim() || !assignRoleName.trim()) return;
    setLoading(true);
    try {
      const userPubkey = new PublicKey(assignUserAddr.trim());
      const [rolePda] = findRole(rootPda, assignRoleName.trim());
      const [urPda] = findUserRole(rootPda, userPubkey, rolePda);
      const expiry = assignNeverExpires ? -1 : Math.floor(new Date(assignExpiry).getTime() / 1000);
      await program.methods.assignRoleToUser(new BN(expiry))
        .accounts({ userRole: urPda, role: rolePda, user: userPubkey, rootAuthority: rootPda, authority: publicKey, systemProgram: SystemProgram.programId })
        .rpc();
      addToast(`"${assignRoleName.trim()}" assigned to ${shorten(assignUserAddr.trim())}`, "success");
      setAssignUserAddr(""); setAssignRoleName(""); setAssignExpiry(""); setAssignNeverExpires(true);
      await loadUserRoles();
    } catch (err: any) {
      addToast(err.message?.slice(0, 80) || "Failed to assign role", "error");
    }
    setLoading(false);
  };

  const revokeUserRole = async (ur: UserRoleData) => {
    if (!program || !publicKey || !rootPda) return;
    setLoading(true);
    try {
      await program.methods.revokeRoleFromUser()
        .accounts({ userRole: ur.userRolePda, role: ur.rolePda, user: new PublicKey(ur.user), rootAuthority: rootPda, authority: publicKey })
        .rpc();
      addToast(`Role revoked from ${shorten(ur.user)}`, "success");
      await loadUserRoles();
    } catch (err: any) {
      addToast(err.message?.slice(0, 80) || "Failed to revoke", "error");
    }
    setLoading(false);
  };

  const checkPermission = async () => {
    if (!program || !rootPda || !checkUserAddr.trim() || !checkRoleName.trim() || !checkPermName.trim()) return;
    setLoading(true);
    setCheckResult(null);
    try {
      const userPubkey = new PublicKey(checkUserAddr.trim());
      const [rolePda] = findRole(rootPda, checkRoleName.trim());
      const [permPda] = findPermission(rootPda, checkPermName.trim());
      const [urPda] = findUserRole(rootPda, userPubkey, rolePda);
      const [rpPda] = findRolePermission(rolePda, permPda);
      await program.methods.checkPermission()
        .accounts({ userRole: urPda, rolePermission: rpPda, user: userPubkey, permission: permPda })
        .rpc();
      setCheckResult("granted");
      addToast("Permission verified on-chain", "success");
    } catch {
      setCheckResult("denied");
      addToast("Access denied", "error");
    }
    setLoading(false);
  };

  // ── Render Helpers ─────────────────────────────────

  const PubkeyDisplay = ({ addr, full }: { addr: string; full?: boolean }) => (
    <span
      className="pubkey"
      onClick={() => copyToClipboard(addr)}
      title={`Click to copy: ${addr}`}
    >
      {full ? addr : shorten(addr, 6)}
      {copied === addr && <span className="copy-feedback" style={{ marginLeft: 6 }}>copied</span>}
    </span>
  );

  // ── Render ─────────────────────────────────────────

  if (!connected) {
    return (
      <div className="app-shell">
        <div className="main-area" style={{ marginLeft: 0 }}>
          <header className="topbar">
            <div className="topbar-title" style={{ gap: 10 }}>
              <span style={{ color: "var(--accent)" }}>{Icons.shield}</span>
              <span style={{ fontWeight: 700 }}>SOLGUARD</span>
            </div>
            <WalletMultiButton />
          </header>
          <div className="hero-screen" style={{ minHeight: "85vh" }}>
            <svg className="hero-shield-bg" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <div className="hero-pill">LIVE ON SOLANA DEVNET</div>
            <h2>Guard. Control.<br /><span className="hero-accent">On-chain.</span></h2>
            <p>
              The on-chain role-based access control protocol built for Solana.
              Manage roles, permissions, and user access with cryptography and security.
            </p>
            <div className="hero-buttons">
              <WalletMultiButton />
              <a className="btn btn-outline btn-lg" href="https://github.com/samar-58/solguard" target="_blank" rel="noopener noreferrer">
                GitHub →
              </a>
            </div>
          </div>

          {/* ── Features ──────────────── */}
          <section className="landing-features">
            <div className="landing-section-header">
              <h3>Why SolGuard?</h3>
              <p>Replace database tables and JWT middleware with trustless on-chain accounts.</p>
            </div>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">{Icons.link}</div>
                <h4>CPI-Callable</h4>
                <p>Any Solana program can call <code>check_permission</code> via CPI to gate its instructions. One shared IAM layer for all your programs.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">{Icons.key}</div>
                <h4>Role → Permission Chains</h4>
                <p>Create roles, bind fine-grained permissions, and assign to wallets with optional expiry. The full RBAC model, on-chain.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">{Icons.lock}</div>
                <h4>Immutable Audit Trail</h4>
                <p>Every grant, revoke, and permission change is a transaction on the blockchain. No silent modifications, ever.</p>
              </div>
            </div>
          </section>

          {/* ── How it works ──────────── */}
          <section className="landing-features" style={{ borderTop: "1px solid var(--border-subtle)" }}>
            <div className="landing-section-header">
              <h3>How it works</h3>
              <p>Three steps to on-chain access control.</p>
            </div>
            <div className="steps-grid">
              <div className="step-card">
                <span className="step-number">1</span>
                <h4>Initialize</h4>
                <p>Deploy a root authority account to create your organization on-chain.</p>
              </div>
              <div className="step-card">
                <span className="step-number">2</span>
                <h4>Configure</h4>
                <p>Create roles and permissions, then bind permissions to roles.</p>
              </div>
              <div className="step-card">
                <span className="step-number">3</span>
                <h4>Enforce</h4>
                <p>Assign roles to wallets and verify access via CPI from any program.</p>
              </div>
            </div>
          </section>

          {/* ── Footer ────────────────── */}
          <footer className="landing-footer">
            <span>Built on Solana with Anchor</span>
            <span>·</span>
            <a href="https://github.com/samar-58/solguard" target="_blank" rel="noopener noreferrer">GitHub</a>
          </footer>
        </div>
      </div>
    );
  }

  if (!rootExists) {
    return (
      <div className="app-shell">
        <div className="main-area" style={{ marginLeft: 0 }}>
          <header className="topbar">
            <div className="topbar-title" style={{ gap: 10 }}>
              <span style={{ color: "var(--accent)" }}>{Icons.shield}</span>
              <span style={{ fontWeight: 700 }}>SOLGUARD</span>
            </div>
            <div className="topbar-right">
              <div className="topbar-network"><span className="dot" />devnet</div>
              <WalletMultiButton />
            </div>
          </header>
          <div className="hero-screen">
            <div className="hero-icon">{Icons.box}</div>
            <h2>Initialize Your<br /><span className="hero-accent">Organization</span></h2>
            <p>
              Deploy a root authority account on-chain to begin creating roles
              and managing permissions.
            </p>
            <button className="btn btn-primary btn-lg" onClick={initRoot} disabled={loading}>
              {loading ? <span className="spinner" /> : Icons.plus}
              Initialize Root Authority
            </button>
          </div>
        </div>
        <div className="toast-container">
          {toasts.map((t) => (
            <div key={t.id} className={`toast toast-${t.type}`}>
              <span className="toast-icon">{t.type === "success" ? "✓" : "✗"}</span>
              {t.message}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* ── Sidebar ──────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span style={{ color: "var(--accent)" }}>{Icons.shield}</span>
          <h1>SOLGUARD</h1>
          <span className="env-badge">devnet</span>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Manage</div>
          {(["roles", "permissions", "users"] as Tab[]).map((t) => (
            <button
              key={t}
              className={`nav-item ${tab === t ? "active" : ""}`}
              onClick={() => setTab(t)}
            >
              {tabMeta[t].icon}
              {tabMeta[t].label}
              <span className="nav-count">
                {t === "roles" ? roleCount : t === "permissions" ? permCount : userRoles.length}
              </span>
            </button>
          ))}

          <div className="sidebar-section-label">Verify</div>
          <button
            className={`nav-item ${tab === "check" ? "active" : ""}`}
            onClick={() => setTab("check")}
          >
            {Icons.check}
            Check Access
          </button>
        </nav>

        {publicKey && (
          <div className="sidebar-footer">
            <div className="sidebar-wallet-info">
              <span className="sidebar-wallet-dot" />
              <span className="sidebar-wallet-addr">{shorten(publicKey.toBase58(), 6)}</span>
              <span
                style={{ cursor: "pointer", opacity: 0.5 }}
                onClick={() => copyToClipboard(publicKey.toBase58())}
                title="Copy address"
              >
                {Icons.copy}
              </span>
            </div>
          </div>
        )}
      </aside>

      {/* ── Main ─────────────────────── */}
      <div className="main-area">
        <header className="topbar">
          <div className="topbar-title">
            {tabMeta[tab].icon}
            {tabMeta[tab].label}
          </div>
          <div className="topbar-right">
            <div className="topbar-network"><span className="dot" />devnet</div>
            <WalletMultiButton />
          </div>
        </header>

        <main className="main-content" key={tab}>
          {/* ── Stats ─────────────────── */}
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-icon stat-icon-purple">{Icons.shield}</div>
              <div className="stat-label">Roles</div>
              <div className="stat-value">{roleCount}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-amber">{Icons.key}</div>
              <div className="stat-label">Permissions</div>
              <div className="stat-value">{permCount}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-cyan">{Icons.users}</div>
              <div className="stat-label">Assignments</div>
              <div className="stat-value">{userRoles.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-green">{Icons.lock}</div>
              <div className="stat-label">Authority</div>
              <div className="stat-value" style={{ fontSize: 13 }}>
                <span className="pubkey-chip">
                  {publicKey ? shorten(publicKey.toBase58()) : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* ── Roles Tab ────────────── */}
          {tab === "roles" && (
            <>
              <div className="section-header">
                <div>
                  <h2>Roles</h2>
                  <p>Create access roles and bind permissions to them</p>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="card-header-left">{Icons.plus}<h3>Create Role</h3></div>
                </div>
                <div className="card-body">
                  <div className="form-row">
                    <div className="field">
                      <label>Role Name</label>
                      <input className="input" placeholder="e.g. admin, editor, viewer" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && createRole()} />
                    </div>
                    <button className="btn btn-primary" onClick={createRole} disabled={loading || !newRoleName.trim()} style={{ marginTop: 18 }}>
                      {loading ? <span className="spinner" /> : "Create"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="card-header-left">{Icons.link}<h3>Bind Permission to Role</h3></div>
                </div>
                <div className="card-body">
                  <div className="form-row">
                    <div className="field">
                      <label>Role</label>
                      <select className="input" value={bindRoleName} onChange={(e) => setBindRoleName(e.target.value)}>
                        <option value="">Select a role…</option>
                        {roles.map((r) => <option key={r.pda.toBase58()} value={r.name}>{r.name}</option>)}
                      </select>
                    </div>
                    <div className="field">
                      <label>Permission</label>
                      <select className="input" value={bindPermName} onChange={(e) => setBindPermName(e.target.value)}>
                        <option value="">Select a permission…</option>
                        {permissions.map((p) => <option key={p.pda.toBase58()} value={p.name}>{p.name}</option>)}
                      </select>
                    </div>
                    <button className="btn btn-primary" onClick={assignPermToRole} disabled={loading || !bindRoleName.trim() || !bindPermName.trim()} style={{ marginTop: 18 }}>
                      {loading ? <span className="spinner" /> : "Bind"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="card-header-left">{Icons.shield}<h3>Existing Roles</h3></div>
                  <span className="count">{roles.length}</span>
                </div>
                {roles.length === 0 ? (
                  <div className="empty-state">
                    {Icons.shield}
                    <p>No roles created yet</p>
                    <span className="hint">Create your first role above to get started</span>
                  </div>
                ) : (
                  <table className="data-table">
                    <thead><tr><th>Name</th><th>PDA</th><th>Linked Permissions</th></tr></thead>
                    <tbody>
                      {roles.map((r) => (
                        <tr key={r.pda.toBase58()}>
                          <td><span className="badge badge-role">{r.name}</span></td>
                          <td><PubkeyDisplay addr={r.pda.toBase58()} /></td>
                          <td>
                            {r.permissions.length > 0
                              ? r.permissions.map((p, i) => <span key={i} className="badge badge-perm" style={{ marginRight: 4 }}>{p}</span>)
                              : <span style={{ color: "var(--text-dim)", fontSize: 12 }}>—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {/* ── Permissions Tab ───────── */}
          {tab === "permissions" && (
            <>
              <div className="section-header">
                <div>
                  <h2>Permissions</h2>
                  <p>Define granular access primitives for your organization</p>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="card-header-left">{Icons.plus}<h3>Create Permission</h3></div>
                </div>
                <div className="card-body">
                  <div className="form-row">
                    <div className="field">
                      <label>Permission Name</label>
                      <input className="input" placeholder="e.g. read, write, delete, publish" value={newPermName} onChange={(e) => setNewPermName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && createPermission()} />
                    </div>
                    <button className="btn btn-primary" onClick={createPermission} disabled={loading || !newPermName.trim()} style={{ marginTop: 18 }}>
                      {loading ? <span className="spinner" /> : "Create"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="card-header-left">{Icons.key}<h3>Existing Permissions</h3></div>
                  <span className="count">{permissions.length}</span>
                </div>
                {permissions.length === 0 ? (
                  <div className="empty-state">
                    {Icons.key}
                    <p>No permissions defined yet</p>
                    <span className="hint">Permissions are granular access primitives bound to roles</span>
                  </div>
                ) : (
                  <table className="data-table">
                    <thead><tr><th>Name</th><th>PDA</th></tr></thead>
                    <tbody>
                      {permissions.map((p) => (
                        <tr key={p.pda.toBase58()}>
                          <td><span className="badge badge-perm">{p.name}</span></td>
                          <td><PubkeyDisplay addr={p.pda.toBase58()} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {/* ── Users Tab ────────────── */}
          {tab === "users" && (
            <>
              <div className="section-header">
                <div>
                  <h2>User Assignments</h2>
                  <p>Assign roles to wallet addresses with optional time-bounds</p>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="card-header-left">{Icons.plus}<h3>Assign Role to User</h3></div>
                </div>
                <div className="card-body">
                  <div className="form-grid form-grid-3" style={{ marginBottom: 12 }}>
                    <div className="field">
                      <label>User Wallet</label>
                      <input className="input input-mono" placeholder="Wallet address" value={assignUserAddr} onChange={(e) => setAssignUserAddr(e.target.value)} />
                    </div>
                    <div className="field">
                      <label>Role</label>
                      <select className="input" value={assignRoleName} onChange={(e) => setAssignRoleName(e.target.value)}>
                        <option value="">Select a role…</option>
                        {roles.map((r) => <option key={r.pda.toBase58()} value={r.name}>{r.name}</option>)}
                      </select>
                    </div>
                    <div className="field">
                      <label>Expiry</label>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-secondary)", cursor: "pointer", textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>
                          <input type="checkbox" checked={assignNeverExpires} onChange={(e) => setAssignNeverExpires(e.target.checked)} />
                          Never expires
                        </label>
                      </div>
                      {!assignNeverExpires && (
                        <input type="datetime-local" className="input" value={assignExpiry} onChange={(e) => setAssignExpiry(e.target.value)} />
                      )}
                    </div>
                  </div>
                  <button className="btn btn-primary" onClick={assignRole} disabled={loading || !assignUserAddr.trim() || !assignRoleName.trim()}>
                    {loading ? <span className="spinner" /> : "Assign Role"}
                  </button>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="card-header-left">{Icons.users}<h3>Active Assignments</h3></div>
                  <span className="count">{userRoles.length}</span>
                </div>
                {userRoles.length === 0 ? (
                  <div className="empty-state">
                    {Icons.users}
                    <p>No user-role assignments yet</p>
                    <span className="hint">Assign a role above to grant access</span>
                  </div>
                ) : (
                  <table className="data-table">
                    <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Expires</th><th></th></tr></thead>
                    <tbody>
                      {userRoles.map((ur) => {
                        const now = Math.floor(Date.now() / 1000);
                        const expired = ur.expiresAt !== -1 && ur.expiresAt < now;
                        return (
                          <tr key={ur.userRolePda.toBase58()}>
                            <td><PubkeyDisplay addr={ur.user} /></td>
                            <td><span className="badge badge-role">{ur.roleName}</span></td>
                            <td><span className={`badge ${expired ? "badge-expired" : "badge-active"}`}>{expired ? "expired" : "active"}</span></td>
                            <td style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-secondary)" }}>
                              {ur.expiresAt === -1 ? "never" : new Date(ur.expiresAt * 1000).toLocaleString()}
                            </td>
                            <td>
                              <button className="btn btn-danger btn-sm" onClick={() => revokeUserRole(ur)} disabled={loading}>Revoke</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {/* ── Check Tab ────────────── */}
          {tab === "check" && (
            <>
              <div className="section-header">
                <div>
                  <h2>Check Access</h2>
                  <p>Verify on-chain whether a user has a specific permission</p>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="card-header-left">{Icons.check}<h3>Verify Permission</h3></div>
                </div>
                <div className="card-body">
                  <div className="form-grid" style={{ marginBottom: 12 }}>
                    <div className="field">
                      <label>User Wallet</label>
                      <input className="input input-mono" placeholder="Wallet public key" value={checkUserAddr} onChange={(e) => setCheckUserAddr(e.target.value)} />
                    </div>
                    <div className="form-grid form-grid-2">
                      <div className="field">
                        <label>Role</label>
                        <select className="input" value={checkRoleName} onChange={(e) => setCheckRoleName(e.target.value)}>
                          <option value="">Select a role…</option>
                          {roles.map((r) => <option key={r.pda.toBase58()} value={r.name}>{r.name}</option>)}
                        </select>
                      </div>
                      <div className="field">
                        <label>Permission</label>
                        <select className="input" value={checkPermName} onChange={(e) => setCheckPermName(e.target.value)}>
                          <option value="">Select a permission…</option>
                          {permissions.map((p) => <option key={p.pda.toBase58()} value={p.name}>{p.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                  <button className="btn btn-primary" onClick={checkPermission} disabled={loading || !checkUserAddr.trim() || !checkRoleName.trim() || !checkPermName.trim()}>
                    {loading ? <span className="spinner" /> : "Check Permission"}
                  </button>

                  {checkResult && (
                    <div className={`check-result check-result-${checkResult}`}>
                      <div className="check-result-icon">
                        {checkResult === "granted" ? "✓" : "✗"}
                      </div>
                      <div className="check-result-text">
                        <h4>{checkResult === "granted" ? "Access Granted" : "Access Denied"}</h4>
                        <p>
                          {checkResult === "granted"
                            ? `${checkRoleName} → ${checkPermName} verified on-chain`
                            : "User does not have this permission through the specified role"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* ── Toasts ───────────────────── */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span className="toast-icon">{t.type === "success" ? "✓" : "✗"}</span>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
