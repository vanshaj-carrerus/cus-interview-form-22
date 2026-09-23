"use client";

import { useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";

const MAX_RESUME_BYTES = 5 * 1024 * 1024;

// text-base on mobile stops iOS Safari from zooming into inputs on focus
const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 sm:text-sm";
const textareaCls = `${inputCls} min-h-24 resize-y`;

function Section({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      {title && (
        <h2 className="mb-4 border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wider text-blue-900">
          {title}
        </h2>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  full,
  required,
  children,
}: {
  label: string;
  htmlFor?: string;
  full?: boolean;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
    </div>
  );
}

type Status = { type: "idle" | "loading" | "success" | "error"; message?: string };

export default function InterviewForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [nightShift, setNightShift] = useState("");
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState<Status>({ type: "idle" });

  function addSkill() {
    const parts = skillInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) return;
    setSkills((prev) => {
      const next = [...prev];
      for (const p of parts) {
        if (!next.some((s) => s.toLowerCase() === p.toLowerCase())) next.push(p);
      }
      return next;
    });
    setSkillInput("");
  }

  function onSkillKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  }

  function resetForm() {
    formRef.current?.reset();
    setSkills([]);
    setSkillInput("");
    setNightShift("");
    setFileName("");
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("skills", JSON.stringify(skills));
    fd.set("nightShift", nightShift);

    const resume = fd.get("resume");
    if (resume instanceof File && resume.size > MAX_RESUME_BYTES) {
      setStatus({ type: "error", message: "Resume must be 5 MB or smaller." });
      return;
    }

    setStatus({ type: "loading" });
    try {
      const res = await fetch("/api/apply", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || "Something went wrong");
      resetForm();
      setStatus({ type: "success", message: "Application submitted successfully. Thank you!" });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setStatus({ type: "error", message: err instanceof Error ? err.message : "Something went wrong" });
    }
  }

  const busy = status.type === "loading";

  return (
    <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-4 sm:gap-5">
      {status.type === "success" && (
        <div role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {status.message}
        </div>
      )}

      <Section>
        <Field label="Position applying for" htmlFor="position" required>
          <input id="position" name="position" required className={inputCls} />
        </Field>
        <Field label="Applying date" htmlFor="applyingDate">
          <input id="applyingDate" name="applyingDate" type="date" className={inputCls} />
        </Field>
      </Section>

      <Section title="Personal details">
        <Field label="Full name" htmlFor="fullName" full required>
          <input id="fullName" name="fullName" autoComplete="name" required className={inputCls} />
        </Field>
        <Field label="Contact number" htmlFor="contactNumber" required>
          <input
            id="contactNumber"
            name="contactNumber"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            className={inputCls}
          />
        </Field>
        <Field label="Email address" htmlFor="email" required>
          <input id="email" name="email" type="email" autoComplete="email" required className={inputCls} />
        </Field>
        <Field label="Current address" htmlFor="currentAddress" full>
          <textarea id="currentAddress" name="currentAddress" autoComplete="street-address" className={textareaCls} />
        </Field>
      </Section>

      <Section title="About your application">
        <Field label="Why do you want to join us?" htmlFor="whyJoin" full>
          <textarea id="whyJoin" name="whyJoin" className={textareaCls} />
        </Field>
        <Field label="What do you know about this job role?" htmlFor="knowAboutRole" full>
          <textarea id="knowAboutRole" name="knowAboutRole" className={textareaCls} />
        </Field>
        <Field label="Why do you want to change your current/last job?" htmlFor="whyChange" full>
          <textarea id="whyChange" name="whyChange" className={textareaCls} />
        </Field>
        <Field label="Why should we hire you?" htmlFor="whyHire" full>
          <textarea id="whyHire" name="whyHire" className={textareaCls} />
        </Field>
      </Section>

      <Section title="Employment details">
        <Field label="Current / last employer" htmlFor="currentEmployer">
          <input id="currentEmployer" name="currentEmployer" className={inputCls} />
        </Field>
        <Field label="Salary expectations" htmlFor="salaryExpectation">
          <input id="salaryExpectation" name="salaryExpectation" className={inputCls} />
        </Field>
      </Section>

      <Section title="General">
        <div className="sm:col-span-2">
          <p className="mb-2 text-sm font-medium text-slate-700">Are you willing to work night shifts?</p>
          <div className="flex gap-2">
            {["Yes", "No"].map((opt) => (
              <button
                key={opt}
                type="button"
                aria-pressed={nightShift === opt}
                onClick={() => setNightShift(nightShift === opt ? "" : opt)}
                className={`min-w-20 rounded-full border px-5 py-2 text-sm font-medium transition ${
                  nightShift === opt
                    ? "border-blue-700 bg-blue-700 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-blue-600"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
        <Field label="What is your ideal work environment?" htmlFor="idealEnvironment" full>
          <textarea id="idealEnvironment" name="idealEnvironment" className={textareaCls} />
        </Field>
      </Section>

      <Section title="Reference">
        <Field label="Reference name & contact" htmlFor="reference" full>
          <textarea id="reference" name="reference" className={textareaCls} />
        </Field>
      </Section>

      <Section title="Medical information">
        <Field label="Any medical issues (if applicable)" htmlFor="medicalIssues" full>
          <textarea id="medicalIssues" name="medicalIssues" className={textareaCls} />
        </Field>
      </Section>

      <Section title="Skills">
        <div className="sm:col-span-2">
          <label htmlFor="skillInput" className="mb-1.5 block text-sm font-medium text-slate-700">
            Add candidate skills
          </label>
          <div className="flex gap-2">
            <input
              id="skillInput"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={onSkillKey}
              placeholder="e.g. HTML"
              className={inputCls}
            />
            <button
              type="button"
              onClick={addSkill}
              className="shrink-0 rounded-lg bg-blue-900 px-4 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Add
            </button>
          </div>
          <p className="mt-1.5 text-xs text-slate-500">Press Enter or tap Add. Separate multiple skills with commas.</p>
          {skills.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {skills.map((s) => (
                <li key={s} className="flex items-center gap-1 rounded-full bg-blue-50 py-1 pl-3 pr-1 text-sm text-blue-900">
                  {s}
                  <button
                    type="button"
                    aria-label={`Remove ${s}`}
                    onClick={() => setSkills((prev) => prev.filter((x) => x !== s))}
                    className="grid size-6 place-items-center rounded-full text-blue-900/70 hover:bg-blue-100"
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-slate-400">No skills added yet.</p>
          )}
        </div>
      </Section>

      <Section title="Documents & dates">
        <Field label="Resume upload (PDF, max 5 MB)" htmlFor="resume">
          <label
            htmlFor="resume"
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5 text-sm hover:border-blue-600"
          >
            <span className="shrink-0 rounded-md bg-blue-900 px-3 py-1.5 text-xs font-semibold text-white">
              Choose file
            </span>
            <span className="truncate text-slate-600">{fileName || "No file chosen"}</span>
          </label>
          <input
            id="resume"
            name="resume"
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
          />
        </Field>
        <Field label="Joining date" htmlFor="joiningDate">
          <input id="joiningDate" name="joiningDate" type="date" className={inputCls} />
        </Field>
      </Section>

      {status.type === "error" && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {status.message}
        </div>
      )}

      {/* Sticky action bar on mobile so submit is always reachable */}
      <div className="sticky bottom-0 -mx-4 flex gap-3 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:justify-end sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <button
          type="button"
          onClick={() => {
            resetForm();
            setStatus({ type: "idle" });
          }}
          disabled={busy}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 sm:flex-none sm:py-2.5"
        >
          Clear form
        </button>
        <button
          type="submit"
          disabled={busy}
          className="flex-1 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 sm:flex-none sm:py-2.5"
        >
          {busy ? "Submitting…" : "Submit application"}
        </button>
      </div>
    </form>
  );
}
