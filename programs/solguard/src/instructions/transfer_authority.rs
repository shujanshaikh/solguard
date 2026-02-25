use anchor_lang::prelude::*;

use crate::errors::RbacError;
use crate::state::RootAuthority;

#[derive(Accounts)]
pub struct TransferAuthority<'info> {
    #[account(
        mut,
        seeds = [RootAuthority::SEED_PREFIX, authority.key().as_ref()],
        bump = root_authority.bump,
        has_one = authority @ RbacError::NotRootAuthority,
    )]
    pub root_authority: Account<'info, RootAuthority>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

pub fn handler(ctx: Context<TransferAuthority>, new_authority: Pubkey) -> Result<()> {
    let root = &mut ctx.accounts.root_authority;
    let old_authority = root.authority;

    root.authority = new_authority;

    msg!(
        "SolGuard: Authority transferred from {} to {}",
        old_authority,
        new_authority
    );

    Ok(())
}
