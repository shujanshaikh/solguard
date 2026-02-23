use anchor_lang::prelude::*;

#[account]
pub struct RootAuthority {
    // the authority that controls this rbac instance
    pub authority: Pubkey,
    // total roles created
    pub role_count: u64,
    // total permissions created
    pub permission_count: u64,
    pub bump: u8,
}

impl RootAuthority {
    pub const SPACE: usize = 
    8 + // discriminator
    32 + // authority
    8 + // role_count
    8 + // permission_count
    1; // bump

    pub const SEED_PREFIX: &'static [u8] = b"root";
}
