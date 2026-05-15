import React from "react";

export default function ResearchStatusBadge({
  value,
}: {
  value: string | null;
}) {
  const raw = (value || "").trim();
  const normalized = raw.toLowerCase();

  let classes =
    "inline-flex min-h-[28px] items-center justify-center whitespace-nowrap px-3 py-1 text-[11px] font-semibold border border-transparent leading-none";

  if (!normalized || normalized === "na" || normalized === "n/a") {
    classes += " border-slate-300 bg-slate-200 text-slate-700";
    return <span className={classes}>NA</span>;
  }

  if (normalized.includes("done")) {
    classes += " border-green-600 bg-green-600 text-white";
    return <span className={classes}>Done</span>;
  }

  if (normalized.includes("progress")) {
    classes += " border-blue-500 bg-blue-500 text-white";
    return <span className={classes}>In Progress</span>;
  }

  if (normalized.includes("need")) {
    classes += " border-rose-500 bg-rose-500 text-white";
    return <span className={classes}>Need Info</span>;
  }

  if (normalized.includes("tbd")) {
    classes += " border-slate-300 bg-slate-200 text-slate-700";
    return <span className={classes}>tbd</span>;
  }

  classes += " border-slate-300 bg-slate-200 text-slate-700";
  return <span className={classes}>{raw}</span>;
}