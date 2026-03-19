# Homun Docs

Documentation site for [Homun](https://github.com/homunbot/homunbot) — built with [Nextra](https://nextra.site).

Live at **https://docs.homun.app**

## Development

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Build

```bash
npm run build
```

Static output in `out/`.

## Deploy on Coolify

1. **Create new resource** in Coolify: Application > GitHub > select this repo
2. **Build Pack**: Dockerfile
3. **Port**: 80
4. **Domain**: `docs.homun.app`
5. Coolify handles HTTPS via Let's Encrypt automatically

### DNS Setup

Add an A record for `docs.homun.app` pointing to your Coolify server IP:

```
docs.homun.app  →  A  →  <your-coolify-server-ip>
```

## Adding Content

- Pages live in `src/content/` as `.md` or `.mdx` files
- Sidebar order is controlled by `_meta.js` files in each directory
- Run `npm run dev` to preview locally
