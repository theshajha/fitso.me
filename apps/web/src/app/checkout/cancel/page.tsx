import { Button, Section } from "@/components/brand";

export const metadata = { title: "Checkout cancelled", robots: { index: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const safe = token && /^[0-9a-z]{10}$/.test(token) ? token : null;
  return (
    <Section>
      <h1>Checkout cancelled</h1>
      <p>Nothing was charged.</p>
      <p>
        <Button href={safe ? `/r/${safe}` : "/pricing"}>{safe ? "Back to your result" : "Back to pricing"}</Button>
      </p>
    </Section>
  );
}
