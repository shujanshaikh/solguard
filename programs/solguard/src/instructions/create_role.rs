use anchor_lang::prelude::*;

use crate::errors::RbacError;
use crate::state::{Role, RootAuthority};

#[derive(Accounts)]
#[instruction(role_name: String)]
pub struct CreateRole<'info> {
    #[account(
        init,
        payer = authority,
        space = Role::SPACE,
        seeds = [
            Role::SEED_PREFIX,
            root_authority.key().as_ref(),
            role_name.as_bytes(),
        ],
        bump
    )]
    pub role: Account<'info, Role>,

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

pub fn handler(ctx: Context<CreateRole>, role_name: String) -> Result<()> {
    let role = &mut ctx.accounts.role;
    let root = &mut ctx.accounts.root_authority;

    role.root = root.key();
    role.bump = ctx.bumps.role;

    root.role_count = root.role_count.checked_add(1).unwrap();

    msg!("SolGuard: Role '{}' created under root {}", role_name, root.key());

    Ok(())
}