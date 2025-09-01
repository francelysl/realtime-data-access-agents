// frontend/src/components/CardNav.tsx
import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import Link from "next/link";
import { GoArrowUpRight } from "react-icons/go";

type NavLink = { label: string; ariaLabel?: string; href?: string };
type NavItem = { label: string; bgColor?: string; textColor?: string; links?: NavLink[] };

type Props = {
  title?: string;
  items: NavItem[];
  className?: string;
  ease?: string;
  // visual theme
  baseColor?: string;       // surface color of the container (behind cards)
  headerTextColor?: string; // text color for top bar
  gradientFrom?: string;    // background gradient start (light)
  gradientTo?: string;      // background gradient end (dark)
  ctaHref?: string;
  ctaLabel?: string;
};

const CardNav = ({
  title = "SRTA — Real-Time Data Access",
  items,
  className = "",
  ease = "power3.out",
  baseColor = "#ffffff",
  headerTextColor = "#111",
  gradientFrom = "#f8fafc", // slate-50
  gradientTo = "#0f172a",   // slate-900
  ctaHref = "/exports",
  ctaLabel = "Go to Exports",
}: Props) => {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const navRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const calculateHeight = () => {
    const navEl = navRef.current as HTMLDivElement | null;
    if (!navEl) return 280;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (isMobile) {
      const contentEl = navEl.querySelector(".card-nav-content") as HTMLDivElement | null;
      if (contentEl) {
        const was = {
          visibility: contentEl.style.visibility,
          pointer: contentEl.style.pointerEvents,
          position: contentEl.style.position,
          height: contentEl.style.height,
        };
        contentEl.style.visibility = "visible";
        contentEl.style.pointerEvents = "auto";
        contentEl.style.position = "static";
        contentEl.style.height = "auto";
        // force reflow
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        contentEl.offsetHeight;
        const topBar = 64;
        const padding = 16;
        const contentHeight = contentEl.scrollHeight;
        contentEl.style.visibility = was.visibility;
        contentEl.style.pointerEvents = was.pointer;
        contentEl.style.position = was.position;
        contentEl.style.height = was.height;
        return topBar + contentHeight + padding;
      }
    }
    return 220;
  };

  const createTimeline = () => {
    const navEl = navRef.current;
    if (!navEl) return null;
    gsap.set(navEl, { height: 64, overflow: "hidden" });
    gsap.set(cardsRef.current, { y: 50, opacity: 0 });

    const tl = gsap.timeline({ paused: true });
    tl.to(navEl, {
      height: calculateHeight,
      duration: 0.4,
      ease,
    });
    tl.to(
      cardsRef.current,
      { y: 0, opacity: 1, duration: 0.4, ease, stagger: 0.08 },
      "-=0.1"
    );
    return tl;
  };

  useLayoutEffect(() => {
    const tl = createTimeline();
    tlRef.current = tl;
    return () => {
      tl?.kill();
      tlRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ease, items]);

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!tlRef.current) return;
      if (isExpanded) {
        const newHeight = calculateHeight();
        gsap.set(navRef.current, { height: newHeight });
        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) {
          newTl.progress(1);
          tlRef.current = newTl;
        }
      } else {
        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) tlRef.current = newTl;
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded]);

  const toggleMenu = () => {
    const tl = tlRef.current;
    if (!tl) return;
    if (!isExpanded) {
      setIsHamburgerOpen(true);
      setIsExpanded(true);
      tl.play(0);
    } else {
      setIsHamburgerOpen(false);
      tl.eventCallback("onReverseComplete", () => setIsExpanded(false));
      tl.reverse();
    }
  };

  const setCardRef =
    (i: number) =>
    (el: HTMLDivElement | null): void => {
      if (el) cardsRef.current[i] = el;
    };

  return (
    <div
      className={`absolute left-1/2 -translate-x-1/2 w-[92%] max-w-[1100px] z-[50] top-[1.1rem] md:top-[1.6rem] ${className}`}
    >
      <nav
        ref={navRef}
        className="rounded-2xl shadow-md relative overflow-hidden will-change-[height]"
        style={{
          background: `linear-gradient(to right, ${gradientFrom}, ${gradientTo})`,
        }}
      >
        {/* Top bar */}
        <div className="absolute inset-x-0 top-0 h-16 flex items-center justify-between px-3 md:px-4 z-[2]">
          {/* Title */}
          <div className="flex items-center gap-2 text-sm md:text-base font-semibold" style={{ color: headerTextColor }}>
            {title}
          </div>

          {/* Right side: CTA + Hamburger */}
          <div className="flex items-center gap-2">
            <Link
              href={ctaHref}
              className="hidden md:inline-flex px-3 h-9 rounded-lg items-center font-medium border border-white/10 bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              {ctaLabel}
            </Link>
            <button
              className={`group h-10 w-10 grid place-items-center rounded-lg border border-white/20 text-white md:hidden ${
                isHamburgerOpen ? "bg-white/20" : "bg-white/10"
              }`}
              onClick={toggleMenu}
              aria-label={isExpanded ? "Close menu" : "Open menu"}
            >
              <div className="relative h-[14px] w-[18px]">
                <span
                  className={`block absolute left-0 right-0 h-[2px] bg-current transition-all duration-300 ${
                    isHamburgerOpen ? "top-[6px] rotate-45" : "top-0"
                  }`}
                />
                <span
                  className={`block absolute left-0 right-0 h-[2px] bg-current transition-all duration-300 ${
                    isHamburgerOpen ? "opacity-0" : "top-[6px] opacity-100"
                  }`}
                />
                <span
                  className={`block absolute left-0 right-0 h-[2px] bg-current transition-all duration-300 ${
                    isHamburgerOpen ? "top-[6px] -rotate-45" : "top-[12px]"
                  }`}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Card area */}
        <div
          className={`card-nav-content absolute left-0 right-0 top-16 bottom-0 p-2 md:p-3 flex flex-col items-stretch gap-2 justify-start z-[1] ${
            isExpanded ? "visible pointer-events-auto" : "invisible pointer-events-none md:visible md:pointer-events-auto"
          } md:flex-row md:items-end md:gap-3`}
          style={{ background: baseColor }}
        >
          {(items || []).slice(0, 3).map((item, idx) => (
            <div
              key={`${item.label}-${idx}`}
              ref={setCardRef(idx)}
              className="select-none relative flex flex-col gap-2 p-4 rounded-xl min-w-0 flex-[1_1_auto] h-auto min-h-[76px] md:h-[140px] md:flex-[1_1_0%] shadow-sm"
              style={{
                backgroundColor: item.bgColor ?? "#111827", // zinc-900-ish
                color: item.textColor ?? "#fff",
              }}
            >
              <div className="font-semibold tracking-tight text-[18px] md:text-[20px]">
                {item.label}
              </div>
              <div className="mt-auto flex flex-col gap-[2px]">
                {item.links?.map((lnk, i) => {
                  const text = (
                    <span className="inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity text-[14px] md:text-[15px]">
                      <GoArrowUpRight className="shrink-0" aria-hidden="true" />
                      {lnk.label}
                    </span>
                  );
                  return lnk.href ? (
                    <Link
                      key={`${lnk.label}-${i}`}
                      href={lnk.href}
                      aria-label={lnk.ariaLabel ?? lnk.label}
                      className="no-underline"
                    >
                      {text}
                    </Link>
                  ) : (
                    <a key={`${lnk.label}-${i}`} aria-label={lnk.ariaLabel ?? lnk.label} className="no-underline">
                      {text}
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default CardNav;