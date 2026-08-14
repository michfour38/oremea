# Oremea product boundaries

Oremea is one application containing several deliberately separated products. Product separation is primarily enforced by host routing, route namespaces, API namespaces, data namespaces, and product-owned UI/code. A separate repository or database is not required merely because a surface is a separate product.

## Product ownership

| Product | Product job | Public host / surface | Primary route ownership |
| --- | --- | --- | --- |
| Recognition | Ongoing recursive accountability conversation: help me see myself clearly and stay accountable to my own words without directing movement | `recognition.oremea.com` | `/recognition/*`, `/api/recognition/*` |
| Resonance | Contained reflection: help me stay with what becomes visible | `resonance.oremea.com` | `/entry`, `/resonance/*` |
| Compass | Direction and participation: help me move; conversation-surfaced Map plus participant-owned daily goals | `compass.oremea.com` | `/compass/*`, `/api/compass/*` |
| Harmonize | Relational repair and connection | Oremea application | `/harmonize/*` |
| WORKS | Provider and marketplace participation | Oremea application | `/works/*`, `/api/works/*` |

Recognition, Resonance, and Compass are complementary but independent containers. Do not encode a compulsory progression between them. Recognition must not become early Compass: it may reflect evidence, recurrence, contradiction, attribution, responsibility, desire, boundary, and consequence, but it does not turn clarity into an action plan. Compass owns direction, decisions, Map movement, and participant-chosen goals.

`middleware.ts` is the canonical host-boundary map for Recognition, Resonance, and Compass. Cross-product legacy/internal paths should redirect to the product that owns them rather than render another product under the wrong host.

## Boundary rules

1. New product UI belongs in that product's route tree or a clearly named shared component.
2. New product APIs belong in the product's API namespace where one exists.
3. New product-specific database models should use a clear product namespace. WORKS uses `works_*` models; Compass uses `compass_*` models; Recognition conversation data uses `recognition_*` models.
4. Shared infrastructure may remain shared when it is genuinely platform-level: Clerk/authentication, Prisma connection infrastructure, common legal/public pages, and reusable UI primitives.
5. Do not add generic diagnostic routes such as `/db-test` or `/api/db-test` to deployed application code. Diagnostics should be local, authenticated/admin-scoped, or implemented through deployment tooling. Any exceptional release-only endpoint must be narrowly scoped, self-expiring, verified, and removed immediately after use.
6. Do not create repository-root backup source files or committed build logs. Git history is the source backup; generated logs remain local and ignored.
7. Product-specific assets should move toward explicit product-owned paths when references can be migrated safely. Asset relocation is hygiene and should not be mixed into unrelated product logic changes.
8. A product should become a separate repository/database only when an operational requirement justifies physical isolation, such as independent deployment/runtime, scaling, ownership, regulatory isolation, or materially different technology.
9. Participant-authored data must retain participant authority. In Compass, daily goals live separately from AI-generated Map state so a conversation refresh cannot silently rewrite, delete, or claim ownership of them.
10. Pricing has one source of truth: `src/lib/oremea/pricing.ts`. Product modules and public surfaces reference that registry rather than defining local numeric prices.

## Known intentional exceptions

- Resonance's source page currently lives at `app/(member)/entry/page.tsx`. The public ownership is still Resonance because middleware protects and rewrites the Resonance host to `/entry`, while stray `/entry` traffic is redirected toward Resonance. Moving the source file is optional naming cleanup, not a product-boundary requirement.
- Oremea products currently share the Prisma datasource. Logical product namespaces remain the controlling separation until physical datastore isolation has a concrete operational benefit.
- Sustain is a separate Expo application and lives in its own repository. Its repository boundary is intentional.

## Cleanup discipline

Before changing a deployed boundary, verify the current host route, route ownership, authorization path, data namespace, and deployment target. Prefer small boundary-preserving changes over broad reorganizations of working production code.
