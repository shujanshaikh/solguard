use anchor_lang::prelude::*;

#[error_code]
pub enum RbacError {
    #[msg("You are not authorized to perform this action")]
    Unauthorized,

    #[msg("A role with this name already exists")]
    RoleAlreadyExists,

    #[msg("A permission with this name already exists")]
    PermissionAlreadyExists,

    #[msg("The specified role was not found")]
    RoleNotFound,

    #[msg("The specified permission was not found")]
    PermissionNotFound,

    #[msg("The user's role assignment has expired")]
    RoleExpired,

    #[msg("Only the root authority can perform this action")]
    NotRootAuthority,

    #[msg("This permission is already assigned to the role")]
    RolePermissionAlreadyAssigned,

    #[msg("This role is already assigned to the user")]
    UserRoleAlreadyAssigned,

    #[msg("The role does not belong to this root authority")]
    RoleMismatch,

    #[msg("The permission does not belong to this root authority")]
    PermissionMismatch,

    #[msg("The user role does not match the expected user")]
    UserMismatch,

    #[msg("The role permission link does not match the expected permission")]
    RolePermissionMismatch,

    #[msg("Arithmetic Error")]
    ArithmeticError,
}
