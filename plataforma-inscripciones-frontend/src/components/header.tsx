"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logoutServer } from "../actions";
import { useAppStore } from "../store";
import styles from "./header.module.css";

const menuPorRol: Record<string, { label: string; href: string }[]> = {
  admin: [
    { label: "Panel principal", href: "/dashboard" },
    { label: "Usuarios", href: "/dashboard/usuarios" },
    { label: "Materias", href: "/dashboard/materias" },
    { label: "Inscripciones", href: "/dashboard/inscripciones" },
  ],
  profesor: [{ label: "Mis materias", href: "/dashboard" }],
  alumno: [
    { label: "Inicio", href: "/dashboard" },
    { label: "Plan de estudios", href: "/dashboard/plan" },
  ],
};

const topBarPorRol: Record<string, string> = {
  admin: "Panel de administración",
  profesor: "Panel del profesor",
  alumno: "Mi aula virtual",
};

export const Header = ({ children }: { children: React.ReactNode }) => {
  const { clearStore, user } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();

  const logOut = async () => {
    clearStore();
    await logoutServer();
    router.push("/");
  };

  const rol = user?.rol ?? "alumno";
  const menuItems = menuPorRol[rol] ?? [];
  const topLabel = topBarPorRol[rol] ?? "Panel de control";

  const activo = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.logoSection}>
          <div className={styles.logoMark} aria-hidden="true">16</div>
          <div>
            <div className={styles.logoTitle}>IFTS 16</div>
            <div className={styles.logoSubtitle}>Inscripciones</div>
          </div>
        </div>
        <nav className={styles.menuContainer} aria-label="Principal">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`${styles.menuItem} ${activo(item.href) ? styles.menuItemActivo : ""}`}
              aria-current={activo(item.href) ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className={styles.sidebarFooter}>
          <button onClick={logOut} className={styles.logoutBtn}>
            Cerrar sesión
          </button>
        </div>
      </aside>
      <div className={styles.mainColumn}>
        <div className={styles.topBar}>
          <div className={styles.topLabel}>{topLabel}</div>
          <div className={styles.topUser}>
            <div className={styles.userAvatar}>{user?.nombre ? user.nombre.charAt(0).toUpperCase() : "U"}</div>
            <div>
              <div className={styles.userName}>{user?.nombre || "Usuario"}</div>
              <div className={styles.userRole}>{user?.rol || "alumno"}</div>
            </div>
          </div>
        </div>
        <div className={styles.contentArea}>{children}</div>
      </div>
    </div>
  );
};
