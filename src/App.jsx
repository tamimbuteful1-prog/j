import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { NuclearBackground } from "./components.jsx";
import { slides } from "./slides.jsx";

/* §52 — slide transition */
const slideVariants = {
  initial: { opacity: 0, y: 22, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -15, scale: 0.99 }
};

function hashIndex() {
  const id = window.location.hash.replace("#", "");
  const found = slides.findIndex((s) => s.id === id);
  return found >= 0 ? found : 0;
}

export default function App() {
  const [current, setCurrent] = useState(hashIndex);
  const [navOpen, setNavOpen] = useState(false);

  const go = useCallback((next) => {
    setCurrent(() => {
      const clamped = Math.min(slides.length - 1, Math.max(0, next));
      window.location.hash = slides[clamped].id;
      return clamped;
    });
    setNavOpen(false);
  }, []);

  /* Keyboard navigation. In an RTL deck the left arrow moves forward. */
  useEffect(() => {
    function onKey(e) {
      if (e.target instanceof HTMLElement && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
      if (e.key === "ArrowLeft" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        setCurrent((c) => {
          const n = Math.min(slides.length - 1, c + 1);
          window.location.hash = slides[n].id;
          return n;
        });
      } else if (e.key === "ArrowRight" || e.key === "PageUp") {
        e.preventDefault();
        setCurrent((c) => {
          const n = Math.max(0, c - 1);
          window.location.hash = slides[n].id;
          return n;
        });
      } else if (e.key === "Home") {
        setCurrent(0);
        window.location.hash = slides[0].id;
      } else if (e.key === "End") {
        setCurrent(slides.length - 1);
        window.location.hash = slides[slides.length - 1].id;
      } else if (e.key === "Escape") {
        setNavOpen(false);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    function onHash() {
      setCurrent(hashIndex());
    }
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  /* Scroll back to the top whenever the slide changes. */
  useEffect(() => {
    const stage = document.querySelector(".stage");
    if (stage) stage.scrollTop = 0;
  }, [current]);

  const Slide = slides[current].Component;
  const progress = ((current + 1) / slides.length) * 100;

  return (
    <div className="app">
      <NuclearBackground />

      <header className="topbar">
        <button
          type="button"
          className="nav-toggle"
          onClick={() => setNavOpen((v) => !v)}
          aria-expanded={navOpen}
          aria-label="فهرس الشرائح"
        >
          <Menu size={17} />
        </button>

        <div className="brand">
          <strong>بُرهان</strong>
          <span>BURHAN · Regulatory Evidence Twin</span>
        </div>

        <div className="topbar-right">
          <span className="slide-count">
            {String(current + 1).padStart(2, "0")}
            <i>/</i>
            {String(slides.length).padStart(2, "0")}
          </span>
          <div className="pager">
            <button type="button" onClick={() => go(current - 1)} disabled={current === 0} aria-label="السابق">
              <ChevronRight size={17} />
            </button>
            <button
              type="button"
              onClick={() => go(current + 1)}
              disabled={current === slides.length - 1}
              aria-label="التالي"
            >
              <ChevronLeft size={17} />
            </button>
          </div>
        </div>
      </header>

      <div className="progress" style={{ width: `${progress}%` }} />

      <nav className={`deck-nav ${navOpen ? "is-open" : ""}`} aria-label="فهرس الشرائح">
        <small>BURHAN</small>
        <ol>
          {slides.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                className={i === current ? "is-current" : ""}
                onClick={() => go(i)}
              >
                <i>{String(i + 1).padStart(2, "0")}</i>
                {s.nav}
              </button>
            </li>
          ))}
        </ol>
        <p className="nav-note">
          استخدم ← و → للتنقل بين الشرائح.
        </p>
      </nav>

      {navOpen ? <div className="nav-scrim" onClick={() => setNavOpen(false)} /> : null}

      <main className="stage">
        <AnimatePresence mode="wait">
          <motion.div
            key={slides[current].id}
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <Slide />
          </motion.div>
        </AnimatePresence>

        <footer className="deck-footer">
          نموذج أولي — جميع المنشآت والأنظمة والمكونات والسجلات المعروضة افتراضية ولا تمثل منشأة
          حقيقية.
        </footer>
      </main>
    </div>
  );
}
