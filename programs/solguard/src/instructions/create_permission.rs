use anchor_lang::prelude::*;

use crate::errors::RbacError;
use crate::state::{Permission, RootAuthority};

#[derive(Accounts)]
#[instruction(permission_name: String)]
pub struct CreatePermission<'info> {
    #[account(
        init,
        payer = authority,
        space = Permission::SPACE,
        seeds = [
            Permission::SEED_PREFIX,
            root_authority.key().as_ref(),
            permission_name.as_bytes(),
        ],
        bump
    )]
    pub permission: Account<'info, Permission>,

    #[account(
        mut,
        seeds = [RootAuthority::SEED_PREFIX, authority.key().as_ref()],
        bump = root_authority.bump,
        has_one = authority @ RbacError::NotRootAuthority,
    )]
    pub root_authority: Account<'info, RootAuthority>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreatePermission>, permission_name: String) -> Result<()> {
    let permission = &mut ctx.accounts.permission;
    let root = &mut ctx.accounts.root_authority;

    permission.root = root.key();
    permission.name = permission_name.clone();
    permission.bump = ctx.bumps.permission;

    root.permission_count = root.permission_count.checked_add(1).ok_or(RbacError::UserRoleAlreadyAssigned)?;

    msg!("SolGuard: Permission '{}' created under root {}", permission_name, root.key());

    Ok(())
}