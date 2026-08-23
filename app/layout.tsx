import "./globals.css";

export const metadata = {
  title: "Wedding Quiz",
  description: "Wedding Quiz",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}