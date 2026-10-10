import { Button, Section } from "@/components/brand";
import { getDb } from "@/lib/supabase";
import { formatMoney } from "@/lib/pricing";

export const metadata = { title: "Order confirmed", robots: { index: false } };
export const dynamic = "force-dynamic";

type OrderView = {
  product: "report" | "pro";
  currency: "INR" | "USD";
  amount_minor: number;
  price_tier: string;
  status: string;
  quick_win_id: string | null;
};

const TIER_LABEL: Record<string, string> = { founding: "Founding price", finish_today: "Finish-today price", list: "List price" };
const UUID = /^[0-9a-f-]{36}$/i;

export default async function Page({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order: orderId } = await searchParams;
  let order: OrderView | null = null;
  let token: string | null = null;

  if (orderId && UUID.test(orderId)) {
    const db = getDb();
    const { data } = await db.from("orders").select("*").eq("id", orderId).maybeSingle();
    order = (data as OrderView | null) ?? null;
    if (order?.quick_win_id) {
      const { data: qw } = await db.from("quick_wins").select("share_token").eq("id", order.quick_win_id).maybeSingle();
      token = (qw as { share_token: string } | null)?.share_token ?? null;
    }
  }

  return (
    <Section>
      <h1>Thank you</h1>
      {order ? (
        <>
          <div className="table-scroll">
            <table style={{ borderCollapse: "collapse" }}>
              <tbody>
                <tr><th scope="row" style={{ textAlign: "left", paddingRight: 24 }}>Product</th><td>{order.product === "report" ? "Style Report" : "Pro, annual"}</td></tr>
                <tr><th scope="row" style={{ textAlign: "left", paddingRight: 24 }}>Amount</th><td>{formatMoney(order.amount_minor, order.currency)}</td></tr>
                <tr><th scope="row" style={{ textAlign: "left", paddingRight: 24 }}>Price</th><td>{TIER_LABEL[order.price_tier] ?? order.price_tier}</td></tr>
              </tbody>
            </table>
          </div>
          <p>
            {order.product === "report"
              ? "Your Style Report ships in month 2 (by 2026-12-14). We'll email you the moment it's ready."
              : "Pro opens in month 3. Your founding price is locked."}
          </p>
        </>
      ) : (
        <p>We could not find that order. If you paid, your confirmation email is on its way.</p>
      )}
      <p>
        {token ? <Button href={`/r/${token}`}>Back to your result</Button> : <Button href="/" variant="secondary">Back to fitso.me</Button>}
      </p>
    </Section>
  );
}
