export default function ContactPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-10">
      <section className="rounded-[1.75rem] border border-pitch/10 bg-white/84 p-6 shadow-card sm:p-7">
        <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex rounded-full border border-pitch/10 bg-paper/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-pitch">
                Contact
              </span>
              <span className="inline-flex rounded-full border border-boundary/16 bg-boundary/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-boundary">
                Project communication
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-pitch sm:text-4xl">Get in touch</h1>
              <p className="mt-3 max-w-3xl text-base leading-8 text-ink/64">
                For questions, feedback, collaboration, or product discussion around this cricket prediction system,
                use the contact channel below.
              </p>
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-pitch/10 bg-paper/76 p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink/44">Primary contact</p>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-pitch">Email</p>
            <a
              href="mailto:ir.irfan106@gmail.com"
              className="mt-3 inline-flex rounded-full bg-pitch px-5 py-3 text-sm font-semibold text-paper transition hover:bg-pitch/92"
            >
              ir.irfan106@gmail.com
            </a>
            <p className="mt-4 text-sm leading-7 text-ink/62">
              Use this address for project communication, implementation questions, feedback on model behavior, or
              general product discussion.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 md:grid-cols-3">
        <InfoCard
          title="Best for"
          body="Project collaboration, technical questions, UI feedback, model discussion, and deployment-related communication."
        />
        <InfoCard
          title="Include context"
          body="If you are reporting an issue, include the format, the inputs used, what you expected, and what the app returned."
        />
        <InfoCard
          title="Response quality"
          body="Clear reproduction details make prediction, UI, and data-pipeline issues much easier to diagnose quickly."
        />
      </section>
    </div>
  );
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.6rem] border border-pitch/10 bg-white p-6 shadow-card">
      <p className="text-xl font-semibold tracking-[-0.03em] text-pitch">{title}</p>
      <p className="mt-3 text-sm leading-7 text-ink/64">{body}</p>
    </div>
  );
}
