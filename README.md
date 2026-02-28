# SolGuard — On-Chain RBAC for Solana

> Trustless, CPI-callable Role-Based Access Control on Solana. Replace database tables and JWT middleware with on-chain accounts that any program can verify.

![SolGuard](docs/screenshot.png)

## Devnet Deployment

| Item | Value |
|------|-------|
| **Program ID** | [`72YkKhqgzgue7niCaYs2QxQC3iLfUXGFMbo3yZ5K6d3Q`](https://explorer.solana.com/address/72YkKhqgzgue7niCaYs2QxQC3iLfUXGFMbo3yZ5K6d3Q?cluster=devnet) |
| **Deploy Tx** | [`5w1B5JNnFPXYXXJJZ253LdpKhuXKcyJSaV3R5DFLdetz1PT42EZypNbWeeK9yBAyL38tVHMhYD1GLDBtbK3ciw1M`](https://explorer.solana.com/tx/5w1B5JNnFPXYXXJJZ253LdpKhuXKcyJSaV3R5DFLdetz1PT42EZypNbWeeK9yBAyL38tVHMhYD1GLDBtbK3ciw1M?cluster=devnet) |
| **IDL Account** | [`67Zo4Fko8P5GAe2Py2qnkoiX8x5Jckk4tvaBCgVruR5d`](https://explorer.solana.com/address/67Zo4Fko8P5GAe2Py2qnkoiX8x5Jckk4tvaBCgVruR5d?cluster=devnet) |

---

## Why SolGuard?

Traditional Web2 RBAC relies on database tables, JWT middleware, and per-app silos — each application reinvents the wheel, trust is centralized, and there's no audit trail unless explicitly built.

SolGuard replaces all of that with on-chain accounts:

- **Accounts as the permission store** — roles, permissions, and assignments are PDAs on Solana
- **Trustless middleware** — `check_permission` validates the user→role→permission chain on-chain, no JWT needed
- **CPI-callable** — any Solana program can call `check_permission` via CPI to gate its own instructions
- **Shared across programs** — one SolGuard deployment serves multiple programs, like a shared IAM layer
- **Immutable audit trail** — every grant, revoke, and permission change is a transaction on the blockchain

## Web2 → Solana Mapping

| Web2 Concept | Solana Equivalent |
|---|---|
| `users` table | Wallet public keys |
| `roles` table | `Role` PDA |
| `permissions` table | `Permission` PDA |
| `user_roles` join table | `UserRole` PDA |
| `role_permissions` join table | `RolePermission` PDA |
| Organization / tenant | `RootAuthority` PDA |
| JWT role claim | On-chain `UserRole` account |
| Middleware permission check | `check_permission` instruction |
| `isAdmin()` helper | CPI call to `check_permission` |
| Database admin | `RootAuthority.authority` signer |
| Role expiry / TTL | `UserRole.expires_at` field |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      RootAuthority                          │
│                  PDA: ["root", authority]                    │
│          authority | role_count | permission_count           │
└───────────────┬─────────────────────┬───────────────────────┘
                │                     │
        ┌───────▼───────┐     ┌───────▼───────┐
        │     Role      │     │  Permission   │
        │ ["role",      │     │ ["permission",│
        │  root, name]  │     │  root, name]  │
        └───────┬───────┘     └───────┬───────┘
                │                     │
                └──────┐   ┌──────────┘
                ┌──────▼───▼──────┐
                │ RolePermission  │
                │ ["role_perm",   │
                │  role, perm]    │
                └────────┬────────┘
                         │
                ┌────────▼────────┐
                │    UserRole     │
                │ ["user_role",   │
                │  root, user,    │
                │  role]          │
                │                 │
                │ + expires_at    │
                │ + granted_by    │
                └─────────────────┘

    check_permission flow:
    ─────────────────────
    Client supplies: UserRole + RolePermission + user + permission
    Program validates:
      1. user_role.user == user
      2. user_role.role == role_permission.role
      3. role_permission.permission == permission
      4. user_role.expires_at == -1 OR now <= expires_at
      → Ok(()) or Error
```

## Account Model

| Account | PDA Seeds | Fields |
|---|---|---|
| `RootAuthority` | `["root", authority]` | `authority`, `role_count`, `permission_count`, `bump` |
| `Role` | `["role", root, name]` | `root`, `name`, `bump` |
| `Permission` | `["permission", root, name]` | `root`, `name`, `bump` |
| `RolePermission` | `["role_permission", role, permission]` | `role`, `permission`, `bump` |
| `UserRole` | `["user_role", root, user, role]` | `user`, `role`, `root`, `granted_by`, `expires_at`, `bump` |

## Instruction Reference

| Instruction | Arguments | Description |
|---|---|---|
| `initialize_root` | — | Create a new root authority (organization) |
| `create_role` | `role_name: String` | Create a role under the root |
| `create_permission` | `permission_name: String` | Create a permission under the root |
| `assign_permission_to_role` | — | Bind a permission to a role |
| `revoke_permission_from_role` | — | Unbind a permission from a role (closes account) |
| `assign_role_to_user` | `expires_at: i64` | Grant a role to a user wallet (`-1` = never expires) |
| `revoke_role_from_user` | — | Remove a role from a user (closes account) |
| `check_permission` | — | Validate user has permission via role chain |
| `transfer_authority` | `new_authority: Pubkey` | Transfer root control to a new wallet |

---

## Frontend Dashboard

The `app/` directory contains a **Next.js** dashboard for managing SolGuard directly from the browser:

- **Create roles & permissions** with named on-chain accounts
- **Bind permissions to roles** and assign roles to users via dropdown selectors
- **Set role expiry** with a date picker (or mark as "never expires")
- **Check access** — verify if a wallet has a specific permission through its role chain
- **Active assignments** table showing all user-role mappings under your root authority

### Tech stack

`Next.js 15` · `React 19` · `@solana/wallet-adapter` · `@coral-xyz/anchor` · `TypeScript`

---

## Getting Started

### Prerequisites

- [Rust](https://rustup.rs/) + [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) + [Anchor CLI](https://www.anchor-lang.com/docs/installation)
- [Node.js](https://nodejs.org/) 18+ and Yarn

### Build & Test the Program

```bash
# install dependencies
yarn install

# build the program
anchor build

# run tests (spins up local validator)
anchor test
```

### Deploy to Devnet

```bash
solana config set --url devnet
anchor deploy --provider.cluster devnet
```

### Run the Frontend

```bash
cd app
yarn install
yarn dev
# → http://localhost:3000
```

Connect a Solana wallet (Phantom, Backpack, etc.) on devnet to start managing roles and permissions.

---

## CPI Integration Example

Any Solana program can call `check_permission` via CPI to gate its instructions:

```rust
use anchor_lang::prelude::*;
use solguard::cpi::accounts::CheckPermission;
use solguard::program::Solguard;

pub fn guarded_action(ctx: Context<GuardedAction>) -> Result<()> {
    let cpi_program = ctx.accounts.solguard_program.to_account_info();
    let cpi_accounts = CheckPermission {
        user_role: ctx.accounts.user_role.to_account_info(),
        role_permission: ctx.accounts.role_permission.to_account_info(),
        user: ctx.accounts.user.to_account_info(),
        permission: ctx.accounts.permission.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    solguard::cpi::check_permission(cpi_ctx)?;

    msg!("Access granted — proceeding with guarded action");
    Ok(())
}

#[derive(Accounts)]
pub struct GuardedAction<'info> {
    pub user_role: AccountInfo<'info>,
    pub role_permission: AccountInfo<'info>,
    pub user: Signer<'info>,
    pub permission: AccountInfo<'info>,
    pub solguard_program: Program<'info, Solguard>,
}
```

---

## Tradeoffs & Constraints

- **No dynamic iteration on-chain** — you can't list all roles of a user on-chain. The client enumerates off-chain via `getProgramAccounts` with `memcmp` filters.
- **Storage costs** — each PDA costs rent (~0.001 SOL). 10 roles × 20 permissions × 100 users ≈ 2,000 accounts ≈ 2 SOL.
- **PDA seed length** — names are limited to 32 bytes and are case-sensitive.
- **Single authority** — one wallet controls each `RootAuthority`. For multi-sig, the authority could be a multisig PDA.

## Project Structure

```
solguard/
├── programs/solguard/src/
│   ├── lib.rs                              # program entrypoint
│   ├── errors.rs                           # error codes
│   ├── state/
│   │   ├── root_authority.rs
│   │   ├── role.rs
│   │   ├── permission.rs
│   │   ├── role_permission.rs
│   │   └── user_role.rs
│   └── instructions/
│       ├── initialize_root.rs
│       ├── create_role.rs
│       ├── create_permission.rs
│       ├── assign_permission_to_role.rs
│       ├── revoke_permission_from_role.rs
│       ├── assign_role_to_user.rs
│       ├── revoke_role_from_user.rs
│       ├── check_permission.rs
│       └── transfer_authority.rs
├── app/                                    # Next.js dashboard
│   ├── app/
│   │   ├── page.tsx                        # main UI
│   │   ├── globals.css                     # design system
│   │   ├── layout.tsx
│   │   ├── providers.tsx                   # wallet adapter setup
│   │   ├── idl.json                        # anchor IDL
│   │   └── hooks/
│   │       ├── useProgram.ts               # anchor program hook
│   │       └── usePda.ts                   # PDA derivation helpers
│   └── package.json
├── tests/solguard.ts
├── Anchor.toml
├── Cargo.toml
└── package.json
```

---

## License

MIT
