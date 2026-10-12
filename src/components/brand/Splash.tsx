import Image from "next/image";

// Startup splash. It is rendered in the server HTML (no client component, no
// useEffect), so the logo is part of the first paint. The timing lives in CSS
// (.splash in globals.css): fade in, hold, fade out after 2.5 seconds.
// The inline script in the root layout sets data-splash-seen on <html> when this
// browser session already showed it, and CSS then hides the splash.
export function Splash() {
  return (
    <div aria-hidden className="splash">
      {/* 60% of the screen width on mobile, 40% on laptop, capped at 480px. The height
          follows the image's own aspect ratio, and object-contain keeps it uncropped.
          unoptimized serves the file as-is so it appears on the first paint; with
          unoptimized, quality has no effect. */}
      <Image
        src="/logo/logo.png"
        alt="Why Ideas Only logo"
        width={64}
        height={43}
        priority
        quality={100}
        unoptimized
        className="h-auto w-[60vw] max-w-[480px] object-contain lg:w-[40vw]"
      />
    </div>
  );
}
