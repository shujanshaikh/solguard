use anchor_lang::prelude::*;

use crate::errors::RbacError;
use crate::state::{Role, Permission, RolePermission, RootAuthority};

#[derive(Accounts)]
pub struct AssignPermissionToRole<'info> {
    #[account(
        init,
        payer = authority,
        space = RolePermission::SPACE,
        seeds = [
            RolePermission::SEED_PREFIX,
            role.key().as_ref(),
            permission.key().as_ref(),
        ],
        bump
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

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<AssignPermissionToRole>) -> Result<()> {
    let rp = &mut ctx.accounts.role_permission;

    rp.role = ctx.accounts.role.key();
    rp.permission = ctx.accounts.permission.key();
    rp.bump = ctx.bumps.role_permission;

    msg!(
        "SolGuard: Permission {} assigned to role {}",
        rp.permission,
        rp.role
    );

    Ok(())
}
