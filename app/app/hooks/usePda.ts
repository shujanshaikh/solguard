"use client";

import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "./useProgram";

export function findRootAuthority(authority: PublicKey) {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("root"), authority.toBuffer()],
        PROGRAM_ID
    );
}

export function findRole(root: PublicKey, name: string) {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("role"), root.toBuffer(), Buffer.from(name)],
        PROGRAM_ID
    );
}

export function findPermission(root: PublicKey, name: string) {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("permission"), root.toBuffer(), Buffer.from(name)],
        PROGRAM_ID
    );
}

export function findRolePermission(role: PublicKey, permission: PublicKey) {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("role_permission"), role.toBuffer(), permission.toBuffer()],
        PROGRAM_ID
    );
}

export function findUserRole(
    root: PublicKey,
    user: PublicKey,
    role: PublicKey
) {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from("user_role"),
            root.toBuffer(),
            user.toBuffer(),
            role.toBuffer(),
        ],
        PROGRAM_ID
    );
}
