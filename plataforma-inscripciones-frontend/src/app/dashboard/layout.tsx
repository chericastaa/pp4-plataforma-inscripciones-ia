import { Header } from "@/src/components";
import { AsistenteIA } from "@/src/components/asistente-ia";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header>{children}</Header>
      <AsistenteIA />
    </>
  );
}
