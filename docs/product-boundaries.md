# Oremea product boundaries

Oremea is one application containing several deliberately separated products. Product separation is primarily enforced by host routing, route namespaces, API namespaces, data namespaces, and product-owned UI/code. A separate repository or database is not required merely because a surface is a separate product.

## Product ownership

| Product | Public host / surface | Primary route ownership |
| --- | --- | --- |
| Recognition | `recognition.oremea.com` | `/recognition/*` |
| Resonance | `resonance.oremea.com` | `/entry`, `/resonance/*` |
| Compass | `compass.oremea.com` | `/compass/*` |
| Harmonize | Oremea application | `/harmonize/*` |
| WORKS | Oremea application | `/works/*`, `/api/works/*` |

`middleware.ts` is the canonical host-boundary map for Recognition, Resonance, and Compass. Cross-product legacy/internal paths should redirect to the product that owns them rather than render another product under the wrong host.

## Boundary rules

1. New product UI belongs in that product's route tree or a clearly named shared component.
2. New product APIs belong in the product's API namespace where one exists.
3. New product-specific database models should use a clear product namespace. WORKS uses `works_*` models; Compass uses `compass_*` models.
4. Shared infrastructure may remain shared when it is genuinely platform-level: Clerk/authentication, Prisma connection infrastructure, common legal/public pages, and reusable UI primitives.
5. Do not add generic diagnostic routes such as `/db-test` or `/api/db-test` to deployed application code. Diagnostics should be local, authenticated/admin-scoped, or implemented through deployment tooling.
6. Do not create repository-root backup source files or committed build logs. Git history is the source backup; generated logs remain local and ignored.
7. Product-specific assets should move toward explicit product-owned paths when references can be migrated safely. Asset relocation is hygiene and should not be mixed into unrelated product logic changes.
8. A product should become a separate repository/database only when an operational requirement justifies physical isolation (for example independent deployment/runtime, scaling, ownership, regulatory isolation, or materially different technology).

## Known intentional exceptions

- Resonance's source page currently lives at `app/(member)/entry/page.tsx`. The public ownership is still Resonance because middleware protects and rewrites the Resonance host to `/entry`, while stray `/entry` traffic is redirected toward Resonance. Moving the source file is optional naming cleanup, not a product-boundary requirement.
- Oremea products currently share the Prisma datasource. Logical product namespaces remain the controlling separation until physical datastore isolation has a concrete operational benefit.
- Sustain is a separate Expo application and lives in its own repository. Its repository boundary is intentional.

## Cleanup discipline

Before changing a deployed boundary, verify the current host route, route ownership, authorization path, data namespace, and deployment target. Prefer small boundary-preserving changes over broad reorganizations of working production code.
