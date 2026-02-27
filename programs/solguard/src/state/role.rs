use anchor_lang::prelude::*;

#[account]
pub struct Role {
    pub root: Pubkey,
    pub name: String,
    pub bump: u8,
}

impl Role {
    pub const MAX_NAME_LEN: usize = 32;

    pub const SPACE: usize = 8 + // discriminator
    32 + // root
    4 + Self::MAX_NAME_LEN + // name (4-byte len prefix + max chars)
    1; // bump

    pub const SEED_PREFIX: &'static [u8] = b"role";
}
