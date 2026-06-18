import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";
import { useNav } from "@/contexts/NavContext";
import { UserAccount } from "./UserAccount";
import { useHelpdesk } from "@/contexts/HelpdeskContext";
import QuestionInCircleIcon from "@/assets/icons/question-in-circle.svg";

interface NavItem {
  href: string;
  label: string;
  requiresServiceMonitoring?: boolean;
  requiresDistances?: boolean;
}

const normalizePath = (path: string) =>
  path.split("?")[0].replace(/\/+$/, "") || "/";

const isActiveNavItem = (currentPath: string, itemPath: string) =>
  currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);

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
  const { isOpen, close } = useNav();
  const currentPath = normalizePath(router.asPath);

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
    <nav
      id="navigation"
      className={`nav app-nav${isOpen ? " nav--open" : ""}`}
      aria-label="Primary"
    >
      <div className="nav__block" id="nav">
        <ul className="govuk-list nav__list">
          {filteredNavItems.map((item) => {
            const isActive = isActiveNavItem(currentPath, item.href);
            return (
              <li key={item.href} className="nav__item">
                <Link
                  href={item.href}
                  onClick={close}
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
          <QuestionInCircleIcon aria-hidden width="20" height="20" />
          Help
        </button>
        <UserAccount />
      </div>
    </nav>
  );
};
