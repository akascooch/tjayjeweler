import Link from "next/link";
import { notFound } from "next/navigation";
import { ReviewForm } from "@/app/admin/custom-requests/[id]/review-form";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function CustomRequestDetailPage({ params }: PageProps) {
  const { id } = await params;
  const request = await prisma.customRequest.findUnique({
    where: { id },
    include: { product: { select: { title: true, slug: true } } },
  });
  if (!request) notFound();

  return (
    <section className="max-w-3xl">
      <p className="text-xs tracking-[0.16em] text-[var(--muted)] uppercase">{request.status}</p>
      <h2 className="mt-3 text-2xl font-black tracking-[0.08em] uppercase">
        {request.kind === "EXISTING_MODEL" ? "Modify a catalog piece" : "New design"}
      </h2>
      {request.product ? (
        <p className="mt-4 text-sm">
          <Link href={`/products/${request.product.slug}`} className="underline">
            {request.product.title}
          </Link>
        </p>
      ) : null}
      <dl className="mt-6 space-y-4 text-sm leading-7">
        <div>
          <dt className="text-[var(--muted)]">Received</dt>
          <dd>{request.created_at.toISOString()}</dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">Contact</dt>
          <dd>
            {request.contact_name ? `${request.contact_name} · ` : ""}
            {request.contact_phone}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">Description</dt>
          <dd className="whitespace-pre-wrap">{request.description}</dd>
        </div>
      </dl>
      {request.reference_file ? (
        <figure className="mt-6">
          <figcaption className="text-xs tracking-[0.16em] text-[var(--muted)] uppercase">Reference image</figcaption>
          {/* The file is served only to a signed-in admin. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/admin/custom-requests/${request.id}/image`}
            alt="Customer reference image"
            className="mt-3 max-h-[32rem] w-full bg-[var(--surface)] object-contain"
          />
        </figure>
      ) : null}
      <ReviewForm id={request.id} status={request.status} staffNote={request.staff_note} />
    </section>
  );
}
