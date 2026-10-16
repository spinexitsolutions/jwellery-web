import { getSetting } from "@/lib/settings";
import { LoginForm } from "./LoginForm";

export default async function Login() {
  const site = await getSetting("site");
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-zinc-950 lg:block">
        <div className="absolute inset-0" style={{ background: "radial-gradient(60% 50% at 30% 30%, rgba(201,164,106,.35), transparent 70%), radial-gradient(50% 50% at 80% 80%, rgba(120,90,60,.4), transparent 70%)" }} />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <p className="text-sm tracking-[0.3em] text-white/60 uppercase">Studio</p>
          <div>
            <p className="font-serif text-6xl leading-none" style={{ fontFamily: "var(--font-heading)" }}>
              {site.brandName}
            </p>
            <p className="mt-4 max-w-sm text-white/60">Manage your collections, pages, theme and orders — everything on your website, from one place.</p>
          </div>
          <p className="text-xs text-white/40">© {new Date().getFullYear()} {site.brandName}</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <LoginForm brand={site.brandName} />
      </div>
    </div>
  );
}
