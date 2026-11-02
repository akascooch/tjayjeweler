export const siteNavLinks = [
  { href: "/rings", label: "Rings" },
  { href: "/pendants-chains", label: "Chains" },
  { href: "/cuffs-bracelets", label: "Cuffs" },
  { href: "/custom", label: "Custom" },
] as const;

export function isSiteNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function shouldCloseMenuOnPath(pathname: string, previous: string | null) {
  return previous !== null && previous !== pathname;
}
