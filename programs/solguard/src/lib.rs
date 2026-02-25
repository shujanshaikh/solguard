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

    pub fn assign_permission_to_role(ctx: Context<AssignPermissionToRole>) -> Result<()> {
        instructions::assign_permission_to_role::handler(ctx)
    }

    pub fn revoke_permission_from_role(ctx: Context<RevokePermissionFromRole>) -> Result<()> {
        instructions::revoke_permission_from_role::handler(ctx)
    }

    pub fn assign_role_to_user(ctx: Context<AssignRoleToUser>, expires_at: i64) -> Result<()> {
        instructions::assign_role_to_user::handler(ctx, expires_at)
    }

    pub fn revoke_role_from_user(ctx: Context<RevokeRoleFromUser>) -> Result<()> {
        instructions::revoke_role_from_user::handler(ctx)
    }

    pub fn check_permission(ctx: Context<CheckPermission>) -> Result<()> {
        instructions::check_permission::handler(ctx)
    }

    pub fn transfer_authority(ctx: Context<TransferAuthority>, new_authority: Pubkey) -> Result<()> {
        instructions::transfer_authority::handler(ctx, new_authority)
    }
}
