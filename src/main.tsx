import { createRoot } from "react-dom/client";
import { App } from "./App";
import { SessionProvider } from "./session";
import { AppErrorBoundary } from "./AppErrorBoundary";
import { loadRuntimeConfig } from "./runtimeConfig";
import "./styles.css";
import "./ux-layout.css";
// RPC defaults must be known before the first read, so render afterwards.
void loadRuntimeConfig().then(() =>
  createRoot(document.getElementById("root")!).render(
    <AppErrorBoundary>
      <SessionProvider>
        <App />
      </SessionProvider>
    </AppErrorBoundary>,
  ),
);
