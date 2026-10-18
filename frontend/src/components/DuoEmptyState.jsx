import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";

export default function DuoEmptyState({ icon, title, description }) {
  return (
    <section className="rounded-3xl border border-gray-800 bg-gray-950 px-6 py-14 text-center text-white">
      <div aria-hidden="true" className="mb-5 flex justify-center text-fuchsia-400">
        {icon}
      </div>
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="mx-auto mt-3 max-w-md leading-relaxed text-gray-400">{description}</p>
      <Link
        to="/convidar"
        className="mt-7 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-fuchsia-600 px-5 py-3 text-sm font-semibold transition-colors hover:bg-fuchsia-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-400"
      >
        Convidar alguém <FiArrowRight aria-hidden="true" />
      </Link>
      <Link
        to="/aceitar"
        className="mt-4 block text-sm text-fuchsia-300 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-400"
      >
        Já tenho um convite
      </Link>
    </section>
  );
}
