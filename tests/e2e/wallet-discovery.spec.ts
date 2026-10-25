import { test, expect, type Page } from "@playwright/test";
import { connectWallet } from "../support/wallet";

const provider = () => ({
  request: async () => ["0x1111111111111111111111111111111111111111"],
});

test("an announced wallet suppresses the injected fallback even through a different window.ethereum wrapper", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const announced = {
      request: async () => ["0x1111111111111111111111111111111111111111"],
    };
    // Wallets commonly expose a distinct wrapper on window.ethereum.
    Object.defineProperty(window, "ethereum", {
      value: { request: () => announced.request() },
      configurable: true,
    });
    window.addEventListener("eip6963:requestProvider", () =>
      window.dispatchEvent(
        new CustomEvent("eip6963:announceProvider", {
          detail: {
            info: { uuid: "ambire", name: "Ambire" },
            provider: announced,
          },
        }),
      ),
    );
  });
  await page.goto("/#/build");
  await expectSingleWalletConnects(page);
});

test("a legacy-only injection still offers the injected wallet", async ({
  page,
}) => {
  await page.addInitScript((source) => {
    Object.defineProperty(window, "ethereum", {
      value: new Function(`return (${source})()`)(),
      configurable: true,
    });
  }, provider.toString());
  await page.goto("/#/build");
  await expectSingleWalletConnects(page);
});

test("several wallets share one header button and a picker", async ({
  page,
}) => {
  await page.addInitScript(() => {
    for (const name of ["MetaMask", "Rabby", "Phantom"])
      window.addEventListener("eip6963:requestProvider", () =>
        window.dispatchEvent(
          new CustomEvent("eip6963:announceProvider", {
            detail: {
              info: { uuid: name, name },
              provider: {
                request: async () => [
                  "0x1111111111111111111111111111111111111111",
                ],
              },
            },
          }),
        ),
      );
  });
  await page.goto("/#/build");
  const header = page.locator("header");
  await expect(header.getByRole("button", { name: /^Connect/ })).toHaveCount(1);
  await connectWallet(page, "Rabby");
  await expect(header.locator(".account-control")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

// With exactly one discovered wallet the header button connects directly;
// a second (for example a duplicate injected fallback) would open the picker.
async function expectSingleWalletConnects(page: Page) {
  // The legacy window.ethereum entry appears only after announcements had
  // time to arrive.
  await page.waitForTimeout(600);
  await connectWallet(page);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("header .account-control")).toBeVisible();
}
