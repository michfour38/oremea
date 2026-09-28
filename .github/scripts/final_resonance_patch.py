from pathlib import Path
import json


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f"{label} not found")
    return text.replace(old, new, 1)


Path("src/lib/resonance/room-entry.ts").write_text('''export const RESONANCE_ROOM_NAMES: Record<number, string> = {
  1: "The Hearth",
  2: "The Mirror",
  3: "The Garden",
  4: "The Bearing",
  5: "The Pulse",
  6: "The Shadow",
  7: "The Forge",
  8: "The Vision",
  9: "The Gathering",
  10: "The Becoming",
};

// A room link selects a card only. Purchased runs remain the access authority.
export function getResonanceRoomTarget(room: string | string[] | undefined) {
  if (typeof room !== "string" || !/^(?:[1-9]|10)$/.test(room)) return null;

  const weekNumber = Number(room);
  return {
    weekNumber,
    name: RESONANCE_ROOM_NAMES[weekNumber],
    entryPath: `/entry?room=${room}`,
  };
}
''')

path = Path("app/(marketing)/resonance/enter/page.tsx")
text = path.read_text()
text = replace_once(
    text,
    'import { RESONANCE_ROOM_MARKETING } from "@/src/lib/oremea/public-product-marketing";\n',
    'import { RESONANCE_ROOM_MARKETING } from "@/src/lib/oremea/public-product-marketing";\nimport { RESONANCE_ROOM_NAMES } from "@/src/lib/resonance/room-entry";\n',
    "public room names import",
)
old = '''          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {RESONANCE_ROOM_MARKETING.map((room) => (
              <article
                key={room.id}
                className="res-border res-panel flex h-full flex-col rounded-3xl border p-6 md:p-7"
              >
                <p className="res-accent text-xs uppercase tracking-[0.2em]">
                  Room {room.weekNumber}
                </p>
                <h3 className="res-text mt-3 font-serif text-2xl">
                  {room.headline}
                </h3>
                <p className="res-text-primary mt-4 text-sm leading-7">
                  {room.description}
                </p>
                <div className="mt-auto pt-6">
                  <div className="flex h-14 items-center border-l border-[var(--product-accent-border)] pl-4">
                    <p className="res-text-secondary line-clamp-2 text-sm leading-7">
                      {room.buyerDecision}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <FunnelAction
              href={entryHref}
              signedIn={Boolean(userId)}
              checkoutReady={funnelCheckoutEnabled}
            />
          </div>'''
new = '''          <div className="mt-10 space-y-4">
            {RESONANCE_ROOM_MARKETING.map((room) => {
              const roomName = RESONANCE_ROOM_NAMES[room.weekNumber];
              return (
                <details
                  key={room.id}
                  className="res-border res-panel group rounded-3xl border backdrop-blur-[2px]"
                >
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-5 px-6 py-5 md:px-7">
                    <div>
                      <p className="res-accent text-xs uppercase tracking-[0.2em]">
                        Room {room.weekNumber} · {roomName}
                      </p>
                      <h3 className="res-text mt-3 font-serif text-2xl">
                        {room.headline}
                      </h3>
                      <p className="res-text-secondary mt-3 text-sm leading-7">
                        {room.buyerDecision}
                      </p>
                    </div>
                    <span className="res-accent mt-1 shrink-0 transition group-open:rotate-180">↓</span>
                  </summary>

                  <div className="res-divider border-t px-6 py-6 md:px-7">
                    <div className="max-w-3xl">
                      <p className="res-text-primary text-sm leading-7">
                        {room.description}
                      </p>
                      <p className="res-text-secondary mt-4 text-sm leading-7">
                        <span className="res-accent font-medium">Enter this room when:</span>{" "}
                        {room.chooseWhen}
                      </p>
                    </div>

                    <Link
                      href={`/entry?room=${room.weekNumber}`}
                      className="res-action mt-6 inline-flex rounded-xl border px-5 py-2.5 text-sm font-medium transition"
                    >
                      Choose {roomName} →
                    </Link>
                  </div>
                </details>
              );
            })}
          </div>'''
text = replace_once(text, old, new, "public room grid")
path.write_text(text)

path = Path("app/(member)/entry/page.tsx")
text = path.read_text()
text = replace_once(
    text,
    'href={newCheckout ? "/resonance/visits" : `/resonance/purchase?week=${week.week_number}`}',
    'href={newCheckout ? `/resonance/visits?room=${week.week_number}` : `/resonance/purchase?week=${week.week_number}`}',
    "entry purchase href",
)
text = replace_once(
    text,
    '{newCheckout ? "Buy visits" : hasArchivedHistory',
    '{newCheckout ? `Choose visits for ${week.title}` : hasArchivedHistory',
    "entry purchase label",
)
path.write_text(text)

path = Path("app/(member)/resonance/visits/page.tsx")
text = path.read_text()
text = replace_once(
    text,
    'import { INITIAL_QUANTITIES, VISIT_PRICES } from "@/src/lib/resonance/visit-offers";\n',
    'import { INITIAL_QUANTITIES, VISIT_PRICES } from "@/src/lib/resonance/visit-offers";\nimport { getResonanceRoomTarget } from "@/src/lib/resonance/room-entry";\n',
    "visits room import",
)
old = '''export default async function VisitPurchasePage({ searchParams }: {
  searchParams: Promise<{ order?: string; error?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=%2Fresonance%2Fvisits");
  if (!(await visitCreditsAvailableFor(userId))) notFound();
  const query = await searchParams;
  const order = query.order ? await getVisitOrder(userId, query.order) : null;'''
new = '''export default async function VisitPurchasePage({ searchParams }: {
  searchParams: Promise<{ order?: string; error?: string; room?: string | string[] }>;
}) {
  const query = await searchParams;
  const roomTarget = getResonanceRoomTarget(query.room);
  const roomQuery = roomTarget ? `?room=${roomTarget.weekNumber}` : "";
  const roomSuffix = roomTarget ? `&room=${roomTarget.weekNumber}` : "";
  const { userId } = await auth();
  if (!userId) redirect(`/sign-in?redirect_url=${encodeURIComponent(`/resonance/visits${roomQuery}`)}`);
  if (!(await visitCreditsAvailableFor(userId))) notFound();
  const order = query.order ? await getVisitOrder(userId, query.order) : null;'''
text = replace_once(text, old, new, "visits header")
text = replace_once(
    text,
    'if (order?.status === "paid") redirect(`/resonance/complete?order=${order.id}`);',
    'if (order?.status === "paid") redirect(`/resonance/complete?order=${order.id}${roomSuffix}`);',
    "visits paid redirect",
)
text = replace_once(
    text,
    '              <input type="hidden" name="quantity" value={quantity} />\n',
    '              <input type="hidden" name="quantity" value={quantity} />\n              {roomTarget ? <input type="hidden" name="room" value={roomTarget.weekNumber} /> : null}\n',
    "visits room form input",
)
text = replace_once(
    text,
    '            data-whop-checkout-return-url={`${checkoutOrigin}/resonance/complete?order=${order.id}`} />',
    '            data-whop-checkout-return-url={`${checkoutOrigin}/resonance/complete?order=${order.id}${roomSuffix}`} />',
    "Whop return URL",
)
path.write_text(text)

path = Path("app/(member)/resonance/visits/actions.ts")
text = path.read_text()
text = replace_once(
    text,
    'import { visitCheckoutAvailableFor, visitCreditsAvailableFor } from "@/src/lib/resonance/visit-access";\n',
    'import { visitCheckoutAvailableFor, visitCreditsAvailableFor } from "@/src/lib/resonance/visit-access";\nimport { getResonanceRoomTarget } from "@/src/lib/resonance/room-entry";\n',
    "actions room import",
)
anchor = 'import { getResonanceRoomTarget } from "@/src/lib/resonance/room-entry";\n'
insert = '''
function formRoomTarget(form: FormData) {
  const room = form.get("room");
  return getResonanceRoomTarget(typeof room === "string" ? room : undefined);
}

function withRoom(path: string, weekNumber?: number) {
  if (!weekNumber) return path;
  return `${path}${path.includes("?") ? "&" : "?"}room=${weekNumber}`;
}
'''
text = replace_once(text, anchor, anchor + insert, "actions room helpers")
old = '''export async function purchaseVisits(form: FormData) {
  const user = await currentUser();
  if (!user) redirect("/sign-in?redirect_url=%2Fresonance%2Fvisits");
  if (!(await visitCheckoutAvailableFor(user.id))) redirect("/resonance/visits?error=unavailable");
  const email = user.emailAddresses.find((item) => item.id === user.primaryEmailAddressId);
  if (!email || email.verification?.status !== "verified") redirect("/resonance/visits?error=email");'''
new = '''export async function purchaseVisits(form: FormData) {
  const roomTarget = formRoomTarget(form);
  const user = await currentUser();
  if (!user) {
    const target = withRoom("/resonance/visits", roomTarget?.weekNumber);
    redirect(`/sign-in?redirect_url=${encodeURIComponent(target)}`);
  }
  if (!(await visitCheckoutAvailableFor(user.id))) redirect(withRoom("/resonance/visits?error=unavailable", roomTarget?.weekNumber));
  const email = user.emailAddresses.find((item) => item.id === user.primaryEmailAddressId);
  if (!email || email.verification?.status !== "verified") redirect(withRoom("/resonance/visits?error=email", roomTarget?.weekNumber));'''
text = replace_once(text, old, new, "purchaseVisits header")
text = replace_once(
    text,
    '  if (!orderId) redirect("/resonance/visits?error=checkout");\n  redirect(`/resonance/visits?order=${orderId}`);',
    '  if (!orderId) redirect(withRoom("/resonance/visits?error=checkout", roomTarget?.weekNumber));\n  redirect(withRoom(`/resonance/visits?order=${orderId}`, roomTarget?.weekNumber));',
    "purchaseVisits redirect",
)
old = '''export async function addVisits(form: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  if (!(await visitCheckoutAvailableFor(userId))) redirect("/entry");
  const parentId = String(form.get("orderId"));'''
new = '''export async function addVisits(form: FormData) {
  const roomTarget = formRoomTarget(form);
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  if (!(await visitCheckoutAvailableFor(userId))) redirect(roomTarget?.entryPath ?? "/entry");
  const parentId = String(form.get("orderId"));'''
text = replace_once(text, old, new, "addVisits header")
text = replace_once(
    text,
    '  if (!orderId) redirect(`/resonance/complete?order=${encodeURIComponent(parentId)}&error=addition`);\n  redirect(`/resonance/complete?order=${orderId}`);',
    '  if (!orderId) redirect(withRoom(`/resonance/complete?order=${encodeURIComponent(parentId)}&error=addition`, roomTarget?.weekNumber));\n  redirect(withRoom(`/resonance/complete?order=${orderId}`, roomTarget?.weekNumber));',
    "addVisits redirect",
)
old = '''export async function skipAddition(form: FormData) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  if (!(await visitCreditsAvailableFor(userId))) redirect("/entry");
  try { await declineVisitAddition(userId, String(form.get("orderId"))); } catch { /* Skipping never blocks purchased access. */ }
  redirect("/entry");
}'''
new = '''export async function skipAddition(form: FormData) {
  const roomTarget = formRoomTarget(form);
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  if (!(await visitCreditsAvailableFor(userId))) redirect(roomTarget?.entryPath ?? "/entry");
  try { await declineVisitAddition(userId, String(form.get("orderId"))); } catch { /* Skipping never blocks purchased access. */ }
  redirect(roomTarget?.entryPath ?? "/entry");
}'''
text = replace_once(text, old, new, "skipAddition")
path.write_text(text)

path = Path("app/(member)/resonance/complete/page.tsx")
text = path.read_text()
text = replace_once(
    text,
    'import { additionalOffers, VISIT_PRICES } from "@/src/lib/resonance/visit-offers";\n',
    'import { additionalOffers, VISIT_PRICES } from "@/src/lib/resonance/visit-offers";\nimport { getResonanceRoomTarget } from "@/src/lib/resonance/room-entry";\n',
    "complete room import",
)
text = replace_once(text, '  canCharge,\n  label = "Complete ten",\n', '  canCharge,\n  roomWeekNumber,\n  label = "Complete ten",\n', "complete action args")
text = replace_once(text, '  canCharge: boolean;\n  label?: string;\n', '  canCharge: boolean;\n  roomWeekNumber?: number;\n  label?: string;\n', "complete action type")
text = replace_once(
    text,
    '      <input type="hidden" name="orderId" value={orderId} />\n      <input type="hidden" name="quantity" value={quantity} />',
    '      <input type="hidden" name="orderId" value={orderId} />\n      {roomWeekNumber ? <input type="hidden" name="room" value={roomWeekNumber} /> : null}\n      <input type="hidden" name="quantity" value={quantity} />',
    "complete action room input",
)
text = replace_once(
    text,
    '  searchParams: Promise<{ order?: string; error?: string }>;\n',
    '  searchParams: Promise<{ order?: string; error?: string; room?: string | string[] }>;\n',
    "complete search params",
)
text = replace_once(
    text,
    '  const query = await searchParams;\n  const order = query.order ? await getVisitOrder(userId, query.order) : null;',
    '  const query = await searchParams;\n  const roomTarget = getResonanceRoomTarget(query.room);\n  const roomSuffix = roomTarget ? `&room=${roomTarget.weekNumber}` : "";\n  const order = query.order ? await getVisitOrder(userId, query.order) : null;',
    "complete query",
)
text = replace_once(text, '  if (child) redirect(`/resonance/complete?order=${child.id}`);', '  if (child) redirect(`/resonance/complete?order=${child.id}${roomSuffix}`);', "complete child redirect")
text = replace_once(
    text,
    '<Link href={`/resonance/visits?order=${order.id}`} className="res-accent res-accent-hover text-base underline">',
    '<Link href={`/resonance/visits?order=${order.id}${roomSuffix}`} className="res-accent res-accent-hover text-base underline">',
    "complete retry link",
)
text = replace_once(
    text,
    '<Link href="/entry" className="res-accent res-accent-hover text-base underline">Choose my room</Link>',
    '<Link href={roomTarget?.entryPath ?? "/entry"} className="res-accent res-accent-hover text-base underline">{roomTarget ? `Continue to ${roomTarget.name}` : "Choose my room"}</Link>',
    "complete room link",
)
text = text.replace('          canCharge={canCharge}\n', '          canCharge={canCharge}\n          roomWeekNumber={roomTarget?.weekNumber}\n')
path.write_text(text)

path = Path("app/(member)/resonance/complete/additional-offer-picker.tsx")
text = path.read_text()
text = replace_once(text, '  smallerOffers,\n  canCharge,\n}: {', '  smallerOffers,\n  canCharge,\n  roomWeekNumber,\n}: {', "picker args")
text = replace_once(text, '  canCharge: boolean;\n}) {', '  canCharge: boolean;\n  roomWeekNumber?: number;\n}) {', "picker type")
text = text.replace(
    '<input type="hidden" name="orderId" value={orderId} />',
    '<input type="hidden" name="orderId" value={orderId} />\n          {roomWeekNumber ? <input type="hidden" name="room" value={roomWeekNumber} /> : null}',
)
path.write_text(text)

Path("scripts/verify-resonance-room-funnel-contract.ts").write_text(r'''import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");
const publicPage = read("app/(marketing)/resonance/enter/page.tsx");
const entryPage = read("app/(member)/entry/page.tsx");
const visitsPage = read("app/(member)/resonance/visits/page.tsx");
const actions = read("app/(member)/resonance/visits/actions.ts");
const completePage = read("app/(member)/resonance/complete/page.tsx");
const offerPicker = read("app/(member)/resonance/complete/additional-offer-picker.tsx");
const roomEntry = read("src/lib/resonance/room-entry.ts");

assert.match(publicPage, /<details/);
assert.match(publicPage, /Choose \{roomName\}/);
assert.match(publicPage, /room\.chooseWhen/);
assert.match(publicPage, /\/entry\?room=\$\{room\.weekNumber\}/);
assert.doesNotMatch(publicPage, /line-clamp-2/);
assert.match(roomEntry, /The Hearth/);
assert.match(roomEntry, /The Becoming/);
assert.match(entryPage, /resonance\/visits\?room=/);
assert.match(visitsPage, /getResonanceRoomTarget/);
assert.match(visitsPage, /name="room"/);
assert.match(visitsPage, /data-whop-checkout-return-url=.*roomSuffix/s);
assert.match(actions, /formRoomTarget/);
assert.match(actions, /roomTarget\?\.entryPath/);
assert.match(completePage, /roomWeekNumber=\{roomTarget\?\.weekNumber\}/);
assert.match(completePage, /Continue to \$\{roomTarget\.name\}/);
assert.match(offerPicker, /name="room"/);

console.log("Resonance room dropdown and selected-room funnel continuity checks passed.");
''')

package_path = Path("package.json")
package = json.loads(package_path.read_text())
package["scripts"]["test:resonance-room-funnel"] = "tsx scripts/verify-resonance-room-funnel-contract.ts"
existing = package["scripts"]["test:resonance-content"]
if "test:resonance-room-funnel" not in existing:
    package["scripts"]["test:resonance-content"] = existing + " && npm run test:resonance-room-funnel"
package_path.write_text(json.dumps(package, indent=2) + "\n")
