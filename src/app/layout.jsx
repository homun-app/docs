import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'
import './globals.css'

export const metadata = {
  title: {
    default: 'Homun Docs',
    template: '%s — Homun',
  },
  description:
    'Documentation for Homun — your personal AI assistant. Single binary, local-first, privacy-focused, skill-powered.',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'Homun Docs',
    description: 'Documentation for Homun — your personal AI assistant.',
    siteName: 'Homun Docs',
    url: 'https://docs.homun.app',
  },
}

const navbar = (
  <Navbar
    logo={
      <>
        <img src="/homun.png" alt="Homun" className="logo-light" />
        <img src="/homun_white.png" alt="Homun" className="logo-dark" />
      </>
    }
    projectLink="https://github.com/homun-app/homun"
  />
)

const footer = (
  <Footer>
    <span>
      MIT {new Date().getFullYear()} © Homun — Your personal AI assistant.
    </span>
  </Footer>
)

export default async function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head />
      <body>
        <Layout
          navbar={navbar}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/homun-app/docs/tree/main/src/content"
          footer={footer}
          sidebar={{ defaultMenuCollapseLevel: 1 }}
          editLink="Edit this page on GitHub"
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}
