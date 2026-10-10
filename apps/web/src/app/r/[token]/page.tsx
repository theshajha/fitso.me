import { Container } from "@/components/brand/Container";

// Placeholder. Filled by T1 (Quick win, result, verdict).
export const metadata = { title: "Your result" };

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <Container className="section">
      <h1>Your result</h1>
      <p className="label">{token}</p>
    </Container>
  );
}
