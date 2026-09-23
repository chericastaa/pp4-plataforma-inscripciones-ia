import { Header } from "@/src/components";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <Header>{children}</Header>;
}
