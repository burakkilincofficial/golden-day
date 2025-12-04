import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "GoldDay Manager",
  description: "Altın günü gruplarınızı yönetin, kura sıralarını ve ödemeleri takip edin."
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="tr" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
          <header className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                GoldDay Manager
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Altın günü gruplarınızı dijital olarak yönetin.
              </p>
            </div>
          </header>
          <main className="flex-1 pb-6">{children}</main>
          <footer className="mt-auto border-t border-border pt-4 text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} GoldDay Manager
          </footer>
        </div>
      </body>
    </html>
  );
}


