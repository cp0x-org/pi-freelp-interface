import { test, expect } from "@playwright/test";
import pkg from "../../package.json" with { type: "json" };
const { version } = pkg;
import source from "../../artifacts/source.json" with { type: "json" };
import { mockDeployments } from "../support/deploymentRpc";

test("the footer and header credit cp0x without the upstream GitHub link or version, and About holds one run command and the source pin", async ({
  page,
}) => {
  await mockDeployments(page);
  await page.goto("/#/networks");
  const footer = page.locator("footer");
  await expect(footer.getByText(`v${version}`)).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "FreeLP on GitHub" }),
  ).toHaveCount(0);
  const header = page.locator("header");
  for (const name of ["FreeLP", "FreeLP by cp0x, home"])
    await expect(
      header.getByRole("link", { name, exact: true }),
    ).toHaveAttribute("href", "#/positions");
  await expect(
    header.getByRole("link", { name: "cp0x", exact: true }),
  ).toHaveAttribute("href", "https://cp0x.com/");
  await expect(
    header.getByRole("link", {
      name: "Permissionless Interfaces",
      exact: true,
    }),
  ).toHaveAttribute("href", "https://pi.cp0x.com/");
  await expect(
    page.getByRole("link", { name: "cp0x on GitHub" }),
  ).toHaveAttribute("href", "https://github.com/cp0x-org");
  await footer.getByRole("link", { name: "About FreeLP" }).click();
  await expect(
    page.getByRole("heading", { name: "About FreeLP", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Build details")).toHaveCount(0);
  await expect(page.locator(".command")).toHaveCount(1);
  await expect(page.locator("#main-content")).not.toContainText(
    /0x[0-9a-fA-F]{40}/,
  );
  const about = page.locator(".about-page");
  await expect(about).not.toContainText(version);
  await expect(
    about.getByText("This is the cp0x edition of FreeLP"),
  ).toBeVisible();
  await expect(
    about.getByRole("link", {
      name: "github.com/cp0x-org/pi-freelp-interface",
    }),
  ).toHaveAttribute("href", "https://github.com/cp0x-org/pi-freelp-interface");
  await expect(
    about.getByRole("link", { name: "github.com/EkuboProtocol/freelp" }),
  ).toHaveAttribute("href", "https://github.com/EkuboProtocol/freelp");
  await expect(
    page.getByRole("link", {
      name: `${source.repository}@${source.commit.slice(0, 7)}`,
    }),
  ).toHaveAttribute(
    "href",
    `https://github.com/${source.repository}/commit/${source.commit}`,
  );
  for (const name of ["MIT license", "Contract license", "Dependency notices"])
    await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
});
