import Link from "next/link";
import { useRouter } from "next/router";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/feed-monitoring", label: "Feed monitoring" },
  { href: "/on-time", label: "On-time" },
  { href: "/corridors", label: "Corridors" },
  { href: "/vehicle-journeys", label: "Vehicle journeys" },
  { href: "/data-monitoring", label: "Data monitoring" },
  { href: "/stop-analysis", label: "Stop analysis" },
  { href: "/service-monitoring", label: "Service monitoring" },
  { href: "/distances", label: "Distances" },
];

export const Nav = () => {
  const router = useRouter();

  return (
    <nav id="navigation" className="app__nav" aria-label="Primary">
      <ul className="govuk-list app__nav-list">
        {navItems.map((item) => {
          const isActive = router.pathname === item.href;
          return (
            <li
              key={item.href}
              className={
                isActive
                  ? "app__nav-item app__nav-item--active"
                  : "app__nav-item"
              }
            >
              <Link href={item.href} className="govuk-link">
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
