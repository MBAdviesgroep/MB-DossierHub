export const metadata = {
  title: "Dossiergenerator | MB Adviesgroep & Credion MB",
  description: "Documentgeneratie voor rechtsvormwijzigingen en financieringen",
};

export default function RootLayout({ children }) {
  return (
    <html lang="nl">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif", background: "#f3f4f6", color: "#111827" }}>
        {children}
      </body>
    </html>
  );
}
