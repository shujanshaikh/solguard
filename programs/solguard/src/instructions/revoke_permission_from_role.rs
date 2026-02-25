use anchor_lang::prelude::*;

use crate::errors::RbacError;
use crate::state::{Role, Permission, RolePermission, RootAuthority};

#[derive(Accounts)]
pub struct RevokePermissionFromRole<'info> {
    #[account(
        mut,
        close = authority,
        seeds = [
            RolePermission::SEED_PREFIX,
            role.key().as_ref(),
            permission.key().as_ref(),
        ],
        bump = role_permission.bump,
        has_one = role,
        has_one = permission,
    )]
    pub role_permission: Account<'info, RolePermission>,

    #[account(
        constraint = role.root == root_authority.key() @ RbacError::RoleMismatch,
    )]
    pub role: Account<'info, Role>,

    #[account(
        constraint = permission.root == root_authority.key() @ RbacError::PermissionMismatch,
    )]
    pub permission: Account<'info, Permission>,

    #[account(
        seeds = [RootAuthority::SEED_PREFIX, authority.key().as_ref()],
        bump = root_authority.bump,
        has_one = authority @ RbacError::NotRootAuthority,
    )]
    pub root_authority: Account<'info, RootAuthority>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<RevokePermissionFromRole>) -> Result<()> {
    msg!(
        "SolGuard: Permission {} revoked from role {}",
        ctx.accounts.permission.key(),
        ctx.accounts.role.key()
    );

    Ok(())
}
