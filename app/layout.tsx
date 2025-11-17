import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/ui/theme-provider';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'QuantumCV - AI-Powered Resume & Cover Letter Generator',
  description: 'Create professional resumes and cover letters with AI assistance',
  keywords: ['resume', 'cv', 'cover letter', 'ai', 'generator', 'job application'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
