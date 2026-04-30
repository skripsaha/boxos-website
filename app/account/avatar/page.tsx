import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { PixelEditor } from "@/components/PixelEditor";

export const metadata = { title: "Edit avatar" };

export default async function AvatarPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <section className="container-x py-16 md:py-24">
      <h1 className="display text-[clamp(34px,5vw,52px)]">
        Draw your <em>avatar</em>.
      </h1>
      <p className="prose-body mt-4 max-w-[58ch]">
        Avatars on BoxOS are pixel art — drawn here, on this page. The 24 × 24 grid is yours; pick a colour and paint.
      </p>
      <div className="mt-12">
        <PixelEditor username={user.username} initial={user.avatar_data} />
      </div>
    </section>
  );
}
