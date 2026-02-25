use anchor_lang::prelude::*;

use crate::errors::RbacError;
use crate::state::{Role, UserRole, RootAuthority};

#[derive(Accounts)]
#[instruction(expires_at: i64)]
pub struct AssignRoleToUser<'info> {
    #[account(
        init,
        payer = authority,
        space = UserRole::SPACE,
        seeds = [
            UserRole::SEED_PREFIX,
            root_authority.key().as_ref(),
            user.key().as_ref(),
            role.key().as_ref(),
        ],
        bump
    )]
    pub user_role: Account<'info, UserRole>,

    #[account(
        constraint = role.root == root_authority.key() @ RbacError::RoleMismatch,
    )]
    pub role: Account<'info, Role>,

    /// CHECK: The user wallet receiving the role — no data to validate, just a pubkey.
    pub user: UncheckedAccount<'info>,

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

pub fn handler(ctx: Context<AssignRoleToUser>, expires_at: i64) -> Result<()> {
    let ur = &mut ctx.accounts.user_role;

    ur.user = ctx.accounts.user.key();
    ur.role = ctx.accounts.role.key();
    ur.root = ctx.accounts.root_authority.key();
    ur.granted_by = ctx.accounts.authority.key();
    ur.expires_at = expires_at;
    ur.bump = ctx.bumps.user_role;

    msg!(
        "SolGuard: Role {} assigned to user {}, expires_at: {}",
        ur.role,
        ur.user,
        expires_at
    );

    Ok(())
}
