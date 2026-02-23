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
}
