"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { logout } from "@/app/(auth)/login/actions";
import type { UserRole } from "@/lib/types";

type NavItem = { href: string; label: string };
type NavGroup = { title?: string; items: NavItem[] };

const NAV: Record<UserRole, NavGroup[]> = {
  admin: [
    {
      items: [
        { href: "/", label: "Tableau de bord" },
        { href: "/projets", label: "Ouvertures" },
      ],
    },
    {
      title: "Réseau",
      items: [
        { href: "/reseau", label: "Magasins" },
        { href: "/reseau/franchises", label: "Franchisés" },
      ],
    },
    {
      title: "Prospection",
      items: [
        { href: "/villes", label: "Villes" },
        { href: "/candidats", label: "Candidats" },
        { href: "/annonces", label: "Annonces" },
      ],
    },
    {
      title: "Contenu",
      items: [{ href: "/concept", label: "Concept Mediaclinic" }],
    },
    {
      title: "Administration",
      items: [
        { href: "/admin/users", label: "Utilisateurs" },
        { href: "/admin/template", label: "Template retroplanning" },
      ],
    },
  ],
  consultant: [
    {
      items: [
        { href: "/", label: "Tableau de bord" },
        { href: "/projets", label: "Ouvertures" },
      ],
    },
    {
      title: "Réseau",
      items: [
        { href: "/reseau", label: "Magasins" },
        { href: "/reseau/franchises", label: "Franchisés" },
      ],
    },
    {
      title: "Prospection",
      items: [
        { href: "/villes", label: "Villes" },
        { href: "/candidats", label: "Candidats" },
        { href: "/annonces", label: "Annonces" },
      ],
    },
    {
      title: "Contenu",
      items: [{ href: "/concept", label: "Concept Mediaclinic" }],
    },
  ],
  franchise: [
    {
      items: [{ href: "/mon-projet", label: "Mon projet" }],
    },
  ],
  responsable_mc: [
    {
      items: [
        { href: "/", label: "Tableau de bord" },
        { href: "/projets", label: "Ouvertures" },
      ],
    },
    {
      title: "Réseau",
      items: [
        { href: "/reseau", label: "Magasins" },
        { href: "/reseau/franchises", label: "Franchisés" },
      ],
    },
    {
      title: "Prospection",
      items: [{ href: "/villes", label: "Villes" }],
    },
  ],
};

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function NavContent({
  groups,
  userName,
  pathname,
  onNavigate,
}: {
  groups: NavGroup[];
  userName: string;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-zinc-200 px-5">
        <Image
          src="/Logo-MediaClinic-Noir.png"
          alt="Mediaclinic"
          width={160}
          height={40}
          className="w-full object-contain object-left"
          priority
        />
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {groups.map((group, gi) => (
          <div key={gi} className="space-y-1">
            {group.title && (
              <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                {group.title}
              </p>
            )}
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`block rounded-md px-2 py-1.5 text-sm ${
                  isActive(pathname, item.href)
                    ? "bg-brand/10 font-medium text-brand"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="border-t border-zinc-200 p-3">
        <p className="px-2 pb-1 text-sm font-medium text-zinc-700 truncate">
          {userName}
        </p>
        <form action={logout}>
          <button
            type="submit"
            className="w-full rounded-md px-2 py-1.5 text-left text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
          >
            Déconnexion
          </button>
        </form>
      </div>
    </div>
  );
}

export function Sidebar({
  role,
  userName,
  fonction,
}: {
  role: UserRole;
  userName: string;
  fonction?: string | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isMarketing =
    role === "responsable_mc" &&
    !!fonction?.toLowerCase().includes("marketing");

  const groups =
    role === "responsable_mc" && isMarketing
      ? [
          {
            items: [
              { href: "/", label: "Tableau de bord" },
              { href: "/projets", label: "Ouvertures" },
            ],
          },
          {
            title: "Prospection",
            items: [{ href: "/villes", label: "Villes" }],
          },
          {
            title: "Contenu",
            items: [{ href: "/concept", label: "Concept Mediaclinic" }],
          },
        ]
      : NAV[role];

  return (
    <>
      {/* Colonne fixe (desktop) */}
      <aside className="hidden w-60 shrink-0 border-r border-zinc-200 bg-white md:block">
        <div className="sticky top-0 h-screen">
          <NavContent
            groups={groups}
            userName={userName}
            pathname={pathname}
          />
        </div>
      </aside>

      {/* Barre supérieure (mobile) */}
      <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 md:hidden">
        <Image src="/Logo-MediaClinic-Noir.png" alt="Mediaclinic" width={110} height={30} className="object-contain" />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le menu"
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700"
        >
          Menu
        </button>
      </div>

      {/* Tiroir (mobile) */}
      {open && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <NavContent
              groups={groups}
              userName={userName}
              pathname={pathname}
              onNavigate={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
