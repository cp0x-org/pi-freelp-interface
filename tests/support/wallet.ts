import type { Page } from "@playwright/test";

// The header has one Connect wallet button: a single discovered wallet
// connects directly, several open a picker where `name` is chosen.
export async function connectWallet(page: Page, name?: string) {
  await page
    .locator("header")
    .getByRole("button", { name: "Connect wallet", exact: true })
    .click();
  if (name)
    await page
      .getByRole("dialog")
      .getByRole("button", { name: `Connect ${name}`, exact: true })
      .click();
}
