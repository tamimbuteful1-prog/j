import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  FileWarning,
  Wrench,
  GitBranch,
  Search,
  Users,
  Network,
  ClipboardCheck,
  Camera,
  FileText,
  StickyNote,
  Gauge,
  Lock,
  Building2,
  ArrowLeft,
  Check
} from "lucide-react";
import {
  ConfigurationTriangle,
  EvidenceGraph,
  EvidenceIntegrityGauge,
  RegulatorySignal,
  SlideHead,
  StatusStrip,
  Disclaimer,
  Eyebrow
} from "./components.jsx";
import {
  monitoredChanges,
  demoEvents,
  eventNodeMap,
  integrityAfter,
  baselineStatus,
  degradedStatus,
  layers,
  products,
  facility,
  mission,
  caseFlow,
  accountability,
  orgLevels,
  roles,
  operatorCan,
  operatorCannot,
  capa,
  searchQuery,
  searchResults,
  prototypeScope,
  prototypeProves,
  phases,
  impact,
  aiUses,
  nonClaims
} from "./data.js";

const captureIcons = {
  CAMERA: Camera,
  DOCUMENT: FileText,
  NOTE: StickyNote,
  READING: Gauge
};

/* =================================================================
   01 — Hook  (§53, §54)
================================================================= */
function HookSlide() {
  return (
    <section className="slide hero">
      <Eyebrow>NUCLEAR REGULATORY INTELLIGENCE</Eyebrow>

      <h1>
        الخطر النووي
        <br />
        لا يبدأ دائمًا <span>بحادث.</span>
      </h1>

      <p className="hero-lead">
        أحيانًا يبدأ بتغيير صغير لم يربطه أحد بما قبله:
        <br />
        وثيقة قديمة · اختبار ناقص · تعديل مؤقت · تكوين لم يعد مطابقًا.
      </p>

      <div className="hook-events">
        {["DOCUMENT", "MAINTENANCE", "TEST", "MODIFICATION"].map((t, i) => (
          <motion.span
            key={t}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.18, duration: 0.5 }}
          >
            {t}
          </motion.span>
        ))}
      </div>

      <motion.p
        className="hero-question"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}
      >
        ماذا لو استطعنا رؤية العلاقة قبل أن تضيع؟
      </motion.p>

      <motion.div
        className="hero-brand"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.9, duration: 0.7 }}
      >
        <strong>بُرهان</strong>
        <span>BURHAN · Regulatory Evidence Twin</span>
        <em>التوأم الرقابي الحي للمنشآت النووية</em>
      </motion.div>
    </section>
  );
}

/* =================================================================
   02 — The real problem  (§2, §4)
================================================================= */
function ProblemSlide() {
  return (
    <section className="slide">
      <SlideHead
        index="02"
        kicker="THE REAL PROBLEM"
        title="المنشأة النووية لا تبقى ثابتة"
        lead="كل تغيير منفرد قد يكون طبيعيًا. المشكلة تظهر حين تتراكم عدة تغيرات صغيرة على نفس نظام السلامة دون أن يربطها أحد ببعضها."
      />

      <div className="change-grid">
        {monitoredChanges.map((c, i) => (
          <motion.article
            key={c.id}
            className="change-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
          >
            <small>{c.id}</small>
            <h4>{c.ar}</h4>
            <span>{c.en}</span>
            <p>{c.q}</p>
          </motion.article>
        ))}
      </div>

      <div className="pull-quote">
        <ShieldAlert size={18} />
        السؤال الذي يحاول بُرهان الإجابة عنه: هل ما زالت الحالة الفعلية للمنشأة متسقة مع متطلبات
        التصميم والوثائق والأساس الذي بُني عليه الترخيص؟
      </div>
    </section>
  );
}

/* =================================================================
   03 — Configuration Integrity  (§3)
================================================================= */
function PrincipleSlide() {
  const [broken, setBroken] = useState(false);

  return (
    <section className="slide">
      <SlideHead
        index="03"
        kicker="CORE REGULATORY PRINCIPLE"
        title="Configuration Integrity"
        lead="الحفاظ على الاتساق بين متطلبات التصميم، والتهيئة الفعلية للمنشأة، والوثائق. أي اختلاف بين هذه الأضلاع الثلاثة هو انحراف في التهيئة."
      />

      <ConfigurationTriangle broken={broken} />

      <div className="principle-footer">
        <button
          type="button"
          className={`toggle-btn ${broken ? "is-on" : ""}`}
          onClick={() => setBroken((v) => !v)}
        >
          {broken ? "إعادة الاتساق" : "محاكاة انحراف في التهيئة"}
        </button>

        <code className={broken ? "deviation" : ""}>
          {broken
            ? "DESIGN ≠ PHYSICAL ≠ DOCUMENTATION → CONFIGURATION DEVIATION"
            : "DESIGN = PHYSICAL = DOCUMENTATION"}
        </code>
      </div>
    </section>
  );
}

/* =================================================================
   04 — Evidence chain  (§13)
================================================================= */
function ChainSlide() {
  return (
    <section className="slide">
      <SlideHead
        index="04"
        kicker="EVIDENCE GRAPH"
        title="ربط الدليل بالمتطلب الذي يثبته"
        lead="الابتكار ليس في وجود البيانات — البيانات موجودة. الابتكار هو معرفة أي دليل يثبت أي متطلب، وما الذي يحدث عندما يتغير أحدهما."
      />

      <EvidenceGraph />
    </section>
  );
}

/* =================================================================
   05 — Live scenario  (§5-§11, §45-§47)
================================================================= */
function DemoSlide() {
  const [step, setStep] = useState(0);
  const [opened, setOpened] = useState(false);

  const value = integrityAfter(step);
  const active = demoEvents.slice(0, step);

  const flags = {};
  active.forEach((e) => {
    if (e.status !== "normal") flags[eventNodeMap[e.id]] = e.status === "critical" ? "crit" : "warn";
    else flags[eventNodeMap[e.id]] = "ok";
  });

  const factors = [
    step >= 2 && "Procedure mismatch",
    step >= 3 && "Verification incomplete",
    step >= 4 && "Temporary modification overdue"
  ].filter(Boolean);

  return (
    <section className="slide">
      <SlideHead
        index="05"
        kicker="LIVE SCENARIO · EMERGENCY COOLING SYSTEM"
        title="أربعة أحداث على نفس نظام السلامة"
        lead="نظام افتراضي: Cooling System CS-01 — المضخة P-04. شغّل الأحداث واحدًا تلو الآخر وراقب سلسلة الأدلة."
      />

      <div className="demo-controls">
        <button
          type="button"
          className="primary-btn"
          onClick={() => setStep((s) => Math.min(demoEvents.length, s + 1))}
          disabled={step >= demoEvents.length}
        >
          {step === 0 ? "ابدأ المحاكاة" : step >= demoEvents.length ? "اكتملت الأحداث" : "الحدث التالي ←"}
        </button>
        <button
          type="button"
          className="ghost-btn"
          onClick={() => {
            setStep(0);
            setOpened(false);
          }}
        >
          إعادة الضبط
        </button>
        <span className="step-counter">
          {String(step).padStart(2, "0")} / {String(demoEvents.length).padStart(2, "0")}
        </span>
      </div>

      <StatusStrip items={step >= demoEvents.length ? degradedStatus : baselineStatus} />

      <div className="demo-body">
        <div className="demo-left">
          <EvidenceIntegrityGauge value={value} />
          <Disclaimer>
            <span className="en">Prototype Regulatory Prioritization Indicator</span>
            <span className="en">Not an official nuclear safety rating</span>
            <span>مؤشر تجريبي داخل النموذج الأولي لترتيب الأولويات فقط.</span>
          </Disclaimer>
        </div>

        <div className="demo-right">
          <ol className="event-timeline">
            {demoEvents.map((event, i) => {
              const isActive = i < step;
              return (
                <li
                  key={event.id}
                  className={`event-item ${isActive ? `is-active is-${event.status}` : "is-idle"}`}
                >
                  <div className="event-time">
                    <span>{event.time}</span>
                    <small>{event.code}</small>
                  </div>
                  <div className="event-body">
                    <h4>{event.title}</h4>
                    <strong>{event.titleAr}</strong>
                    {isActive ? (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        transition={{ duration: 0.35 }}
                      >
                        {event.descriptionAr}
                        <em>{event.description}</em>
                      </motion.p>
                    ) : null}
                  </div>
                  <div className="event-impact">
                    {isActive ? (event.impact === 0 ? "±0" : event.impact) : "—"}
                  </div>
                </li>
              );
            })}
          </ol>

          <AnimatePresence>
            {step >= demoEvents.length ? (
              <RegulatorySignal factors={factors} opened={opened} onOpen={() => setOpened(true)} />
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <div className="demo-graph">
        <EvidenceGraph flags={flags} />
      </div>

      <div className="pull-quote">
        <FileWarning size={18} />
        بُرهان لا يقول «المنشأة غير آمنة» ولا «حادث نووي محتمل». يقول: عدة حالات أدلة غير محسومة تؤثر
        على نفس نظام السلامة، والمراجعة البشرية مطلوبة.
      </div>
    </section>
  );
}

/* =================================================================
   06 — Explainable AI  (§14, §15, §16)
================================================================= */
function ExplainSlide() {
  return (
    <section className="slide">
      <SlideHead
        index="06"
        kicker="EXPLAINABLE AI · HUMAN-IN-THE-LOOP"
        title="كل تنبيه يشرح نفسه"
        lead="الذكاء الاصطناعي هنا يكتشف ويربط ويرتّب ويفسّر — ولا يتخذ القرار النهائي."
      />

      <div className="two-col">
        <article className="xai-card">
          <div className="xai-head">
            <span className="signal-pulse warn" />
            REGULATORY ATTENTION
          </div>

          <dl>
            <div>
              <dt>Affected Requirement</dt>
              <dd>NR-04 · Residual Heat Removal capability</dd>
            </div>
            <div>
              <dt>Affected System</dt>
              <dd>Cooling System CS-01 · Pump P-04</dd>
            </div>
            <div>
              <dt>Evidence Conditions</dt>
              <dd>
                Procedure mismatch (Rev.07 vs Rev.08) · Post-maintenance verification not attached
              </dd>
            </div>
            <div>
              <dt>Related Changes</dt>
              <dd>Maintenance 08:30 · TM-204 review overdue</dd>
            </div>
            <div>
              <dt>Original Evidence</dt>
              <dd>Maintenance record MR-7741 · Procedure MNT-204 · Modification register</dd>
            </div>
            <div>
              <dt>Human Approval Status</dt>
              <dd className="pending">PENDING — Supervisor review required</dd>
            </div>
          </dl>

          <p className="xai-action">
            <strong>Recommended Action:</strong> Regulatory review required.
          </p>
        </article>

        <div className="stack">
          <div className="panel">
            <h3>
              <Network size={16} /> ما الذي يستخدم فيه الذكاء الاصطناعي؟
            </h3>
            <ul className="chip-list">
              {aiUses.map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
          </div>

          <div className="panel human-panel">
            <h3>
              <Users size={16} /> HUMAN-IN-THE-LOOP
            </h3>
            <p>
              بُرهان: يكتشف · يربط · يحلل · يرتب · يفسر.
              <br />
              أما القرار فيبقى للمفتش والخبير والجهة الرقابية.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =================================================================
   07 — Architecture  (§12)
================================================================= */
function ArchitectureSlide() {
  return (
    <section className="slide">
      <SlideHead
        index="07"
        kicker="HOW BURHAN WORKS"
        title="سبع طبقات، من البيانات إلى القرار البشري"
      />

      <div className="layer-stack">
        {layers.map((layer, i) => (
          <motion.div
            key={layer.id}
            className={`layer ${layer.human ? "is-human" : ""}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07, duration: 0.4 }}
          >
            <span className="layer-id">{layer.id}</span>
            <div className="layer-text">
              <h4>
                {layer.name} <em>{layer.ar}</em>
              </h4>
              <p>{layer.detail}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* =================================================================
   08 — Products  (§17, §50, §51)
================================================================= */
function ProductsSlide() {
  return (
    <section className="slide">
      <SlideHead
        index="08"
        kicker="APPLICATIONS"
        title="ثلاثة تطبيقات لثلاثة مستويات"
      />

      <div className="product-grid">
        {products.map((p) => (
          <article key={p.id} className="product-card">
            <small>{p.audience}</small>
            <h4>{p.name}</h4>
            <span>{p.ar}</span>
            <ul>
              {p.items.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="two-col mockups">
        <div className="mock mock-facility">
          <div className="mock-bar">
            <Building2 size={14} /> FACILITY REGULATORY PROFILE
          </div>
          <h4>{facility.name}</h4>
          <span className="mock-sub">{facility.ar}</span>

          <div className="mock-kpis">
            <div>
              <small>Authorization</small>
              <strong className="ok">{facility.authorization}</strong>
            </div>
            <div>
              <small>Evidence Integrity</small>
              <strong>{facility.integrity}</strong>
            </div>
            <div>
              <small>Open Cases</small>
              <strong>{facility.openCases}</strong>
            </div>
            <div>
              <small>Config. Deviations</small>
              <strong className="warn">{facility.deviations}</strong>
            </div>
            <div>
              <small>Pending Modifications</small>
              <strong>{facility.pendingMods}</strong>
            </div>
          </div>

          <div className="mock-systems">
            <div className="mock-bar sub">SYSTEM STATUS</div>
            {facility.systems.map((s) => (
              <div key={s.name} className="system-row">
                <span>
                  {s.name} <em>{s.ar}</em>
                </span>
                <b className={s.state.toLowerCase()}>{s.state}</b>
              </div>
            ))}
          </div>
        </div>

        <div className="mock mock-inspector">
          <div className="mock-bar">
            <ClipboardCheck size={14} /> BURHAN INSPECTOR · TODAY&apos;S MISSION
          </div>

          <div className="mission-id">
            CASE {mission.caseId}
            <em>{mission.system} · {mission.component}</em>
          </div>

          <p className="mission-objective">
            {mission.objectiveAr}
            <em>{mission.objective}</em>
          </p>

          <div className="mock-bar sub">CHECKLIST</div>
          <ul className="checklist">
            {mission.checklist.map((c) => (
              <li key={c.label} className={`mark-${c.mark}`}>
                <i>{c.mark === "done" ? "✓" : c.mark === "flag" ? "!" : "○"}</i>
                <span>
                  {c.label} <em>{c.ar}</em>
                </span>
              </li>
            ))}
          </ul>

          <div className="mock-bar sub">CAPTURE EVIDENCE</div>
          <div className="capture-row">
            {mission.capture.map((c) => {
              const Icon = captureIcons[c];
              return (
                <button type="button" key={c} disabled>
                  <Icon size={15} />
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <Disclaimer>كل الأسماء والأرقام في الشاشات أعلاه افتراضية داخل النموذج الأولي.</Disclaimer>
    </section>
  );
}

/* =================================================================
   09 — Case lifecycle + accountability  (§18, §19)
================================================================= */
function WorkflowSlide() {
  return (
    <section className="slide">
      <SlideHead
        index="09"
        kicker="REGULATORY CASE LIFECYCLE"
        title="من إشارة إلى حالة مغلقة موثّقة"
      />

      <ol className="flow-rail">
        {caseFlow.map((s, i) => (
          <motion.li
            key={s.en}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.35 }}
          >
            <span className="flow-index">{String(i + 1).padStart(2, "0")}</span>
            <strong>{s.en}</strong>
            <em>{s.ar}</em>
          </motion.li>
        ))}
      </ol>

      <div className="panel audit-panel">
        <h3>
          <Lock size={16} /> سلسلة المسؤولية · Audit Trail
        </h3>
        <p className="panel-lead">كل إجراء داخل بُرهان يسجَّل بالكامل ولا يُحذف.</p>
        <div className="audit-grid">
          {accountability.map((a) => (
            <div key={a.key} className="audit-cell">
              <small>{a.key}</small>
              <strong>{a.ar}</strong>
              <span>{a.sample}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =================================================================
   10 — Governance  (§20, §21, §22)
================================================================= */
function GovernanceSlide() {
  return (
    <section className="slide">
      <SlideHead
        index="10"
        kicker="GOVERNANCE · ACCESS CONTROL"
        title="الصلاحيات والفصل بين الجهة الرقابية والمشغل"
      />

      <div className="two-col">
        <div className="stack">
          <div className="panel">
            <h3>
              <Users size={16} /> المستويات التنظيمية
            </h3>
            <ol className="org-ladder">
              {orgLevels.map((l, i) => (
                <li key={l}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  {l}
                </li>
              ))}
            </ol>
          </div>

          <div className="panel">
            <h3>
              <Lock size={16} /> Role-Based Access Control
            </h3>
            <ul className="chip-list">
              {roles.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="stack">
          <div className="panel portal-panel">
            <h3>Regulator Portal ↔ Operator Portal</h3>
            <p className="panel-lead">
              المشغل يشارك في المعالجة، لكنه لا يرى التقييم الرقابي الداخلي.
            </p>

            <div className="portal-split">
              <div className="portal can">
                <small>المشغل يستطيع</small>
                <ul>
                  {operatorCan.map((i) => (
                    <li key={i}>
                      <Check size={13} /> {i}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="portal cannot">
                <small>ولا يرى</small>
                <ul>
                  {operatorCannot.map((i) => (
                    <li key={i}>
                      <Lock size={13} /> {i}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="panel capa-panel">
            <h3>
              <Wrench size={16} /> إدارة الإجراءات التصحيحية
            </h3>
            <div className="capa-card">
              <div className="capa-row">
                <small>Finding</small>
                <p>
                  {capa.finding}
                  <em>{capa.findingAr}</em>
                </p>
              </div>
              <div className="capa-row">
                <small>Required Action</small>
                <p>
                  {capa.action}
                  <em>{capa.actionAr}</em>
                </p>
              </div>
              <div className="capa-meta">
                <span>
                  Deadline <b>{capa.deadline}</b>
                </span>
                <span>
                  Status <b className="open">{capa.status}</b>
                </span>
              </div>
              <div className="capa-track">
                {capa.tracked.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =================================================================
   11 — Regulatory intelligence & memory  (§24, §25, §26)
================================================================= */
function IntelligenceSlide() {
  return (
    <section className="slide">
      <SlideHead
        index="11"
        kicker="REGULATORY INTELLIGENCE"
        title="من متابعة حالة منفردة إلى تعلّم رقابي مؤسسي"
      />

      <div className="two-col">
        <div className="stack">
          <div className="panel pattern-panel">
            <div className="pattern-head">
              <GitBranch size={16} /> EMERGING REGULATORY PATTERN
            </div>
            <p className="pattern-body">
              3 facilities showed similar maintenance documentation deviations.
            </p>
            <p className="pattern-rec">
              <strong>Recommended Regulatory Review:</strong> Review maintenance procedure governance
              across affected facilities.
            </p>
          </div>

          <div className="panel">
            <h3>Institutional Regulatory Memory · الذاكرة المؤسسية</h3>
            <ul className="chip-list">
              {[
                "القرارات السابقة",
                "سبب القرار",
                "الأدلة",
                "نتائج التفتيش",
                "الحالات المشابهة",
                "الإجراءات التصحيحية",
                "Lessons Learned"
              ].map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
            <p className="panel-lead">
              الهدف: ألا تضيع الخبرة الرقابية بخروج الأشخاص من المؤسسة.
            </p>
          </div>
        </div>

        <div className="panel search-panel">
          <h3>
            <Search size={16} /> البحث داخل الأدلة
          </h3>

          <div className="search-box">{searchQuery}</div>

          <div className="search-results">
            {searchResults.map((r, i) => (
              <motion.div
                key={r.id}
                className={`result-row tone-${r.tone}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.12 }}
              >
                <strong>{r.id}</strong>
                <span className="result-type">{r.type}</span>
                <span className="result-system">{r.system}</span>
                <span className="result-state">{r.state}</span>
                <small>مصدر المعلومة: {r.source}</small>
              </motion.div>
            ))}
          </div>

          <p className="panel-lead">
            كل نتيجة تعرض الحالة والمتطلب والمكوّن — ومصدر كل معلومة.
          </p>
        </div>
      </div>
    </section>
  );
}

/* =================================================================
   12 — Prototype scope & phases  (§27, §28)
================================================================= */
function ScopeSlide() {
  return (
    <section className="slide">
      <SlideHead
        index="12"
        kicker="CONTROLLED PROTOTYPE"
        title="لا يبدأ المشروع بمنشأة كاملة"
        lead="يبدأ بنظام سلامة واحد — نظام تبريد افتراضي — بنطاق محدود يمكن إثباته."
      />

      <div className="scope-row">
        {prototypeScope.map((s, i) => (
          <motion.div
            key={s.en}
            className="scope-cell"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <strong>{s.n}</strong>
            <span>{s.label}</span>
            <small>{s.en}</small>
          </motion.div>
        ))}
      </div>

      <div className="panel">
        <h3>الهدف: إثبات أن بُرهان يستطيع</h3>
        <ul className="chip-list">
          {prototypeProves.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>

      <div className="phase-rail">
        {phases.map((p, i) => (
          <motion.div
            key={p.n}
            className={`phase ${i === 0 ? "is-now" : ""}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.07 }}
          >
            <small>{p.n}</small>
            <strong>{p.en}</strong>
            <span>{p.ar}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* =================================================================
   13 — Impact  (§30)
================================================================= */
function ImpactSlide() {
  return (
    <section className="slide">
      <SlideHead index="13" kicker="IMPACT" title="ما الذي يتغيّر عمليًا؟" />

      <div className="impact-grid">
        {impact.map((i, idx) => (
          <motion.div
            key={i}
            className="impact-cell"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <span>{String(idx + 1).padStart(2, "0")}</span>
            {i}
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* =================================================================
   14 — Closing  (§55, §57, §58, §59, §60)
================================================================= */
function ClosingSlide() {
  return (
    <section className="slide closing">
      <SlideHead index="14" kicker="THE VISION" title="من نظام واحد إلى منصة رقابية وطنية" />

      <div className="vision-rail">
        <div>
          <small>TODAY</small>
          <strong>One Safety System</strong>
        </div>
        <ArrowLeft size={20} className="vision-arrow" />
        <div>
          <small>NEXT</small>
          <strong>Facility Regulatory Twin</strong>
        </div>
        <ArrowLeft size={20} className="vision-arrow" />
        <div className="is-future">
          <small>FUTURE</small>
          <strong>National Regulatory Evidence Platform</strong>
        </div>
      </div>

      <div className="two-col">
        <div className="panel claim-panel">
          <h3>ما لا يدّعيه بُرهان</h3>
          <ul className="no-list">
            {nonClaims.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>

        <div className="panel claim-panel is-yes">
          <h3>ما يقوله بُرهان</h3>
          <p>
            نربط الأدلة، نكشف التعارضات والفجوات، ونضع المعلومة الصحيحة أمام المختص في الوقت
            المناسب.
          </p>
        </div>
      </div>

      <blockquote className="closing-quote">
        كل قرار رقابي يحتاج إلى دليل.
        <br />
        وكل دليل يحتاج إلى سياق.
        <br />
        <strong>بُرهان يربط الاثنين.</strong>
      </blockquote>

      <div className="closing-brand">
        <strong>BURHAN</strong>
        <span>Regulatory Evidence Twin</span>
        <em>Evidence. Oversight. Continuity.</em>
      </div>

      <div className="cta">
        ابدأ بنظام واحد · اربط أول سلسلة أدلة · أثبت الفكرة · ثم توسّع.
      </div>
    </section>
  );
}

export const slides = [
  { id: "hook", nav: "الافتتاحية", Component: HookSlide },
  { id: "problem", nav: "المشكلة", Component: ProblemSlide },
  { id: "principle", nav: "المبدأ", Component: PrincipleSlide },
  { id: "chain", nav: "شبكة الأدلة", Component: ChainSlide },
  { id: "demo", nav: "المحاكاة", Component: DemoSlide },
  { id: "explain", nav: "التفسير", Component: ExplainSlide },
  { id: "architecture", nav: "البنية", Component: ArchitectureSlide },
  { id: "products", nav: "التطبيقات", Component: ProductsSlide },
  { id: "workflow", nav: "سير الحالة", Component: WorkflowSlide },
  { id: "governance", nav: "الحوكمة", Component: GovernanceSlide },
  { id: "intelligence", nav: "الذكاء الرقابي", Component: IntelligenceSlide },
  { id: "scope", nav: "النطاق والمراحل", Component: ScopeSlide },
  { id: "impact", nav: "الأثر", Component: ImpactSlide },
  { id: "closing", nav: "الخاتمة", Component: ClosingSlide }
];
