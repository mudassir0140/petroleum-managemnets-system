import Image from "next/image";

// The source logo is a small black mark with no background, so it sits on a
// white tile to stay visible in both light and dark themes.
const SIZES = {
  sm: { width: 32, height: 22 },
  md: { width: 48, height: 32 },
  lg: { width: 128, height: 86 },
} as const;

export function Logo({ size = "md", className = "" }: { size?: keyof typeof SIZES; className?: string }) {
  const { width, height } = SIZES[size];
  const padding = size === "lg" ? "p-4" : "p-1.5";

  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200 ${padding} ${className}`}>
      <Image src="/logo/logo.png" alt="Why Ideas Only logo" width={width} height={height} priority={size === "lg"} />
    </span>
  );
}
