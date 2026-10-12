// Fixed 30px strip at the bottom of every page. Pages reserve the same 30px
// of bottom padding in the root layout so nothing sits underneath it.
export function Footer() {
  return (
    <footer className="fixed inset-x-0 bottom-0 z-30 flex h-[30px] items-center justify-center border-t border-slate-200 bg-white/95 px-4 text-[11px] text-slate-600 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 dark:text-slate-400">
      <p>
        Powered by{" "}
        <a
          href="https://www.whyideasonly.online/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-amber-600 hover:underline dark:text-amber-400"
        >
          Why Ideas Only
        </a>
      </p>
    </footer>
  );
}
