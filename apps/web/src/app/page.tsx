import { Container } from "@/components/brand/Container";
import { Counter } from "@/components/brand/Counter";
import { DrapeFan } from "@/components/brand/DrapeFan";

// Placeholder. Filled by T5 (Landing and doors).
export default function Home() {
  return (
    <Container className="section">
      <h1>Know what&apos;s working for you.</h1>
      <div className="my-10">
        <DrapeFan />
      </div>
      <Counter />
    </Container>
  );
}
