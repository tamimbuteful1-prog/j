import React from "react";
import { motion } from "framer-motion";
import { evidenceNodes } from "./data.js";

/* ---------------------------------------------------------------
   §34 — animated nuclear background
--------------------------------------------------------------- */
export function NuclearBackground() {
  const particles = Array.from({ length: 22 });

  return (
    <div className="nuclear-bg" aria-hidden="true">
      <div className="grid-layer" />
      <div className="core-glow" />

      <div className="orbital orbital-1">
        <span />
      </div>
      <div className="orbital orbital-2">
        <span />
      </div>
      <div className="orbital orbital-3">
        <span />
      </div>

      <div className="reactor-core">
        <div className="reactor-core-inner" />
      </div>

      <div className="particles">
        {particles.map((_, i) => (
          <span
            key={i}
            className="particle"
            style={{
              "--x": `${(i * 37) % 100}%`,
              "--delay": `${-(i * 0.73)}s`,
              "--duration": `${10 + (i % 7) * 2}s`
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   Small shared pieces
--------------------------------------------------------------- */
export function Eyebrow({ children }) {
  return <div className="eyebrow">{children}</div>;
}

export function SlideHead({ index, kicker, title, lead }) {
  return (
    <header className="slide-head">
      <Eyebrow>
        <span className="eyebrow-index">{index}</span>
        {kicker}
      </Eyebrow>
      <h2>{title}</h2>
      {lead ? <p className="lead">{lead}</p> : null}
    </header>
  );
}

export function Disclaimer({ children }) {
  return <p className="disclaimer">{children}</p>;
}

/* ---------------------------------------------------------------
   §39 — Configuration Integrity triangle
--------------------------------------------------------------- */
export function ConfigurationTriangle({ broken = false }) {
  return (
    <div className={`config-triangle ${broken ? "broken" : ""}`}>
      <svg viewBox="0 0 600 430" className="triangle-svg" aria-hidden="true">
        <line x1="300" y1="60" x2="100" y2="345" />
        <line x1="300" y1="60" x2="500" y2="345" />
        <line x1="100" y1="345" x2="500" y2="345" />
      </svg>

      <div className="triangle-node top">
        <small>01</small>
        <strong>متطلبات التصميم</strong>
        <span>Design Requirements</span>
      </div>

      <div className="triangle-node left">
        <small>02</small>
        <strong>التهيئة الفعلية</strong>
        <span>Physical Configuration</span>
      </div>

      <div className="triangle-node right">
        <small>03</small>
        <strong>الوثائق</strong>
        <span>Documentation</span>
      </div>

      <div className="triangle-center">
        CONFIGURATION
        <strong>{broken ? "DEVIATION" : "INTEGRITY"}</strong>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   §41 — evidence graph. `flags` maps node id -> "warn" | "crit".
--------------------------------------------------------------- */
export function EvidenceGraph({ flags = {}, revealed = evidenceNodes.length }) {
  return (
    <div className="evidence-graph">
      <svg className="graph-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="M50 13 L50 19" />
        <path d="M50 33 L50 39" />
        <path d="M50 53 L17 63" />
        <path d="M50 53 L50 63" />
        <path d="M50 53 L83 63" />
        <path d="M17 77 L50 85" />
        <path d="M50 77 L50 85" />
        <path d="M83 77 L50 85" />
      </svg>

      {evidenceNodes.slice(0, revealed).map((node, i) => (
        <motion.div
          key={node.id}
          className={`graph-node ${flags[node.id] ? `is-${flags[node.id]}` : ""}`}
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
          /* x/y are part of the animation so framer-motion's inline transform
             does not drop the -50%/-50% centering the layout depends on. */
          initial={{ opacity: 0, scale: 0.9, x: "-50%", y: "-50%" }}
          animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
          transition={{ delay: i * 0.07, duration: 0.4 }}
        >
          <div className="node-head">
            <small>{node.id}</small>
            <em>{node.ar}</em>
          </div>
          <strong>{node.title}</strong>
          <span>{node.subtitle}</span>
        </motion.div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------
   §43 — Evidence Integrity Indicator
--------------------------------------------------------------- */
export function EvidenceIntegrityGauge({ value = 96, size = 260 }) {
  const radius = 82;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const tone = value >= 90 ? "safe" : value >= 75 ? "warn" : "crit";

  return (
    <div className={`integrity-gauge tone-${tone}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <circle className="gauge-track" cx="100" cy="100" r={radius} />
        <circle
          className="gauge-progress"
          cx="100"
          cy="100"
          r={radius}
          style={{ strokeDasharray: circumference, strokeDashoffset: offset }}
        />
      </svg>

      <div className="gauge-number">
        <strong>{value}</strong>
        <span>EVIDENCE INTEGRITY</span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   §47 — regulatory signal card
--------------------------------------------------------------- */
export function RegulatorySignal({ factors, onOpen, opened }) {
  return (
    <motion.div
      className="regulatory-signal"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="signal-head">
        <span className="signal-pulse" />
        REGULATORY ATTENTION
      </div>

      <h3>Evidence chain requires review</h3>

      <p className="en">
        Multiple unresolved evidence conditions are associated with Cooling System CS-01.
      </p>
      <p className="ar-note">
        عدة حالات أدلة غير محسومة تؤثر على نفس نظام السلامة وتحتاج مراجعة من المختص.
      </p>

      <div className="signal-factors">
        {factors.map((f) => (
          <span key={f}>{f}</span>
        ))}
      </div>

      <button type="button" onClick={onOpen}>
        {opened ? "Evidence Chain opened ✓" : "Open Evidence Chain ←"}
      </button>
    </motion.div>
  );
}

/* ---------------------------------------------------------------
   Status strip used above the demo
--------------------------------------------------------------- */
export function StatusStrip({ items }) {
  return (
    <div className="status-strip">
      {items.map((item) => (
        <div key={item.label} className={`status-cell ${item.state ? `is-${item.state}` : "is-ok"}`}>
          <small>{item.label}</small>
          <strong>{item.value}</strong>
          <em>{item.ar}</em>
        </div>
      ))}
    </div>
  );
}
