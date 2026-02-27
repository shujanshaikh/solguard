/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/solguard.json`.
 */
export type Solguard = {
  "address": "72YkKhqgzgue7niCaYs2QxQC3iLfUXGFMbo3yZ5K6d3Q",
  "metadata": {
    "name": "solguard",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "assignPermissionToRole",
      "discriminator": [
        118,
        239,
        224,
        150,
        110,
        141,
        96,
        106
      ],
      "accounts": [
        {
          "name": "rolePermission",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  108,
                  101,
                  95,
                  112,
                  101,
                  114,
                  109,
                  105,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "role"
              },
              {
                "kind": "account",
                "path": "permission"
              }
            ]
          }
        },
        {
          "name": "role"
        },
        {
          "name": "permission"
        },
        {
          "name": "rootAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  111,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "rootAuthority"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "assignRoleToUser",
      "discriminator": [
        209,
        71,
        156,
        113,
        179,
        171,
        92,
        196
      ],
      "accounts": [
        {
          "name": "userRole",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  114,
                  111,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "rootAuthority"
              },
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "role"
              }
            ]
          }
        },
        {
          "name": "role"
        },
        {
          "name": "user"
        },
        {
          "name": "rootAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  111,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "rootAuthority"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "expiresAt",
          "type": "i64"
        }
      ]
    },
    {
      "name": "checkPermission",
      "discriminator": [
        154,
        199,
        232,
        242,
        96,
        72,
        197,
        236
      ],
      "accounts": [
        {
          "name": "userRole"
        },
        {
          "name": "rolePermission"
        },
        {
          "name": "user"
        },
        {
          "name": "permission"
        }
      ],
      "args": []
    },
    {
      "name": "createPermission",
      "discriminator": [
        190,
        182,
        26,
        164,
        156,
        221,
        8,
        0
      ],
      "accounts": [
        {
          "name": "permission",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  101,
                  114,
                  109,
                  105,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "rootAuthority"
              },
              {
                "kind": "arg",
                "path": "permissionName"
              }
            ]
          }
        },
        {
          "name": "rootAuthority",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  111,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "rootAuthority"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "permissionName",
          "type": "string"
        }
      ]
    },
    {
      "name": "createRole",
      "discriminator": [
        170,
        147,
        127,
        223,
        222,
        112,
        205,
        163
      ],
      "accounts": [
        {
          "name": "role",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "rootAuthority"
              },
              {
                "kind": "arg",
                "path": "roleName"
              }
            ]
          }
        },
        {
          "name": "rootAuthority",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  111,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "rootAuthority"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "roleName",
          "type": "string"
        }
      ]
    },
    {
      "name": "initializeRoot",
      "discriminator": [
        215,
        103,
        206,
        228,
        186,
        88,
        211,
        28
      ],
      "accounts": [
        {
          "name": "rootAuthority",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  111,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "revokePermissionFromRole",
      "discriminator": [
        37,
        123,
        68,
        182,
        2,
        116,
        77,
        147
      ],
      "accounts": [
        {
          "name": "rolePermission",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  108,
                  101,
                  95,
                  112,
                  101,
                  114,
                  109,
                  105,
                  115,
                  115,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "role"
              },
              {
                "kind": "account",
                "path": "permission"
              }
            ]
          }
        },
        {
          "name": "role",
          "relations": [
            "rolePermission"
          ]
        },
        {
          "name": "permission",
          "relations": [
            "rolePermission"
          ]
        },
        {
          "name": "rootAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  111,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "rootAuthority"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "revokeRoleFromUser",
      "discriminator": [
        184,
        233,
        178,
        200,
        157,
        180,
        135,
        154
      ],
      "accounts": [
        {
          "name": "userRole",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  114,
                  111,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "rootAuthority"
              },
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "account",
                "path": "role"
              }
            ]
          }
        },
        {
          "name": "role",
          "relations": [
            "userRole"
          ]
        },
        {
          "name": "user",
          "relations": [
            "userRole"
          ]
        },
        {
          "name": "rootAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  111,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "rootAuthority"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "transferAuthority",
      "discriminator": [
        48,
        169,
        76,
        72,
        229,
        180,
        55,
        161
      ],
      "accounts": [
        {
          "name": "rootAuthority",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  111,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "rootAuthority"
          ]
        }
      ],
      "args": [
        {
          "name": "newAuthority",
          "type": "pubkey"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "permission",
      "discriminator": [
        224,
        83,
        28,
        79,
        10,
        253,
        161,
        28
      ]
    },
    {
      "name": "role",
      "discriminator": [
        46,
        219,
        197,
        24,
        233,
        249,
        253,
        154
      ]
    },
    {
      "name": "rolePermission",
      "discriminator": [
        41,
        223,
        214,
        74,
        223,
        227,
        184,
        209
      ]
    },
    {
      "name": "rootAuthority",
      "discriminator": [
        136,
        10,
        202,
        252,
        76,
        4,
        102,
        6
      ]
    },
    {
      "name": "userRole",
      "discriminator": [
        62,
        252,
        194,
        137,
        183,
        165,
        147,
        28
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "unauthorized",
      "msg": "You are not authorized to perform this action"
    },
    {
      "code": 6001,
      "name": "roleAlreadyExists",
      "msg": "A role with this name already exists"
    },
    {
      "code": 6002,
      "name": "permissionAlreadyExists",
      "msg": "A permission with this name already exists"
    },
    {
      "code": 6003,
      "name": "roleNotFound",
      "msg": "The specified role was not found"
    },
    {
      "code": 6004,
      "name": "permissionNotFound",
      "msg": "The specified permission was not found"
    },
    {
      "code": 6005,
      "name": "roleExpired",
      "msg": "The user's role assignment has expired"
    },
    {
      "code": 6006,
      "name": "notRootAuthority",
      "msg": "Only the root authority can perform this action"
    },
    {
      "code": 6007,
      "name": "rolePermissionAlreadyAssigned",
      "msg": "This permission is already assigned to the role"
    },
    {
      "code": 6008,
      "name": "userRoleAlreadyAssigned",
      "msg": "This role is already assigned to the user"
    },
    {
      "code": 6009,
      "name": "roleMismatch",
      "msg": "The role does not belong to this root authority"
    },
    {
      "code": 6010,
      "name": "permissionMismatch",
      "msg": "The permission does not belong to this root authority"
    },
    {
      "code": 6011,
      "name": "userMismatch",
      "msg": "The user role does not match the expected user"
    },
    {
      "code": 6012,
      "name": "rolePermissionMismatch",
      "msg": "The role permission link does not match the expected permission"
    },
    {
      "code": 6013,
      "name": "arithmeticError",
      "msg": "Arithmetic Error"
    }
  ],
  "types": [
    {
      "name": "permission",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "root",
            "type": "pubkey"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "role",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "root",
            "type": "pubkey"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "rolePermission",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "role",
            "type": "pubkey"
          },
          {
            "name": "permission",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "rootAuthority",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "roleCount",
            "type": "u64"
          },
          {
            "name": "permissionCount",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "userRole",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "role",
            "type": "pubkey"
          },
          {
            "name": "root",
            "type": "pubkey"
          },
          {
            "name": "grantedBy",
            "type": "pubkey"
          },
          {
            "name": "expiresAt",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
