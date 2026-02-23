use anchor_lang::prelude::*;

#[account]
pub struct Permission {
    pub root: Pubkey,
    pub bump: u8,
}

impl Permission {
    pub const SPACE: usize = 8 + // discriminator
     32 + // root
     1; // bump

    pub const SEED_PREFIX: &'static [u8] = b"permission";
}
