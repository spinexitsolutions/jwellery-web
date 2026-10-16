import Link from "next/link";

export default function NotFound() {
  return (
    <div className="site-container flex min-h-[80vh] flex-col items-center justify-center pt-24 text-center">
      <p className="eyebrow">Error 404</p>
      <h1 className="display mt-6 text-[clamp(4rem,14vw,12rem)] leading-none">
        Lost <em className="accent-word">sparkle</em>
      </h1>
      <p className="mt-6 max-w-md text-muted">The page you were looking for has moved, or never existed. Let us take you somewhere beautiful.</p>
      <Link href="/" className="btn btn-primary mt-10">
        Return home
      </Link>
    </div>
  );
}
