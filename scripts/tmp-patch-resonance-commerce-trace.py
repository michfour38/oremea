from pathlib import Path

catalog = Path("src/lib/whop/resonance-catalog.ts")
text = catalog.read_text()
old = '''    select: { id: true, kind: true, quantity: true, remaining_quantity: true,
      status: true, whop_payment_id: true, whop_checkout_id: true },'''
new = '''    select: {
      id: true,
      kind: true,
      quantity: true,
      amount_cents: true,
      remaining_quantity: true,
      status: true,
      parent_id: true,
      whop_plan_id: true,
      affiliate_code: true,
      whop_payment_id: true,
      whop_checkout_id: true,
      paid_at: true,
      created_at: true,
      _count: { select: { redemptions: true } },
    },'''
if old not in text:
    raise SystemExit("recentOrders select did not match expected source")
catalog.write_text(text.replace(old, new, 1))

page = Path("app/admin/resonance-commerce/page.tsx")
text = page.read_text()
old = '''              <caption className="mb-2 text-left">Latest ten orders — identifiers and settlement state only</caption>
              <thead><tr><th>Order</th><th>Status</th><th>Visits / unused</th><th>Checkout</th><th>Payment</th></tr></thead>
              <tbody>{status.recentOrders.map((order) => (
                <tr key={order.id}><td className="py-2">{order.id}</td><td>{order.status}</td><td>{order.quantity} / {order.remaining_quantity}</td><td>{order.whop_checkout_id ?? "—"}</td><td>{order.whop_payment_id ?? "—"}</td></tr>
              ))}</tbody>'''
new = '''              <caption className="mb-2 text-left">Latest ten orders — owner-only settlement and attribution trace</caption>
              <thead>
                <tr>
                  <th>Created</th><th>Order</th><th>Lane</th><th>Status</th><th>Amount</th>
                  <th>Visits / unused</th><th>Referral requested</th><th>Parent</th>
                  <th>Checkout</th><th>Payment</th><th>Paid</th><th>Redeemed</th>
                </tr>
              </thead>
              <tbody>{status.recentOrders.map((order) => {
                const normalPlan = status.plans.find((plan) => plan.id === order.whop_plan_id);
                const lane = creatorStarter.planId === order.whop_plan_id
                  ? "Creator starter"
                  : normalPlan?.label ?? "Unknown approved plan";
                return (
                  <tr key={order.id}>
                    <td className="py-2 whitespace-nowrap">{order.created_at.toISOString()}</td>
                    <td>{order.id}</td>
                    <td>{lane}</td>
                    <td>{order.status}</td>
                    <td>{formatOremeaPrice(order.amount_cents)}</td>
                    <td>{order.quantity} / {order.remaining_quantity}</td>
                    <td>{order.affiliate_code ?? "—"}</td>
                    <td>{order.parent_id ?? "—"}</td>
                    <td>{order.whop_checkout_id ?? "—"}</td>
                    <td>{order.whop_payment_id ?? "—"}</td>
                    <td className="whitespace-nowrap">{order.paid_at?.toISOString() ?? "—"}</td>
                    <td>{order._count.redemptions}</td>
                  </tr>
                );
              })}</tbody>'''
if old not in text:
    raise SystemExit("recent order admin table did not match expected source")
text = text.replace(old, new, 1)
old_note = '''          </div>
        </div>

        <div className="mt-8 rounded-[2rem] border border-white/10 bg-black/40 p-6 md:p-8">'''
new_note = '''          </div>
          <p className="mt-4 text-xs leading-6 text-zinc-500">
            “Referral requested” is the affiliate code Oremea preserved on the order. It proves the requested attribution path, not the creator commission. Whop’s affiliate records remain authoritative for whether commission was credited, its rate, timing, refund treatment and spendable balance.
          </p>
        </div>

        <div className="mt-8 rounded-[2rem] border border-white/10 bg-black/40 p-6 md:p-8">'''
if old_note not in text:
    raise SystemExit("commerce audit note insertion point did not match expected source")
page.write_text(text.replace(old_note, new_note, 1))

test = Path("scripts/verify-resonance-provisioning-contract.ts")
text = test.read_text()
marker = '    assert.match(adminCommerce, /Whop HTTP/);'
guard = '''
    assert.match(adminCommerce, /owner-only settlement and attribution trace/i);
    assert.match(adminCommerce, /Referral requested/);
    assert.match(adminCommerce, /Whop’s affiliate records remain authoritative/);
    const catalogSource = readFileSync("src/lib/whop/resonance-catalog.ts", "utf8");
    for (const field of ["amount_cents", "parent_id", "whop_plan_id", "affiliate_code", "paid_at", "created_at", "redemptions"]) {
      assert.match(catalogSource, new RegExp(field), `Owner commerce trace must select ${field}.`);
    }
'''
if marker not in text:
    raise SystemExit("admin commerce test insertion point did not match expected source")
test.write_text(text.replace(marker, marker + guard, 1))
