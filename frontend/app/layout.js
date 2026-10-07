import "./globals.css";

export const metadata = {
  title: "Live Task Board",
  description: "Next.js frontend with a Node.js backend - CRUD operations and real-time updates",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
