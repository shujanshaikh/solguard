use anchor_lang::prelude::*;

use crate::state::RootAuthority;

#[derive(Accounts)]
pub struct InitializeRoot<'info> {
    #[account(
        init,
        payer = authority,
        space = RootAuthority::SPACE,
        seeds = [RootAuthority::SEED_PREFIX, authority.key().as_ref()], // seeds: ["root", authority]
        bump
    )]
    pub root_authority: Account<'info, RootAuthority>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeRoot>) -> Result<()> {
    let root = &mut ctx.accounts.root_authority;
    root.authority = ctx.accounts.authority.key();
    root.role_count = 0;
    root.permission_count = 0;
    root.bump = ctx.bumps.root_authority;

    msg!(
        "SolGuard: Root authority initialized for {}",
        root.authority
    );

    Ok(())
}