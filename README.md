# SolGuard — On-Chain RBAC for Solana

An on-chain Role-Based Access Control system built as an Anchor program on Solana. Replaces traditional Web2 RBAC (database tables, JWT middleware, per-app silos) with a trustless, CPI-callable permission layer that any Solana program can use.

## Devnet Deployment

| Item | Value |
|------|-------|
| **Program ID** | [`72YkKhqgzgue7niCaYs2QxQC3iLfUXGFMbo3yZ5K6d3Q`](https://explorer.solana.com/address/72YkKhqgzgue7niCaYs2QxQC3iLfUXGFMbo3yZ5K6d3Q?cluster=devnet) |
| **Deploy Tx** | [`5w1B5JNnFPXYXXJJZ253LdpKhuXKcyJSaV3R5DFLdetz1PT42EZypNbWeeK9yBAyL38tVHMhYD1GLDBtbK3ciw1M`](https://explorer.solana.com/tx/5w1B5JNnFPXYXXJJZ253LdpKhuXKcyJSaV3R5DFLdetz1PT42EZypNbWeeK9yBAyL38tVHMhYD1GLDBtbK3ciw1M?cluster=devnet) |
| **IDL Account** | [`67Zo4Fko8P5GAe2Py2qnkoiX8x5Jckk4tvaBCgVruR5d`](https://explorer.solana.com/address/67Zo4Fko8P5GAe2Py2qnkoiX8x5Jckk4tvaBCgVruR5d?cluster=devnet) |

---

## How This Works in Web2

In a typical Web2 backend RBAC system:

- **Database tables** — `users`, `roles`, `permissions`, `user_roles`, `role_permissions` stored in PostgreSQL/MySQL
- **JWT middleware** — on every API request, a middleware decodes the JWT, extracts the user's roles, and checks permissions
- **Per-app silos** — each application has its own RBAC system; permissions can't be shared across services
- **Trust the operator** — the database admin can silently modify roles, and there's no audit trail unless explicitly built

## How This Works on Solana

SolGuard replaces all of the above with on-chain accounts:

- **Accounts as the permission store** — each role, permission, and assignment is a PDA (Program Derived Address) on Solana
- **Program as trustless middleware** — the `check_permission` instruction validates the user→role→permission chain on-chain, no JWT needed
- **CPI-callable** — any Solana program can call `check_permission` via CPI to gate its own instructions
- **Shared across programs** — one SolGuard deployment can serve multiple programs, like a shared IAM layer
- **Immutable audit trail** — every role grant, revoke, and permission change is a transaction on the blockchain

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
| Password reset / transfer | `transfer_authority` instruction |
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

| Account | PDA Seeds | Size (bytes) | Fields |
|---|---|---|---|
| `RootAuthority` | `["root", authority]` | 57 | `authority`, `role_count`, `permission_count`, `bump` |
| `Role` | `["role", root, name]` | 41 | `root`, `bump` |
| `Permission` | `["permission", root, name]` | 41 | `root`, `bump` |
| `RolePermission` | `["role_permission", role, permission]` | 73 | `role`, `permission`, `bump` |
| `UserRole` | `["user_role", root, user, role]` | 145 | `user`, `role`, `root`, `granted_by`, `expires_at`, `bump` |

> Size includes the 8-byte Anchor discriminator.

## Instruction Reference

| Instruction | Arguments | Description |
|---|---|---|
| `initialize_root` | — | Create a new root authority (organization) |
| `create_role` | `role_name: String` | Create a role under the root |
| `create_permission` | `permission_name: String` | Create a permission under the root |
| `assign_permission_to_role` | — | Bind a permission to a role |
| `revoke_permission_from_role` | — | Unbind a permission from a role (closes account) |
| `assign_role_to_user` | `expires_at: i64` | Grant a role to a user wallet (-1 = never expires) |
| `revoke_role_from_user` | — | Remove a role from a user (closes account) |
| `check_permission` | — | Validate user has permission via role chain |
| `transfer_authority` | `new_authority: Pubkey` | Transfer root control to a new wallet |

---

## Tradeoffs & Constraints

- **No dynamic iteration on-chain** — you can't list all roles of a user on-chain. The client must enumerate off-chain (e.g. via `getProgramAccounts` with filters) and supply the correct `UserRole` + `RolePermission` accounts to `check_permission`.
- **Storage costs** — each PDA costs rent (~0.001 SOL per account). A system with 10 roles × 20 permissions × 100 users = ~2,000 accounts ≈ 2 SOL in rent.
- **No free revocation queries** — to check "does user X have ANY role?", you must query off-chain. On-chain checks are always for a specific user+permission pair.
- **PDA seeds use raw name bytes** — names are limited to 32 bytes (the max PDA seed length). Names are case-sensitive.
- **Single authority** — only one wallet controls each `RootAuthority`. For multi-sig, the authority could be a multisig PDA.

## Running Locally

```bash
# install dependencies
yarn install

# build the program
anchor build

# run tests (spins up local validator automatically)
anchor test

# deploy to devnet
solana config set --url devnet
anchor deploy --provider.cluster devnet
```

## CPI Integration Example

Another Solana program can call `check_permission` to gate its instructions:

```rust
use anchor_lang::prelude::*;
use solguard::cpi::accounts::CheckPermission;
use solguard::program::Solguard;

pub fn guarded_action(ctx: Context<GuardedAction>) -> Result<()> {
    // CPI into SolGuard to verify the user has the required permission
    let cpi_program = ctx.accounts.solguard_program.to_account_info();
    let cpi_accounts = CheckPermission {
        user_role: ctx.accounts.user_role.to_account_info(),
        role_permission: ctx.accounts.role_permission.to_account_info(),
        user: ctx.accounts.user.to_account_info(),
        permission: ctx.accounts.permission.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    solguard::cpi::check_permission(cpi_ctx)?;

    // if we get here, the user has the permission
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

## Project Structure

```
solguard/
├── programs/solguard/src/
│   ├── lib.rs                              # program entrypoint
│   ├── errors.rs                           # error codes
│   ├── state/
│   │   ├── mod.rs
│   │   ├── root_authority.rs
│   │   ├── role.rs
│   │   ├── permission.rs
│   │   ├── role_permission.rs
│   │   └── user_role.rs
│   └── instructions/
│       ├── mod.rs
│       ├── initialize_root.rs
│       ├── create_role.rs
│       ├── create_permission.rs
│       ├── assign_permission_to_role.rs
│       ├── revoke_permission_from_role.rs
│       ├── assign_role_to_user.rs
│       ├── revoke_role_from_user.rs
│       ├── check_permission.rs
│       └── transfer_authority.rs
├── tests/solguard.ts                       # 18 test cases
├── Anchor.toml
├── Cargo.toml
└── package.json
```
