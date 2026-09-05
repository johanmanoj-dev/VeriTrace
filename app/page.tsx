import { MediaDropzone } from "@/components/MediaDropzone";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col justify-between">
      {/* Top Hero + Dropzone Section */}
      <section className="mx-auto w-full max-w-7xl px-6 lg:px-10 pt-16 pb-20 text-center">
        {/* Eyebrow */}
        <p className="text-[11px] font-semibold tracking-[0.2em] text-neutral-500 uppercase">
          Verify before you trust
        </p>

        {/* Headline */}
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-neutral-950 sm:text-5xl lg:text-[58px] leading-[1.12]">
          Detect manipulation.
          <br />
          Understand the evidence.
          <br />
          Trace the source.
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-neutral-600">
          Analyze potentially AI-generated or manipulated media using multimodal analysis and contextual sources.
        </p>

        {/* Dropzone Card */}
        <div className="mt-10">
          <MediaDropzone />
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="border-t border-neutral-200/80 bg-white py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-neutral-500 uppercase">
            A clear chain of evidence
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950">
            How it works
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-10 border-t border-neutral-200/80 pt-8 sm:grid-cols-3">
            {/* Step 01 */}
            <div>
              <p className="text-xs font-semibold text-neutral-400">01</p>
              <h3 className="mt-2 text-base font-semibold text-neutral-950">Detect</h3>
              <p className="mt-2 text-xs leading-relaxed text-neutral-600">
                Identify potential indicators of synthetic generation or manipulation.
              </p>
            </div>

            {/* Step 02 */}
            <div>
              <p className="text-xs font-semibold text-neutral-400">02</p>
              <h3 className="mt-2 text-base font-semibold text-neutral-950">Explain</h3>
              <p className="mt-2 text-xs leading-relaxed text-neutral-600">
                Explain the evidence behind the assessment in plain, forensic language.
              </p>
            </div>

            {/* Step 03 */}
            <div>
              <p className="text-xs font-semibold text-neutral-400">03</p>
              <h3 className="mt-2 text-base font-semibold text-neutral-950">Verify &amp; Trace</h3>
              <p className="mt-2 text-xs leading-relaxed text-neutral-600">
                Compare claims with external sources and trace relevant context back to primary evidence.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
