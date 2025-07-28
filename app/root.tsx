import { Link, Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData, useRouteError, useRouteLoaderData } from "@remix-run/react"
import "./index.css"
import { Toaster } from "~/components/ui/toaster"
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node"
import type { ReactNode } from "react"
import { Button } from "~/components/ui/button"
import clsx from "clsx"
import { PreventFlashOnWrongTheme, type Theme, ThemeProvider, useTheme } from "remix-themes"
import { themeSessionResolver } from "~/sessions.server"

export const links: LinksFunction = () => {
  return [
    {
      rel: "icon",
      href: "/favicon.png",
      type: "image/png",
      sizes: "any",
    },
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { getTheme } = await themeSessionResolver(request)
  return {
    theme: getTheme(),
  }
}

export function EntryLayout({ children, ssrTheme }: { children: ReactNode; ssrTheme?: Theme | null }) {
  const [theme] = useTheme()
  return (
    <html lang="en" className={clsx(theme)}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script defer data-domain="configurator.yor.ovh" src="https://a.shd.llc/js/script.js" />
        <Meta />
        <PreventFlashOnWrongTheme ssrTheme={Boolean(ssrTheme)} />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
        <Toaster />
      </body>
    </html>
  )
}

export function Layout({ children }: { children: ReactNode }) {
  const data = useRouteLoaderData<typeof loader>("root")

  return data ? (
    <ThemeProvider specifiedTheme={data.theme} themeAction="/api/set-theme">
      <EntryLayout ssrTheme={data.theme}>{children}</EntryLayout>
    </ThemeProvider>
  ) : (
    <EntryLayout>{children}</EntryLayout>
  )
}

export default function App() {
  return <Outlet />
}

export function ErrorBoundary() {
  const error = useRouteError() as { status?: number; data: string }

  return error.status ? (
    <main className="fixed left-1/2 top-1/2 w-full max-w-[360px] -translate-x-1/2 -translate-y-1/2 p-6">
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-[2.5rem]">{error.status}</h1>
        <p className="mb-6 text-muted-foreground text-center">{error.data}</p>
        <Button asChild>
          <Link to="/">Go back</Link>
        </Button>
      </div>
    </main>
  ) : (
    <main className="fixed left-1/2 top-1/2 w-full max-w-[360px] -translate-x-1/2 -translate-y-1/2 p-6">
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-[2.5rem]">500</h1>
        <p className="mb-6 text-muted-foreground text-center">Ошибка на стороне сервера. Попробуйте позже</p>
        <Button asChild>
          <Link to="/">Go back</Link>
        </Button>
      </div>
    </main>
  )
}
