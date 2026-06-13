import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  aside?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, aside }: PageHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-amber-600">
          {eyebrow}
        </p>
        <h1 className="text-3xl font-extrabold leading-none tracking-tight text-slate-900">
          {title}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {aside}
    </div>
  );
}

