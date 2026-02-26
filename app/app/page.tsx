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

export default function Dashboard() {
  const { publicKey, connected } = useWallet();
  const { program, connection } = useProgram();

  const [tab, setTab] = useState<Tab>("roles");
  const [rootPda, setRootPda] = useState<PublicKey | null>(null);
  const [rootExists, setRootExists] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roleCount, setRoleCount] = useState(0);
  const [permCount, setPermCount] = useState(0);

  // form state
  const [newRoleName, setNewRoleName] = useState("");
  const [newPermName, setNewPermName] = useState("");
  const [assignUserAddr, setAssignUserAddr] = useState("");
  const [assignRoleName, setAssignRoleName] = useState("");
  const [assignExpiry, setAssignExpiry] = useState("-1");
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

  // ── Load Root Authority ──────────────────────────

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

  useEffect(() => {
    loadRoot();
  }, [loadRoot]);

  // ── Load Roles ───────────────────────────────────

  const loadRoles = useCallback(async () => {
    if (!program || !rootPda || !rootExists) return;
    try {
      const allRoles = await program.account.role.all([
        { memcmp: { offset: 8, bytes: rootPda.toBase58() } },
      ]);
      const allRolePerms = await program.account.rolePermission.all();
      const allPerms = await program.account.permission.all([
        { memcmp: { offset: 8, bytes: rootPda.toBase58() } },
      ]);

      const permMap = new Map(allPerms.map((p) => [p.publicKey.toBase58(), p]));

      const rolesData: RoleData[] = allRoles.map((r) => {
        const linkedPerms = allRolePerms
          .filter((rp) => rp.account.role.equals(r.publicKey))
          .map((rp) => {
            const pm = permMap.get(rp.account.permission.toBase58());
            return pm ? pm.publicKey.toBase58().slice(0, 8) + "…" : "?";
          });

        // derive the name from the PDA seeds isn't possible, so use the short key
        return {
          name: r.publicKey.toBase58().slice(0, 8),
          pda: r.publicKey,
          permissions: linkedPerms,
        };
      });
      setRoles(rolesData);
    } catch (err) {
      console.error("loadRoles error:", err);
    }
  }, [program, rootPda, rootExists]);

  // ── Load Permissions ─────────────────────────────

  const loadPermissions = useCallback(async () => {
    if (!program || !rootPda || !rootExists) return;
    try {
      const allPerms = await program.account.permission.all([
        { memcmp: { offset: 8, bytes: rootPda.toBase58() } },
      ]);
      setPermissions(
        allPerms.map((p) => ({
          name: p.publicKey.toBase58().slice(0, 8),
          pda: p.publicKey,
        }))
      );
    } catch (err) {
      console.error("loadPermissions error:", err);
    }
  }, [program, rootPda, rootExists]);

  // ── Load User Roles ──────────────────────────────

  const loadUserRoles = useCallback(async () => {
    if (!program || !rootPda || !rootExists) return;
    try {
      const allUr = await program.account.userRole.all([
        { memcmp: { offset: 8 + 32, bytes: rootPda.toBase58() } },
      ]);
      setUserRoles(
        allUr.map((ur) => ({
          user: ur.account.user.toBase58(),
          roleName: ur.account.role.toBase58().slice(0, 8),
          rolePda: ur.account.role,
          userRolePda: ur.publicKey,
          expiresAt: ur.account.expiresAt.toNumber(),
          grantedBy: ur.account.grantedBy.toBase58(),
        }))
      );
    } catch (err) {
      console.error("loadUserRoles error:", err);
    }
  }, [program, rootPda, rootExists]);

  useEffect(() => {
    if (rootExists) {
      loadRoles();
      loadPermissions();
      loadUserRoles();
    }
  }, [rootExists, loadRoles, loadPermissions, loadUserRoles]);

  // ── Actions ──────────────────────────────────────

  const initRoot = async () => {
    if (!program || !publicKey || !rootPda) return;
    setLoading(true);
    try {
      await program.methods
        .initializeRoot()
        .accounts({
          rootAuthority: rootPda,
          authority: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      addToast("Root authority initialized", "success");
      await loadRoot();
    } catch (err: any) {
      addToast(err.message || "Failed to initialize", "error");
    }
    setLoading(false);
  };

  const createRole = async () => {
    if (!program || !publicKey || !rootPda || !newRoleName.trim()) return;
    setLoading(true);
    try {
      const [rolePda] = findRole(rootPda, newRoleName.trim());
      await program.methods
        .createRole(newRoleName.trim())
        .accounts({
          role: rolePda,
          rootAuthority: rootPda,
          authority: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      addToast(`Role "${newRoleName.trim()}" created`, "success");
      setNewRoleName("");
      await loadRoot();
      await loadRoles();
    } catch (err: any) {
      addToast(err.message || "Failed to create role", "error");
    }
    setLoading(false);
  };

  const createPermission = async () => {
    if (!program || !publicKey || !rootPda || !newPermName.trim()) return;
    setLoading(true);
    try {
      const [permPda] = findPermission(rootPda, newPermName.trim());
      await program.methods
        .createPermission(newPermName.trim())
        .accounts({
          permission: permPda,
          rootAuthority: rootPda,
          authority: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      addToast(`Permission "${newPermName.trim()}" created`, "success");
      setNewPermName("");
      await loadRoot();
      await loadPermissions();
    } catch (err: any) {
      addToast(err.message || "Failed to create permission", "error");
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
      await program.methods
        .assignPermissionToRole()
        .accounts({
          rolePermission: rpPda,
          role: rolePda,
          permission: permPda,
          rootAuthority: rootPda,
          authority: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      addToast(`Permission "${bindPermName.trim()}" bound to role "${bindRoleName.trim()}"`, "success");
      setBindRoleName("");
      setBindPermName("");
      await loadRoles();
    } catch (err: any) {
      addToast(err.message || "Failed to bind permission", "error");
    }
    setLoading(false);
  };

  const assignRole = async () => {
    if (!program || !publicKey || !rootPda || !assignUserAddr.trim() || !assignRoleName.trim())
      return;
    setLoading(true);
    try {
      const userPubkey = new PublicKey(assignUserAddr.trim());
      const [rolePda] = findRole(rootPda, assignRoleName.trim());
      const [urPda] = findUserRole(rootPda, userPubkey, rolePda);
      const expiry = parseInt(assignExpiry) || -1;
      await program.methods
        .assignRoleToUser(new BN(expiry))
        .accounts({
          userRole: urPda,
          role: rolePda,
          user: userPubkey,
          rootAuthority: rootPda,
          authority: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      addToast(`Role "${assignRoleName.trim()}" assigned to ${assignUserAddr.trim().slice(0, 8)}…`, "success");
      setAssignUserAddr("");
      setAssignRoleName("");
      setAssignExpiry("-1");
      await loadUserRoles();
    } catch (err: any) {
      addToast(err.message || "Failed to assign role", "error");
    }
    setLoading(false);
  };

  const revokeUserRole = async (ur: UserRoleData) => {
    if (!program || !publicKey || !rootPda) return;
    setLoading(true);
    try {
      await program.methods
        .revokeRoleFromUser()
        .accounts({
          userRole: ur.userRolePda,
          role: ur.rolePda,
          user: new PublicKey(ur.user),
          rootAuthority: rootPda,
          authority: publicKey,
        })
        .rpc();
      addToast(`Role revoked from ${ur.user.slice(0, 8)}…`, "success");
      await loadUserRoles();
    } catch (err: any) {
      addToast(err.message || "Failed to revoke role", "error");
    }
    setLoading(false);
  };

  const checkPermission = async () => {
    if (!program || !rootPda || !checkUserAddr.trim() || !checkRoleName.trim() || !checkPermName.trim())
      return;
    setLoading(true);
    setCheckResult(null);
    try {
      const userPubkey = new PublicKey(checkUserAddr.trim());
      const [rolePda] = findRole(rootPda, checkRoleName.trim());
      const [permPda] = findPermission(rootPda, checkPermName.trim());
      const [urPda] = findUserRole(rootPda, userPubkey, rolePda);
      const [rpPda] = findRolePermission(rolePda, permPda);

      await program.methods
        .checkPermission()
        .accounts({
          userRole: urPda,
          rolePermission: rpPda,
          user: userPubkey,
          permission: permPda,
        })
        .rpc();
      setCheckResult("granted");
      addToast("Permission check passed", "success");
    } catch (err: any) {
      setCheckResult("denied");
      addToast("Permission denied", "error");
    }
    setLoading(false);
  };

  // ── Shorten Pubkey ───────────────────────────────

  const shorten = (addr: string, n = 4) =>
    addr.slice(0, n) + "…" + addr.slice(-n);

  // ── Render ───────────────────────────────────────

  return (
    <div className="app-shell">
      {/* Topbar */}
      <header className="topbar">
        <div className="topbar-brand">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <h1>SolGuard</h1>
          <span>devnet</span>
        </div>
        <div className="topbar-right">
          {connected && publicKey && (
            <span className="pubkey-short">{shorten(publicKey.toBase58())}</span>
          )}
          <WalletMultiButton />
        </div>
      </header>

      {/* Main */}
      <main className="main-content">
        {!connected ? (
          <div className="connect-prompt">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent)" }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <h2>SolGuard RBAC</h2>
            <p>
              Connect your wallet to manage roles, permissions, and access
              control on Solana devnet.
            </p>
          </div>
        ) : !rootExists ? (
          <div className="init-banner">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent)" }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <h2>Initialize Your Organization</h2>
            <p>
              Create a root authority account to start managing roles and
              permissions on-chain.
            </p>
            <button className="btn btn-primary" onClick={initRoot} disabled={loading}>
              {loading ? <span className="spinner" /> : null}
              Initialize Root Authority
            </button>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-label">Roles</div>
                <div className="stat-value">{roleCount}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Permissions</div>
                <div className="stat-value">{permCount}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">User Assignments</div>
                <div className="stat-value">{userRoles.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Authority</div>
                <div className="stat-value" style={{ fontSize: 14 }}>
                  <span className="pubkey-short">
                    {publicKey ? shorten(publicKey.toBase58()) : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="tab-nav">
              {(["roles", "permissions", "users", "check"] as Tab[]).map((t) => (
                <button
                  key={t}
                  className={`tab-btn ${tab === t ? "active" : ""}`}
                  onClick={() => setTab(t)}
                >
                  {t === "check" ? "Check Access" : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {/* ── Roles Tab ───────────────── */}
            {tab === "roles" && (
              <div>
                <div className="section-header">
                  <h2>Roles</h2>
                </div>

                {/* Create Role */}
                <div className="card" style={{ marginBottom: 16 }}>
                  <div className="card-header">
                    <h3>Create Role</h3>
                  </div>
                  <div className="form-row">
                    <input
                      className="input"
                      placeholder="Role name (e.g. admin, editor)"
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && createRole()}
                    />
                    <button className="btn btn-primary" onClick={createRole} disabled={loading || !newRoleName.trim()}>
                      {loading ? <span className="spinner" /> : "Create"}
                    </button>
                  </div>
                </div>

                {/* Bind Permission */}
                <div className="card" style={{ marginBottom: 16 }}>
                  <div className="card-header">
                    <h3>Assign Permission to Role</h3>
                  </div>
                  <div className="form-row">
                    <input
                      className="input"
                      placeholder="Role name"
                      value={bindRoleName}
                      onChange={(e) => setBindRoleName(e.target.value)}
                    />
                    <input
                      className="input"
                      placeholder="Permission name"
                      value={bindPermName}
                      onChange={(e) => setBindPermName(e.target.value)}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={assignPermToRole}
                      disabled={loading || !bindRoleName.trim() || !bindPermName.trim()}
                    >
                      {loading ? <span className="spinner" /> : "Bind"}
                    </button>
                  </div>
                </div>

                {/* Role Table */}
                <div className="card">
                  <div className="card-header">
                    <h3>Existing Roles</h3>
                    <span className="count">{roles.length}</span>
                  </div>
                  {roles.length === 0 ? (
                    <div className="empty-state">No roles created yet</div>
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>PDA</th>
                          <th>Linked Permissions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roles.map((r) => (
                          <tr key={r.pda.toBase58()}>
                            <td>
                              <span className="pubkey">{shorten(r.pda.toBase58(), 6)}</span>
                            </td>
                            <td>
                              {r.permissions.length > 0 ? (
                                r.permissions.map((p, i) => (
                                  <span key={i} className="badge badge-perm" style={{ marginRight: 4 }}>
                                    {p}
                                  </span>
                                ))
                              ) : (
                                <span style={{ color: "var(--text-dim)", fontSize: 12 }}>none</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* ── Permissions Tab ─────────── */}
            {tab === "permissions" && (
              <div>
                <div className="section-header">
                  <h2>Permissions</h2>
                </div>

                <div className="card" style={{ marginBottom: 16 }}>
                  <div className="card-header">
                    <h3>Create Permission</h3>
                  </div>
                  <div className="form-row">
                    <input
                      className="input"
                      placeholder="Permission name (e.g. read, write, delete)"
                      value={newPermName}
                      onChange={(e) => setNewPermName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && createPermission()}
                    />
                    <button className="btn btn-primary" onClick={createPermission} disabled={loading || !newPermName.trim()}>
                      {loading ? <span className="spinner" /> : "Create"}
                    </button>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h3>Existing Permissions</h3>
                    <span className="count">{permissions.length}</span>
                  </div>
                  {permissions.length === 0 ? (
                    <div className="empty-state">No permissions created yet</div>
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>PDA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {permissions.map((p) => (
                          <tr key={p.pda.toBase58()}>
                            <td>
                              <span className="pubkey">{shorten(p.pda.toBase58(), 6)}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* ── Users Tab ───────────────── */}
            {tab === "users" && (
              <div>
                <div className="section-header">
                  <h2>User Assignments</h2>
                </div>

                <div className="card" style={{ marginBottom: 16 }}>
                  <div className="card-header">
                    <h3>Assign Role to User</h3>
                  </div>
                  <div className="form-row">
                    <input
                      className="input input-mono"
                      placeholder="User wallet address"
                      value={assignUserAddr}
                      onChange={(e) => setAssignUserAddr(e.target.value)}
                    />
                    <input
                      className="input"
                      placeholder="Role name"
                      value={assignRoleName}
                      onChange={(e) => setAssignRoleName(e.target.value)}
                      style={{ maxWidth: 160 }}
                    />
                    <input
                      className="input input-mono"
                      placeholder="Expiry (-1 = never)"
                      value={assignExpiry}
                      onChange={(e) => setAssignExpiry(e.target.value)}
                      style={{ maxWidth: 140 }}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={assignRole}
                      disabled={loading || !assignUserAddr.trim() || !assignRoleName.trim()}
                    >
                      {loading ? <span className="spinner" /> : "Assign"}
                    </button>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h3>Active Assignments</h3>
                    <span className="count">{userRoles.length}</span>
                  </div>
                  {userRoles.length === 0 ? (
                    <div className="empty-state">No user-role assignments yet</div>
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Role PDA</th>
                          <th>Status</th>
                          <th>Expires</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {userRoles.map((ur) => {
                          const now = Math.floor(Date.now() / 1000);
                          const expired = ur.expiresAt !== -1 && ur.expiresAt < now;
                          return (
                            <tr key={ur.userRolePda.toBase58()}>
                              <td>
                                <span className="pubkey">{shorten(ur.user, 6)}</span>
                              </td>
                              <td>
                                <span className="badge badge-role">{ur.roleName}…</span>
                              </td>
                              <td>
                                <span className={`badge ${expired ? "badge-expired" : "badge-active"}`}>
                                  {expired ? "expired" : "active"}
                                </span>
                              </td>
                              <td style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-muted)" }}>
                                {ur.expiresAt === -1
                                  ? "never"
                                  : new Date(ur.expiresAt * 1000).toLocaleString()}
                              </td>
                              <td>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => revokeUserRole(ur)}
                                  disabled={loading}
                                >
                                  Revoke
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* ── Check Access Tab ───────── */}
            {tab === "check" && (
              <div>
                <div className="section-header">
                  <h2>Check Access</h2>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h3>Verify User Permission</h3>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div className="form-row">
                      <div className="field">
                        <label>User Wallet</label>
                        <input
                          className="input input-mono"
                          placeholder="Public key"
                          value={checkUserAddr}
                          onChange={(e) => setCheckUserAddr(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="field">
                        <label>Role Name</label>
                        <input
                          className="input"
                          placeholder="e.g. admin"
                          value={checkRoleName}
                          onChange={(e) => setCheckRoleName(e.target.value)}
                        />
                      </div>
                      <div className="field">
                        <label>Permission Name</label>
                        <input
                          className="input"
                          placeholder="e.g. write"
                          value={checkPermName}
                          onChange={(e) => setCheckPermName(e.target.value)}
                        />
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <button
                        className="btn btn-primary"
                        onClick={checkPermission}
                        disabled={
                          loading ||
                          !checkUserAddr.trim() ||
                          !checkRoleName.trim() ||
                          !checkPermName.trim()
                        }
                      >
                        {loading ? <span className="spinner" /> : "Check Permission"}
                      </button>
                      {checkResult && (
                        <span
                          className={`badge ${checkResult === "granted" ? "badge-active" : "badge-expired"
                            }`}
                          style={{ fontSize: 13, padding: "4px 14px" }}
                        >
                          {checkResult === "granted" ? "✓ Access Granted" : "✗ Access Denied"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Toasts */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.type === "success" ? "✓" : "✗"} {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
