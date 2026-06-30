import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="text-sm font-semibold text-brand-600">404</div>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">
        Parcel not found
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        The diligence case you&apos;re looking for doesn&apos;t exist or has been
        removed.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
