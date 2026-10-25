import { useId, useRef } from "react";
import { useSession } from "./session";
import { errorMessage } from "./errors";
import type { Wallet } from "./types";

// One button for any number of wallets: a single wallet connects directly,
// several open a picker.
export function WalletConnectButton({
  className = "primary-button empty-connect",
}: {
  className?: string;
}) {
  const session = useSession();
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  async function connect(wallet: Wallet) {
    try {
      await session.connect(wallet);
      dialog.current?.close();
    } catch (error) {
      session.setStatus(errorMessage(error));
    }
  }
  return (
    <>
      <button
        className={className}
        onClick={() => {
          if (session.wallets.length === 1) void connect(session.wallets[0]);
          else dialog.current?.showModal();
        }}
      >
        Connect wallet
      </button>
      <dialog ref={dialog} className="wallet-dialog" aria-labelledby={titleId}>
        <div className="row spread">
          <h2 id={titleId}>Connect wallet</h2>
          <button
            aria-label="Close wallet dialog"
            onClick={() => dialog.current?.close()}
          >
            ×
          </button>
        </div>
        <div className="wallet-options">
          {session.wallets.map((wallet) => (
            <button key={wallet.info.uuid} onClick={() => void connect(wallet)}>
              Connect {wallet.info.name}
            </button>
          ))}
        </div>
        {!session.wallets.length ? (
          <p>
            Open this app in your wallet’s browser or enable a browser wallet to
            connect.
          </p>
        ) : null}
      </dialog>
    </>
  );
}
