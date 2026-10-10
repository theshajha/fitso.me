import { permanentRedirect } from "next/navigation";

/** Pricing lives on the home page. */
export default function Page() {
  permanentRedirect("/#pricing");
}
