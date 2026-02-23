use anchor_lang::prelude::*;

// A join table account that binds a Permission to a Role
// Its existence proves the role has the permission — closing it revokes.
#[account]
pub struct RolePermission {
    pub role: Pubkey,
    pub permission: Pubkey,
    pub bump: u8,
}

impl RolePermission {
    pub const SPACE: usize = 
    8 + // discriminator
    32 + // role
    32 + // permission
    1; // bump

    pub const SEED_PREFIX: &'static [u8] = b"role_permission";
}
