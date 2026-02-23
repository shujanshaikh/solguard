use anchor_lang::prelude::*;

#[account]
pub struct Role {
    pub root: Pubkey,
    pub bump: u8,
}

impl Role {
    pub const SPACE: usize = 8 + // discriminator
    32 + // root
    1; // bump

    pub const SEED_PREFIX: &'static [u8] = b"role";
}
