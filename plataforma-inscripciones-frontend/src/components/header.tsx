"use client";
import { useRouter } from "next/navigation";
import { logoutServer } from "../actions";
import { useAppStore } from "../store";
import styles from "./header.module.css";

export const Header = ({ children }: { children: React.ReactNode }) => {
  const { clearStore, user } = useAppStore();
  const router = useRouter();

  const logOut = async () => {
    clearStore();
    await logoutServer();
    router.push("/");
  };

  const menuPorRol: Record<string, { label: string; href: string }[]> = {
  admin: [
    { label: "Panel principal", href: "/dashboard" },
    { label: "Usuarios", href: "/dashboard/usuarios" },
    { label: "Materias", href: "/dashboard/materias" },
    { label: "Inscripciones", href: "/dashboard/inscripciones" },
  ],
  profesor: [],
  alumno: [],
};

  const topBarPorRol: Record<string, string> = {
    admin: "Panel de administración",
    profesor: "Panel del profesor",
    alumno: "Mi aula virtual",
  };

  const menuItems = menuPorRol[user?.rol ?? "alumno"] ?? [];
  const topLabel = topBarPorRol[user?.rol ?? "alumno"] ?? "Panel de control";

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={styles.logoSection}>
          <div className={styles.logoRow}>
            <div className={styles.logoIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" /></svg>
            </div>
            <div>
              <div className={styles.logoTitle}>Plataforma</div>
              <div className={styles.logoSubtitle}>Inscripciones</div>
            </div>
          </div>
        </div>
        <div className={styles.menuContainer}>
          <div className={styles.menuLabel}>Menú</div>
          {menuItems.map((item) => (
            <div key={item.label} onClick={() => router.push(item.href)} className={styles.menuItem}>
              <div className={styles.menuBullet}></div>
              {item.label}
            </div>
          ))}
        </div>
        <div className={styles.sidebarFooter}>
          <button onClick={logOut} className={styles.logoutBtn}>
            Cerrar sesión
          </button>
        </div>
      </div>
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
