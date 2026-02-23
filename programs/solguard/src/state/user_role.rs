use anchor_lang::prelude::*;

#[account]
pub struct UserRole {
    // the user wallet that holds this role
    pub user: Pubkey,
    // the role granted to the user
    pub role: Pubkey,
    // the root authority this assignment belongs to
    pub root: Pubkey,
    // the authority that granted this role
    pub granted_by: Pubkey,
    // unix timestamp after which this role is considered expired
    // a value of -1 means the role never expires
    pub expires_at: i64,
    // pda bump seed
    pub bump: u8,
}

impl UserRole {
    pub const SPACE: usize =
    8 + // discriminator
    32 + // user
    32 + // role
    32 + // root
    32 + // granted_by
    8 + // expires_at
    1; // bump

    pub const SEED_PREFIX: &'static [u8] = b"user_role";

    pub fn is_expired(&self, current_timestamp: i64) -> bool {
        self.expires_at != -1 && current_timestamp > self.expires_at
    }
}
