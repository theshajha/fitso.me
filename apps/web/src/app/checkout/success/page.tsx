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
                <tr><th scope="row" style={{ textAlign: "left", paddingRight: 24 }}>Product</th><td>{order.product === "report" ? "Style Report" : "Style Report"}</td></tr>
                <tr><th scope="row" style={{ textAlign: "left", paddingRight: 24 }}>Amount</th><td>{formatMoney(order.amount_minor, order.currency)}</td></tr>
              </tbody>
            </table>
          </div>
          <p>
            {order.product === "report"
              ? "Your Style Report is unlocked."
              
              : "Thank you for your order."}
          </p>
        </>
      ) : (
        <p>We could not find that order. If you paid, your confirmation email is on its way.</p>
      )}
      <p>
        {token ? (
          <Button href={order?.product === "report" ? `/r/${token}#report` : `/r/${token}`}>
            {order?.product === "report" ? "Open my report" : "Back to your result"}
          </Button>
        ) : <Button href="/" variant="secondary">Back to fitso.me</Button>}
      </p>
    </Section>
  );
}
