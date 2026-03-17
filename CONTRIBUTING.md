# Contributing

Thanks for contributing to ikman-api-client.

## Prerequisites

- Node.js 18+
- npm 9+

## Setup

```bash
npm install
```

If Puppeteer browser download is blocked in your environment:

```bash
PUPPETEER_SKIP_DOWNLOAD=1 npm install
```

## Development

Run checks before opening a PR:

```bash
npm run lint
npm test -- --runInBand
```

Run examples locally:

```bash
npm run example
npm run example:ad
npm run example:batch
```

## Pull Request Guidelines

- Keep changes focused and minimal.
- Add/update tests for behavior changes.
- Update `README.md` for API or option changes.
- Ensure lint and tests pass.

## Commit Messages

Use clear, imperative commit messages, for example:

- `feat: add new search filter option`
- `fix: handle missing ad location gracefully`
- `test: add coverage for price parser`
