use anchor_lang::prelude::*;

use crate::errors::RbacError;
use crate::state::{UserRole, RolePermission};

// validates that a user has a specific permission
// through their role assignment
//
// client must supply the correct UserRole and RolePermission accounts
// as proof of the permission chain: user → role → permission
// we just validate the links and check expiry
//
// other programs can call this to gate their instructions

#[derive(Accounts)]
pub struct CheckPermission<'info> {
    #[account(
        constraint = user_role.user == user.key() @ RbacError::UserMismatch,
        constraint = user_role.role == role_permission.role @ RbacError::RoleMismatch,
    )]
    pub user_role: Account<'info, UserRole>,

    #[account(
        constraint = role_permission.permission == permission.key() @ RbacError::RolePermissionMismatch,
    )]
    pub role_permission: Account<'info, RolePermission>,

    /// CHECK: the user whose permission is being checked
    pub user: UncheckedAccount<'info>,

    /// CHECK: the permission being checked, we just need the pubkey to match role_permission
    pub permission: UncheckedAccount<'info>,
}

pub fn handler(ctx: Context<CheckPermission>) -> Result<()> {
    let user_role = &ctx.accounts.user_role;

    // check if the role assignment has expired
    let clock = Clock::get()?;
    require!(
        !user_role.is_expired(clock.unix_timestamp),
        RbacError::RoleExpired
    );

    msg!(
        "SolGuard: Permission check passed — user {} has permission {} via role {}",
        ctx.accounts.user.key(),
        ctx.accounts.permission.key(),
        user_role.role,
    );

    Ok(())
}
