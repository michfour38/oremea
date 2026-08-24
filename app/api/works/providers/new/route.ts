import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

function clean(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70) || "provider";
}

async function uniqueSlug(name: string) {
  const base = slugify(name);
  let slug = base;
  let suffix = 2;
  while (await prisma.works_providers.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to add a provider business." }, { status: 401 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const name = clean(body?.name);
  if (!name || name.length < 2) return NextResponse.json({ error: "Add your business name." }, { status: 400 });

  const marketSlug = clean(body?.marketSlug) ?? "za";
  const market = await prisma.works_markets.findUnique({ where: { slug: marketSlug }, select: { id: true, slug: true } });
  if (!market) return NextResponse.json({ error: "This WORKS market is not available yet." }, { status: 400 });

  const existingMembership = await prisma.works_provider_memberships.findFirst({
    where: { clerk_user_id: userId, active: true },
    select: { provider: { select: { id: true, name: true, slug: true } } },
  });

  const duplicate = await prisma.works_providers.findFirst({
    where: { name: { equals: name, mode: "insensitive" }, profile_status: { not: "ARCHIVED" } },
    select: { id: true, name: true, slug: true },
  });
  if (duplicate) {
    return NextResponse.json({
      error: `${duplicate.name} already appears to be on WORKS. Connect that existing profile instead of creating a duplicate.`,
      existingProvider: duplicate,
    }, { status: 409 });
  }

  const slug = await uniqueSlug(name);
  const provider = await prisma.$transaction(async (tx) => {
    const created = await tx.works_providers.create({
      data: {
        name,
        slug,
        legal_name: clean(body?.legalName),
        website: clean(body?.website),
        email: clean(body?.email),
        phone: clean(body?.phone),
        description: clean(body?.description),
        profile_status: "CLAIMED",
        memberships: { create: { clerk_user_id: userId, role: "OWNER" } },
        commercial_profile: { create: {} },
        public_settings: { create: {} },
        markets: {
          create: {
            market_id: market.id,
            administrative_area: clean(body?.administrativeArea),
            locality: clean(body?.locality),
            serves_nationally: body?.servesNationally === true,
            accepts_remote_clients: body?.acceptsRemoteClients === true,
            active: true,
          },
        },
      },
      select: { id: true, name: true, slug: true },
    });
    return created;
  });

  return NextResponse.json({
    provider,
    message: "Your WORKS provider profile is created. You can now decide what becomes public and add the operational information WORKS uses privately for matching and demand generation.",
    hadExistingMembership: Boolean(existingMembership),
  });
}