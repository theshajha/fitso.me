import { renderResultImage } from "@/features/profile/og";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  return renderResultImage(token, "story");
}
