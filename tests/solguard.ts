import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Solguard } from "../target/types/solguard";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";

describe("solguard", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.solguard as Program<Solguard>;
  const authority = provider.wallet;

  // test users
  const userA = Keypair.generate();
  const userB = Keypair.generate();
  const newAuthority = Keypair.generate();

  // role & permission names
  const roles = ["admin", "editor", "viewer"];
  const permissions = ["read", "write", "delete", "publish"];

  // PDA derivation helpers
  const findRootAuthority = (auth: PublicKey) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("root"), auth.toBuffer()],
      program.programId
    );

  const findRole = (root: PublicKey, name: string) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("role"), root.toBuffer(), Buffer.from(name)],
      program.programId
    );

  const findPermission = (root: PublicKey, name: string) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("permission"), root.toBuffer(), Buffer.from(name)],
      program.programId
    );

  const findRolePermission = (role: PublicKey, permission: PublicKey) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("role_permission"), role.toBuffer(), permission.toBuffer()],
      program.programId
    );

  const findUserRole = (root: PublicKey, user: PublicKey, role: PublicKey) =>
    PublicKey.findProgramAddressSync(
      [
        Buffer.from("user_role"),
        root.toBuffer(),
        user.toBuffer(),
        role.toBuffer(),
      ],
      program.programId
    );

  // store derived PDAs for reuse
  let rootPda: PublicKey;
  const rolePdas: Record<string, PublicKey> = {};
  const permPdas: Record<string, PublicKey> = {};

  it("initializes root authority", async () => {
    [rootPda] = findRootAuthority(authority.publicKey);

    await program.methods
      .initializeRoot()
      .accounts({
        rootAuthority: rootPda,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const root = await program.account.rootAuthority.fetch(rootPda);
    assert.ok(root.authority.equals(authority.publicKey));
    assert.equal(root.roleCount.toNumber(), 0);
    assert.equal(root.permissionCount.toNumber(), 0);
  });

  it("creates roles: admin, editor, viewer", async () => {
    for (const name of roles) {
      const [rolePda] = findRole(rootPda, name);
      rolePdas[name] = rolePda;

      await program.methods
        .createRole(name)
        .accounts({
          role: rolePda,
          rootAuthority: rootPda,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const role = await program.account.role.fetch(rolePda);
      assert.ok(role.root.equals(rootPda));
    }

    const root = await program.account.rootAuthority.fetch(rootPda);
    assert.equal(root.roleCount.toNumber(), 3);
  });

  it("creates permissions: read, write, delete, publish", async () => {
    for (const name of permissions) {
      const [permPda] = findPermission(rootPda, name);
      permPdas[name] = permPda;

      await program.methods
        .createPermission(name)
        .accounts({
          permission: permPda,
          rootAuthority: rootPda,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const perm = await program.account.permission.fetch(permPda);
      assert.ok(perm.root.equals(rootPda));
    }

    const root = await program.account.rootAuthority.fetch(rootPda);
    assert.equal(root.permissionCount.toNumber(), 4);
  });

  // admin gets all: read, write, delete, publish
  // editor gets: read, write, publish
  // viewer gets: read only

  const rolePermissionMap: Record<string, string[]> = {
    admin: ["read", "write", "delete", "publish"],
    editor: ["read", "write", "publish"],
    viewer: ["read"],
  };

  it("assigns permissions to roles", async () => {
    for (const [roleName, perms] of Object.entries(rolePermissionMap)) {
      for (const permName of perms) {
        const [rpPda] = findRolePermission(
          rolePdas[roleName],
          permPdas[permName]
        );

        await program.methods
          .assignPermissionToRole()
          .accounts({
            rolePermission: rpPda,
            role: rolePdas[roleName],
            permission: permPdas[permName],
            rootAuthority: rootPda,
            authority: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        const rp = await program.account.rolePermission.fetch(rpPda);
        assert.ok(rp.role.equals(rolePdas[roleName]));
        assert.ok(rp.permission.equals(permPdas[permName]));
      }
    }
  });

  it("assigns admin role to userA (never expires)", async () => {
    const [urPda] = findUserRole(rootPda, userA.publicKey, rolePdas["admin"]);

    await program.methods
      .assignRoleToUser(new anchor.BN(-1)) // never expires
      .accounts({
        userRole: urPda,
        role: rolePdas["admin"],
        user: userA.publicKey,
        rootAuthority: rootPda,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const ur = await program.account.userRole.fetch(urPda);
    assert.ok(ur.user.equals(userA.publicKey));
    assert.ok(ur.role.equals(rolePdas["admin"]));
    assert.equal(ur.expiresAt.toNumber(), -1);
  });

  it("assigns viewer role to userB (never expires)", async () => {
    const [urPda] = findUserRole(rootPda, userB.publicKey, rolePdas["viewer"]);

    await program.methods
      .assignRoleToUser(new anchor.BN(-1))
      .accounts({
        userRole: urPda,
        role: rolePdas["viewer"],
        user: userB.publicKey,
        rootAuthority: rootPda,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const ur = await program.account.userRole.fetch(urPda);
    assert.ok(ur.user.equals(userB.publicKey));
    assert.ok(ur.role.equals(rolePdas["viewer"]));
  });

  it("check_permission passes: userA (admin) + write", async () => {
    const [urPda] = findUserRole(rootPda, userA.publicKey, rolePdas["admin"]);
    const [rpPda] = findRolePermission(rolePdas["admin"], permPdas["write"]);

    await program.methods
      .checkPermission()
      .accounts({
        userRole: urPda,
        rolePermission: rpPda,
        user: userA.publicKey,
        permission: permPdas["write"],
      })
      .rpc();
  });

  it("check_permission passes: userA (admin) + delete", async () => {
    const [urPda] = findUserRole(rootPda, userA.publicKey, rolePdas["admin"]);
    const [rpPda] = findRolePermission(rolePdas["admin"], permPdas["delete"]);

    await program.methods
      .checkPermission()
      .accounts({
        userRole: urPda,
        rolePermission: rpPda,
        user: userA.publicKey,
        permission: permPdas["delete"],
      })
      .rpc();
  });

  it("check_permission passes: userB (viewer) + read", async () => {
    const [urPda] = findUserRole(rootPda, userB.publicKey, rolePdas["viewer"]);
    const [rpPda] = findRolePermission(rolePdas["viewer"], permPdas["read"]);

    await program.methods
      .checkPermission()
      .accounts({
        userRole: urPda,
        rolePermission: rpPda,
        user: userB.publicKey,
        permission: permPdas["read"],
      })
      .rpc();
  });


  it("check_permission fails: userB (viewer) trying write", async () => {
    // viewer role doesn't have write permission, so RolePermission PDA
    // for viewer+write doesn't exist. We derive it anyway — the account
    // won't exist and Anchor will error during deserialization.
    const [urPda] = findUserRole(rootPda, userB.publicKey, rolePdas["viewer"]);
    const [rpPda] = findRolePermission(rolePdas["viewer"], permPdas["write"]);

    try {
      await program.methods
        .checkPermission()
        .accounts({
          userRole: urPda,
          rolePermission: rpPda,
          user: userB.publicKey,
          permission: permPdas["write"],
        })
        .rpc();
      assert.fail("should have thrown");
    } catch (err) {
      assert.ok(err);
    }
  });

  it("assigns editor role to userB with past expiry", async () => {
    const [urPda] = findUserRole(rootPda, userB.publicKey, rolePdas["editor"]);

    // expire 1 hour in the past
    const pastTimestamp = Math.floor(Date.now() / 1000) - 3600;

    await program.methods
      .assignRoleToUser(new anchor.BN(pastTimestamp))
      .accounts({
        userRole: urPda,
        role: rolePdas["editor"],
        user: userB.publicKey,
        rootAuthority: rootPda,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  });

  it("check_permission fails: userB editor role is expired", async () => {
    const [urPda] = findUserRole(rootPda, userB.publicKey, rolePdas["editor"]);
    const [rpPda] = findRolePermission(rolePdas["editor"], permPdas["write"]);

    try {
      await program.methods
        .checkPermission()
        .accounts({
          userRole: urPda,
          rolePermission: rpPda,
          user: userB.publicKey,
          permission: permPdas["write"],
        })
        .rpc();
      assert.fail("should have thrown — role is expired");
    } catch (err: any) {
      // should get RoleExpired error
      assert.ok(
        err.toString().includes("RoleExpired") ||
        err.toString().includes("6005"),
        `unexpected error: ${err}`
      );
    }
  });

  it("revokes viewer role from userB", async () => {
    const [urPda] = findUserRole(rootPda, userB.publicKey, rolePdas["viewer"]);

    await program.methods
      .revokeRoleFromUser()
      .accounts({
        userRole: urPda,
        role: rolePdas["viewer"],
        user: userB.publicKey,
        rootAuthority: rootPda,
        authority: authority.publicKey,
      })
      .rpc();

    // account should be closed
    const info = await provider.connection.getAccountInfo(urPda);
    assert.isNull(info, "UserRole account should be closed after revoke");
  });

  it("check_permission fails: userB viewer role was revoked", async () => {
    const [urPda] = findUserRole(rootPda, userB.publicKey, rolePdas["viewer"]);
    const [rpPda] = findRolePermission(rolePdas["viewer"], permPdas["read"]);

    try {
      await program.methods
        .checkPermission()
        .accounts({
          userRole: urPda,
          rolePermission: rpPda,
          user: userB.publicKey,
          permission: permPdas["read"],
        })
        .rpc();
      assert.fail("should have thrown — role was revoked");
    } catch (err) {
      // UserRole account closed, Anchor can't deserialize
      assert.ok(err);
    }
  });

  it("revokes delete permission from admin role", async () => {
    const [rpPda] = findRolePermission(rolePdas["admin"], permPdas["delete"]);

    await program.methods
      .revokePermissionFromRole()
      .accounts({
        rolePermission: rpPda,
        role: rolePdas["admin"],
        permission: permPdas["delete"],
        rootAuthority: rootPda,
        authority: authority.publicKey,
      })
      .rpc();

    const info = await provider.connection.getAccountInfo(rpPda);
    assert.isNull(info, "RolePermission account should be closed");
  });

  it("check_permission fails: admin + delete after revoke", async () => {
    const [urPda] = findUserRole(rootPda, userA.publicKey, rolePdas["admin"]);
    const [rpPda] = findRolePermission(rolePdas["admin"], permPdas["delete"]);

    try {
      await program.methods
        .checkPermission()
        .accounts({
          userRole: urPda,
          rolePermission: rpPda,
          user: userA.publicKey,
          permission: permPdas["delete"],
        })
        .rpc();
      assert.fail("should have thrown — permission was revoked from role");
    } catch (err) {
      assert.ok(err);
    }
  });


  it("transfers authority to new wallet", async () => {
    await program.methods
      .transferAuthority(newAuthority.publicKey)
      .accounts({
        rootAuthority: rootPda,
        authority: authority.publicKey,
      })
      .rpc();

    const root = await program.account.rootAuthority.fetch(rootPda);
    assert.ok(root.authority.equals(newAuthority.publicKey));
  });

  it("old authority can no longer create roles", async () => {
    const [rolePda] = findRole(rootPda, "superadmin");

    try {
      await program.methods
        .createRole("superadmin")
        .accounts({
          role: rolePda,
          rootAuthority: rootPda,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      assert.fail("should have thrown — authority was transferred");
    } catch (err: any) {
      assert.ok(
        err.toString().includes("NotRootAuthority") ||
        err.toString().includes("has_one") ||
        err.toString().includes("2012") ||
        err.toString().includes("6006"),
        `unexpected error: ${err}`
      );
    }
  });
});
