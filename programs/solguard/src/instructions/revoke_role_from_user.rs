use anchor_lang::prelude::*;

use crate::errors::RbacError;
use crate::state::{Role, UserRole, RootAuthority};

#[derive(Accounts)]
pub struct RevokeRoleFromUser<'info> {
    #[account(
        mut,
        close = authority,
        seeds = [
            UserRole::SEED_PREFIX,
            root_authority.key().as_ref(),
            user.key().as_ref(),
            role.key().as_ref(),
        ],
        bump = user_role.bump,
        has_one = user,
        has_one = role,
        constraint = user_role.root == root_authority.key() @ RbacError::RoleMismatch,
    )]
    pub user_role: Account<'info, UserRole>,

    #[account(
        constraint = role.root == root_authority.key() @ RbacError::RoleMismatch,
    )]
    pub role: Account<'info, Role>,

    /// CHECK: The user wallet whose role is being revoked.
    pub user: UncheckedAccount<'info>,

    #[account(
        seeds = [RootAuthority::SEED_PREFIX, authority.key().as_ref()],
        bump = root_authority.bump,
        has_one = authority @ RbacError::NotRootAuthority,
    )]
    pub root_authority: Account<'info, RootAuthority>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<RevokeRoleFromUser>) -> Result<()> {
    msg!(
        "SolGuard: Role {} revoked from user {}",
        ctx.accounts.role.key(),
        ctx.accounts.user.key()
    );

    Ok(())
}
