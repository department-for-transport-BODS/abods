import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";
import { useConfig } from "@/contexts/ConfigContext";

export const UserAccount = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const { logout, clearUser } = useAuth();
  const { config } = useConfig();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = async (event: React.MouseEvent) => {
    event.preventDefault();
    if (!config?.apiUrl) {
      clearUser();
      console.error("API URL is not configured. Cannot perform logout.");
      router.push("/500");
      return;
    }
    await logout();
    router.push("/login");
  };

  const handleInviteClick = () => {
    window.open(`${config?.bodsBaseUrl}/account/manage/invite/`, "_blank");
  };

  return (
    <div className="user-account">
      <button
        onClick={handleInviteClick}
        className="user-account__invite-button button-link"
      >
        <div>
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M10 0C9.448 0 9 0.448 9 1V9H1C0.448 9 0 9.448 0 10C0 10.552 0.448 11 1 11H9V19C9 19.552 9.448 20 10 20C10.552 20 11 19.552 11 19V11H19C19.552 11 20 10.552 20 10C20 9.448 19.552 9 19 9H11V1C11 0.448 10.552 0 10 0Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <span>Invite a new user</span>
      </button>

      <div className="user-account__menu-container" id="user-account-menu">
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className="user-account__trigger button-link"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M12 12C15.3141 12 18 9.31406 18 6C18 2.68594 15.3141 0 12 0C8.68594 0 6 2.68594 6 6C6 9.31406 8.68594 12 12 12ZM16.2 13.5H15.4172C14.3766 13.9781 13.2188 14.25 12 14.25C10.7812 14.25 9.62813 13.9781 8.58281 13.5H7.8C4.32187 13.5 1.5 16.3219 1.5 19.8V21.75C1.5 22.9922 2.50781 24 3.75 24H20.25C21.4922 24 22.5 22.9922 22.5 21.75V19.8C22.5 16.3219 19.6781 13.5 16.2 13.5Z"
              fill="currentColor"
            />
          </svg>
          My account
        </button>

        {isOpen && (
          <div ref={menuRef} className="user-account__menu">
            <ul className="govuk-list">
              <li>
                <button onClick={handleLogout} className="button-link">
                  Logout
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
