import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DeckForm } from "@/components/deck-form";

export const dynamic = "force-dynamic";

export default async function NewDeckPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-3xl font-bold">Register Deck</h1>
      <DeckForm />
    </div>
  );
}
