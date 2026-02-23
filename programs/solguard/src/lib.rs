use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("72YkKhqgzgue7niCaYs2QxQC3iLfUXGFMbo3yZ5K6d3Q");

#[program]
pub mod solguard {
    use super::*;

    pub fn initialize_root(ctx: Context<InitializeRoot>) -> Result<()> {
        instructions::initialize_root::handler(ctx)
    }

    pub fn create_role(ctx: Context<CreateRole>, role_name: String) -> Result<()> {
        instructions::create_role::handler(ctx, role_name)
    }

    pub fn create_permission(ctx: Context<CreatePermission>, permission_name: String) -> Result<()> {
        instructions::create_permission::handler(ctx, permission_name)
    }
}
