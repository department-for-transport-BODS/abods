import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";
import { UserAccount } from "./UserAccount";
import { useHelpdesk } from "@/contexts/HelpdeskContext";

interface NavItem {
  href: string;
  label: string;
  requiresServiceMonitoring?: boolean;
  requiresDistances?: boolean;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/feed-monitoring", label: "NOC feed monitoring" },
  { href: "/on-time", label: "On-time performance" },
  { href: "/vehicle-journeys", label: "Vehicle journeys" },
  { href: "/corridors", label: "Corridors" },
  {
    href: "/service-monitoring",
    label: "Service monitoring",
    requiresServiceMonitoring: true,
  },
  { href: "/data-monitoring", label: "Data monitoring" },
  { href: "/stop-analysis", label: "Stop analysis" },
  { href: "/distances", label: "Distances", requiresDistances: true },
];

export const Nav = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { open: openHelpdesk } = useHelpdesk();

  const filteredNavItems = navItems.filter((item) => {
    if (item.requiresServiceMonitoring && !user?.canViewServiceMonitoring) {
      return false;
    }
    if (item.requiresDistances && !user?.canViewDistances) {
      return false;
    }
    return true;
  });

  return (
    <nav id="navigation" className="nav app-nav" aria-label="Primary">
      <div className="nav__block" id="nav">
        <ul className="govuk-list nav__list">
          {filteredNavItems.map((item) => {
            const isActive = router.pathname === item.href;
            return (
              <li key={item.href} className="nav__item">
                <Link
                  href={item.href}
                  className={
                    isActive ? "nav__link nav__link--current" : "nav__link"
                  }
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="nav__menu-bottom">
        <button
          className="nav__menu-bottom__action-item button-link"
          onClick={openHelpdesk}
          aria-label="Help"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M10 0C4.486 0 0 4.486 0 10C0 15.514 4.486 20 10 20C15.514 20 20 15.514 20 10C20 4.486 15.514 0 10 0ZM10 18C5.589 18 2 14.411 2 10C2 5.589 5.589 2 10 2C14.411 2 18 5.589 18 10C18 14.411 14.411 18 10 18Z"
              fill="currentColor"
            />
            <path
              d="M10 15C9.448 15 9 15.448 9 16C9 16.552 9.448 17 10 17C10.552 17 11 16.552 11 16C11 15.448 10.552 15 10 15Z"
              fill="currentColor"
            />
            <path
              d="M10 4C8.346 4 7 5.346 7 7H9C9 6.449 9.449 6 10 6C10.551 6 11 6.449 11 7C11 7.551 10.551 8 10 8C9.448 8 9 8.448 9 9V12H11V9.816C12.161 9.403 13 8.302 13 7C13 5.346 11.654 4 10 4Z"
              fill="currentColor"
            />
          </svg>
          Help
        </button>
        <UserAccount />
      </div>
    </nav>
  );
};
