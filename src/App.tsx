import { useCopied } from "./useCopied";
import { Cp0xFooter, Cp0xHeaderLink, CP0X_URL, PI_URL } from "./Cp0xFooter";
import { AccountControl } from "./AccountControl";
import { useEffect, useRef, useState } from "react";
import { useSession } from "./session";
import { SettingsPage } from "./SettingsPage";
import { TermsPage } from "./TermsPage";
import { DeployPage, DeployRedirect, InvalidDeployLink } from "./DeployPage";
import {
  parseDeployRoute,
  type DeployRoute as DeployRouteTarget,
} from "./routes";
import { CreatePage } from "./CreatePage";
import { PositionsPage } from "./PositionsPage";
import {
  CONTRACTS_SOURCE,
  REPOSITORY_URL,
  UPSTREAM_APP_URL,
  UPSTREAM_REPOSITORY_URL,
} from "./version";
function AboutPage() {
  return (
    <section className="about-page">
      <h2>About FreeLP</h2>
      <p>
        This is the cp0x edition of FreeLP, an ownerless liquidity position
        manager for Ekubo on EVM networks. cp0x hosts it as one of its{" "}
        <a href={PI_URL} target="_blank" rel="noreferrer">
          Permissionless Interfaces
        </a>
        : open frontends with no application fees and no tracking. It talks only
        to the RPC endpoints you configure and the wallet you connect.
      </p>
      <h3>cp0x edition</h3>
      <p>
        Source:{" "}
        <a href={REPOSITORY_URL} target="_blank" rel="noreferrer">
          github.com/cp0x-org/pi-freelp-interface
        </a>
        . It adds cp0x branding, Docker packaging and per-deployment RPC
        defaults; the contracts and transaction logic are unchanged.
      </p>
      <h3>Run locally</h3>
      <Command command="git clone https://github.com/cp0x-org/pi-freelp-interface && cd pi-freelp-interface && cp config.example.json config.json && docker compose up -d --build" />
      <p>
        Then open <code>http://127.0.0.1:4173/</code>. Your wallet signs
        transactions in the browser.
      </p>
      <h3>Original FreeLP</h3>
      <p>
        FreeLP is developed by Ekubo. For reference, the original app is at{" "}
        <a href={UPSTREAM_APP_URL} target="_blank" rel="noreferrer">
          freelp.ekubo.org
        </a>{" "}
        and its source at{" "}
        <a href={UPSTREAM_REPOSITORY_URL} target="_blank" rel="noreferrer">
          github.com/EkuboProtocol/freelp
        </a>
        . Contracts are pinned to{" "}
        <a
          href={`https://github.com/${CONTRACTS_SOURCE.repository}/commit/${CONTRACTS_SOURCE.commit}`}
          target="_blank"
          rel="noreferrer"
        >
          {CONTRACTS_SOURCE.repository}@{CONTRACTS_SOURCE.commit.slice(0, 7)}
        </a>
        .
      </p>
      <p>
        Contract addresses are fixed by this build. Each network's Deploy page
        shows them next to a code check against the bundled artifacts.
      </p>
      <h3>Data and privacy</h3>
      <p>
        Everything on-chain comes from the RPC endpoints configured in Networks.
        Network preferences and imported token metadata stay in this browser.
        Loading the hosted site involves distribution traffic; nothing else
        leaves the browser.
      </p>
      <h3>Licenses</h3>
      <p className="row">
        <a href="./licenses/freelp.txt">MIT license</a>
        <a href="./licenses/contracts.txt">Contract license</a>
        <a href="./licenses/dependencies.txt">Dependency notices</a>
      </p>
    </section>
  );
}
function DeployRoute({ target }: { target: DeployRouteTarget }) {
  if (target.kind === "chain") return <DeployPage chainId={target.chainId} />;
  if (target.kind === "active") return <DeployRedirect />;
  return <InvalidDeployLink />;
}
function Page({ route }: { route: string }) {
  const deploy = parseDeployRoute(route);
  if (deploy) return <DeployRoute target={deploy} />;
  switch (route.split("?")[0]) {
    case "#/settings":
    case "#/networks":
      return <SettingsPage />;
    case "#/terms":
      return <TermsPage />;
    case "#/create":
      return <CreatePage />;
    case "#/build":
      return <AboutPage />;
    default:
      return <PositionsPage route={route} />;
  }
}
export function App() {
  const session = useSession();
  const [route, setRoute] = useState(location.hash);
  useEffect(() => {
    const update = () => setRoute(location.hash);
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  return (
    <main>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        Skip to content
      </a>
      <header>
        <div className="brand">
          <h1>
            <a href="#/positions">FreeLP</a>
          </h1>
          <Cp0xHeaderLink />
        </div>
        <MainNavigation route={route} />
        <AccountControl />
      </header>
      {session.status ? (
        <div className="notification-toast" aria-label="Notification">
          <p role="status" className="status" tabIndex={0}>
            {session.status}
          </p>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => session.setStatus("")}
          >
            ×
          </button>
        </div>
      ) : null}
      <div id="main-content" tabIndex={-1}>
        <Page
          key={route.split("?")[0].split("/")[1] || "positions"}
          route={route}
        />
      </div>
      <footer className="row">
        <a href="#/terms">Terms</a>
        <a href="#/build">About FreeLP</a>
        <span className="free-forever">
          No application fees. Network gas costs apply.
        </span>
      </footer>
      <Cp0xFooter />
    </main>
  );
}

function MainNavigation({ route }: { route: string }) {
  const [open, setOpen] = useState(false);
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!nav.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);
  return (
    <nav
      ref={nav}
      className={open ? "main-nav open" : "main-nav"}
      aria-label={"Main navigation"}
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
    >
      <button
        type="button"
        className="menu-toggle"
        aria-label="Menu"
        aria-expanded={open}
        aria-controls="main-nav-links"
        onClick={() => setOpen(!open)}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22">
          <path
            d="M3 6h18M3 12h18M3 18h18"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      </button>
      <div
        id="main-nav-links"
        className="main-nav-links"
        onClick={() => setOpen(false)}
      >
        <a
          href="#/positions"
          aria-current={
            route.startsWith("#/positions") || !route ? "page" : undefined
          }
        >
          Positions
        </a>
        <a
          href="#/networks"
          aria-current={
            route.startsWith("#/networks") || route.startsWith("#/settings")
              ? "page"
              : undefined
          }
        >
          Networks
        </a>
        <a
          className="external-link"
          href={CP0X_URL}
          target="_blank"
          rel="noreferrer"
        >
          cp0x
        </a>
        <a
          className="external-link"
          href={PI_URL}
          target="_blank"
          rel="noreferrer"
        >
          Permissionless Interfaces
        </a>
      </div>
    </nav>
  );
}

function Command({ command }: { command: string }) {
  const [copied, showCopied] = useCopied();
  const [error, setError] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      showCopied();
    } catch {
      setError("Select and copy the command manually.");
    }
  }
  return (
    <>
      <div className="command">
        <code>{command}</code>
        <button onClick={() => void copy()}>
          {copied ? "Copied" : "Copy command"}
        </button>
      </div>
      <span role="status">{error}</span>
    </>
  );
}
