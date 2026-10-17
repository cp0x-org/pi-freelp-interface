# Permissionless FreeLP Interface by cp0x

A mirror of [FreeLP](https://github.com/EkuboProtocol/freelp), Ekubo's ownerless, zero-fee liquidity position manager, hosted by cp0x at https://freelp.cp0x.com as one of its permissionless interfaces (https://pi.cp0x.com). The app is the upstream release v0.1.20 with two changes: a "Hosted by cp0x" section on the About page and the Docker build below. cp0x adds no fees.

## Build and run

```sh
bash build.sh 0.1.0   # builds and pushes cp0x/pi-freelp-interface:0.1.0 for linux/amd64 and linux/arm64
docker run --rm -p 4173:4173 cp0x/pi-freelp-interface:0.1.0
```

The image serves the static build on port 4173. Build on Linux or inside Docker: the upstream tree has `src/positionArtwork.ts` and `src/PositionArtwork.tsx`, whose names collide on case-insensitive file systems such as the macOS default, and `tsc` fails there.

## Updating from upstream

```sh
git remote add upstream https://github.com/EkuboProtocol/freelp.git
git fetch upstream --tags
git merge --allow-unrelated-histories v<new version>   # needed once: this repository starts from an import commit
```

The import leaves out upstream `.github/workflows` (Ekubo's IPFS deploy for freelp.ekubo.org); drop them again after a merge. GitHub Actions are disabled in this repository.

Contract addresses are fixed by each upstream release. A new contract revision uses a new manager address, and positions opened in an earlier manager stay there (see upstream `docs/contracts.md`).

---

# FreeLP

Try it at https://freelp.ekubo.org/ — no install needed.

Manage EVM liquidity positions using only RPC endpoints and your wallet. No application fees, indexers, hosted token APIs, or API keys. Position data and NFT metadata live on-chain.

## Run

```sh
bunx @ekubo/freelp@latest
# or
npx @ekubo/freelp@latest
```

The package serves the app locally and opens your browser. Requires Node.js 22+; the Bun command also requires Bun. Use `--no-browser` to skip opening the browser or `--port 4173` to choose a port.

You can also open an IPFS build from the **IPFS preview** commit status or GitHub Actions summary.

## Use

Connect your wallet to view positions across enabled networks, or open any position by ID at `#/positions/<chainId>/<id>` without a wallet; only its owner can sign. Create a position by selecting a network, tokens, pool, and price range. Deposit amounts are calculated locally; the liquidity chart supports hover, zoom, and range selection, and new pools require an explicit initial price. Add liquidity, withdraw, or claim fees from your positions. Withdrawing all liquidity burns the FreeLP NFT; fee collection preserves it.

Robinhood Chain, Base, Arbitrum, and Ethereum are enabled by default, since those carry this build's contracts and registered pools. Other networks can be enabled in Networks after a code check against this build; enabling reads the chain ID and the five required contracts once, and missing, incompatible, or unreachable networks stay disabled with an explanation. Listing or disabling networks makes no RPC requests, and failed checks are never remembered. Position and token transactions go straight to the wallet without RPC pre-checks, so a busy RPC cannot block a withdrawal.

Once loaded, the app talks only to your configured RPC endpoints and wallet. Your wallet confirms every submission and sets the gas; the app does not simulate transactions. Submitted hashes stay in this browser's activity; use **Check status** instead of repeating an action. Import tokens by address using their on-chain metadata. If a network is missing contracts, deploy them from `#/deploy/<chainId>`; deployment never enables the network.

This contract revision uses a new manager address. Existing NFTs remain in their original manager and require a compatible pinned release to manage them; upgrading the UI does not move positions. See [contract integration](docs/contracts.md) for the source pin and deployment addresses.

## Develop

Use Bun 1.4.0.

```sh
bun install --frozen-lockfile
bun run dev
```

Run `bun run lint`, `bun run check-ts`, `bun run test`, and `bun run build` to verify changes. Browser tests require Anvil with Osaka support on port 18545, then `bun run test:e2e`.

## Release

Set an unpublished version in `package.json`, commit the changes, and push a tag (conventionally `v<version>`). GitHub CI builds, tests, and publishes the verified package to npm through trusted publishing. Every successful build is pinned to IPFS; GitHub releases contain notes only.

See [publishing setup](docs/npm-publishing.md) and [distribution](docs/distribution.md) for operational details.

## License

[MIT](LICENSE). Use at your own risk, without warranty. Third-party code and contract artifacts retain their respective licenses; see [third-party notices](THIRD_PARTY_NOTICES.md).
