# docs

This is the Fumadocs source project for LingWeave documentation. It is
statically exported and mapped into the main web application under `/docs`.

Run development server:

```bash
bun run dev
```

Build static documentation:

```bash
bun run build
```

Then run `bun run sync:docs` in `web/` to map `docs/out` into the main app.

Run the published image with Docker Compose:

```bash
docker compose up -d
```

Or build locally with Docker Compose:

```bash
docker compose -f docker-compose.local.yml up -d --build
```

## Explore

In the project, you can see:

- `lib/source.ts`: Code for content source adapter, `loader()` provides the interface to access your content.
- `lib/layout.shared.tsx`: Shared options for layouts, optional but preferred to keep.

| Route                     | Description                                            |
| ------------------------- | ------------------------------------------------------ |
| `app/(home)`              | The route group for your landing page and other pages. |
| `app/docs`                | The documentation layout and pages.                    |
| `app/api/search/route.ts` | The Route Handler for search.                          |

### Fumadocs MDX

A `source.config.ts` config file has been included, you can customise different
options like frontmatter schema.

Read the [Introduction](https://fumadocs.dev/docs/mdx) for further details.
