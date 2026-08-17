"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/(auth)/login/actions";
import type { UserRole } from "@/lib/types";

type NavItem = { href: string; label: string };

const NAV: Record<UserRole, NavItem[]> = {
  admin: [
    { href: "/", label: "Tableau de bord" },
    { href: "/projets", label: "Projets" },
    { href: "/villes", label: "Villes" },
    { href: "/candidats", label: "Candidats" },
    { href: "/admin/users", label: "Utilisateurs" },
  ],
  consultant: [
    { href: "/", label: "Tableau de bord" },
    { href: "/projets", label: "Projets" },
    { href: "/villes", label: "Villes" },
    { href: "/candidats", label: "Candidats" },
  ],
  franchise: [{ href: "/mon-projet", label: "Mon projet" }],
};

export function Sidebar({
  role,
  userName,
}: {
  role: UserRole;
  userName: string;
}) {
  const pathname = usePathname();
  const items = NAV[role];

  return (
    <aside className="flex w-56 flex-col shrink-0 border-r border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-4 py-4">
        <span className="text-sm font-bold text-zinc-900 tracking-tight">
          Mediaclinic
        </span>
        <p className="text-xs text-zinc-400 mt-0.5">Ouvertures</p>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {items.map(({ href, label }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-200 p-3 space-y-1">
        <p className="px-3 text-xs font-medium text-zinc-500 truncate">
          {userName}
        </p>
        <form action={logout}>
          <button
            type="submit"
            className="w-full rounded-md px-3 py-1.5 text-left text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
          >
            Déconnexion
          </button>
        </form>
      </div>
    </aside>
  );
}
