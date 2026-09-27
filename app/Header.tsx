import { LogoPin, PeopleIcon } from "./icons";

// Top bar: logo, and (for admins) the button that opens group management.
export default function Header({ onPeople, peopleOpen }: { onPeople?: () => void; peopleOpen?: boolean }) {
  return (
    <header className="topbar">
      <div className="brand">
        <LogoPin />
        <span>ClotParcament</span>
      </div>
      {onPeople && (
        <button
          className={`icon-button${peopleOpen ? " active" : ""}`}
          onClick={onPeople}
          aria-label="Gestiona el grup"
          aria-expanded={peopleOpen}
        >
          <PeopleIcon />
        </button>
      )}
    </header>
  );
}
