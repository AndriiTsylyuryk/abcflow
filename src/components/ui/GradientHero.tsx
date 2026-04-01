/**
 * Stripe-style flowing rainbow gradient background.
 * Render it inside a `relative overflow-hidden` container.
 */
export function GradientHero() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 z-0 overflow-hidden"
    >
      {/* Base wash */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-indigo-50 to-white" />

      {/* Blob 1 — violet */}
      <div
        className="animate-blob-1 absolute -top-32 -left-32 h-[600px] w-[600px] rounded-full opacity-40"
        style={{
          background:
            "radial-gradient(circle, #a78bfa 0%, #7c3aed 40%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      {/* Blob 2 — sky blue */}
      <div
        className="animate-blob-2 absolute top-0 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full opacity-35"
        style={{
          background:
            "radial-gradient(circle, #38bdf8 0%, #0ea5e9 40%, transparent 70%)",
          filter: "blur(90px)",
        }}
      />

      {/* Blob 3 — rose/pink */}
      <div
        className="animate-blob-3 absolute -top-16 right-0 h-[550px] w-[550px] rounded-full opacity-35"
        style={{
          background:
            "radial-gradient(circle, #fb7185 0%, #e11d48 40%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      {/* Blob 4 — amber/orange */}
      <div
        className="animate-blob-4 absolute bottom-0 left-1/4 h-[400px] w-[400px] rounded-full opacity-30"
        style={{
          background:
            "radial-gradient(circle, #fbbf24 0%, #f59e0b 40%, transparent 70%)",
          filter: "blur(100px)",
        }}
      />

      {/* Blob 5 — emerald */}
      <div
        className="animate-blob-5 absolute bottom-0 right-1/4 h-[450px] w-[450px] rounded-full opacity-25"
        style={{
          background:
            "radial-gradient(circle, #34d399 0%, #059669 40%, transparent 70%)",
          filter: "blur(90px)",
        }}
      />

      {/* Noise overlay to add depth (optional grain texture) */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
