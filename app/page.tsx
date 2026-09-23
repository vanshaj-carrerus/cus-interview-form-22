import InterviewForm from "./components/InterviewForm";

export default function Home() {
  return (
    <main className="flex-1 bg-slate-100 px-4 pt-6 sm:py-10">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-5 sm:mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Custech Solutions</p>
          <h1 className="mt-1 text-2xl font-extrabold uppercase tracking-tight text-blue-900 sm:text-3xl">
            Job Application Form
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Candidate interview intake. Complete all sections; fields marked <span className="text-red-500">*</span> are
            required.
          </p>
        </header>
        <InterviewForm />
      </div>
    </main>
  );
}
