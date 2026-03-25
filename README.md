This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Database Schemas By Environment

This app selects a Postgres schema automatically from the deployment environment:

- `VERCEL_ENV=production` uses the `production` schema
- `VERCEL_ENV=preview` uses the `preview` schema
- local development or `VERCEL_ENV=development` uses the `development` schema

If you want different schema names, set `POSTGRES_SCHEMA_PRODUCTION`, `POSTGRES_SCHEMA_PREVIEW`, and `POSTGRES_SCHEMA_DEVELOPMENT`. `POSTGRES_SCHEMA` can also be used as a global override for every environment.

## Database Deployment Workflow

Local development should create migrations with `npx prisma migrate dev`, but production-style schema changes should be applied by Vercel during deployment, not from a developer machine.

This repo uses a dedicated Vercel build command:

- local `npm run build` runs `prisma generate && next build`
- Vercel runs `npm run vercel-build`
- `npm run vercel-build` runs `prisma generate && prisma migrate deploy && next build`

That means any committed migration in `prisma/migrations` will be applied automatically during Vercel deployments, using the schema selected from `VERCEL_ENV`.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
