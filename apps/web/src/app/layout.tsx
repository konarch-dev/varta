import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '../components/providers/QueryProvider';

export const metadata: Metadata = {
  title: 'VARTA — Baat Sabki',
  description: 'A modern, high-speed microblogging & social networking platform built for Indian creators, professionals, and communities.',
  keywords: ['Varta', 'Baat Sabki', 'Social Network', 'India Microblogging', 'Discourse', 'Communities'],
  authors: [{ name: 'VARTA' }],
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Initialize theme immediately to prevent flashing and hydration mismatch
                try {
                  var savedTheme = localStorage.getItem('varta_theme') || 'light';
                  if (savedTheme === 'dark') {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  } else {
                    document.documentElement.classList.add('light');
                    document.documentElement.classList.remove('dark');
                  }
                } catch(e) {}

                // Suppress third-party browser extension errors (e.g. Urban VPN, adblockers, etc.)
                // so they do not trigger the Next.js development error overlay modal.
                window.addEventListener('error', function(event) {
                  var file = event.filename || '';

                  var stack = (event.error && event.error.stack) || '';
                  if (
                    file.indexOf('chrome-extension://') !== -1 ||
                    file.indexOf('moz-extension://') !== -1 ||
                    file.indexOf('safari-extension://') !== -1 ||
                    stack.indexOf('chrome-extension://') !== -1
                  ) {
                    event.stopImmediatePropagation();
                    event.preventDefault();
                    return true;
                  }
                }, true);

                window.addEventListener('unhandledrejection', function(event) {
                  var source = (event.reason && (event.reason.stack || event.reason.message)) || '';
                  if (
                    typeof source === 'string' &&
                    (source.indexOf('chrome-extension://') !== -1 ||
                     source.indexOf('moz-extension://') !== -1)
                  ) {
                    event.stopImmediatePropagation();
                    event.preventDefault();
                  }
                }, true);

                try {
                  var observer = new MutationObserver(function(mutations) {
                    for (var i = 0; i < mutations.length; i++) {
                      var m = mutations[i];
                      if (m.type === 'attributes' && m.attributeName && m.attributeName.indexOf('bis_') === 0) {
                        m.target.removeAttribute(m.attributeName);
                      }
                    }
                  });
                  observer.observe(document.documentElement, {
                    attributes: true,
                    subtree: true,
                    attributeFilter: ['bis_skin_checked', 'bis_register']
                  });
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className="min-h-screen bg-[#090B10] text-[#F8FAFC] antialiased selection:bg-blue-600 selection:text-white"
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
