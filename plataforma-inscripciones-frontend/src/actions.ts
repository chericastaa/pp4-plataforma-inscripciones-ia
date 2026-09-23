"use server";

import axios from "axios";
import { cookies } from "next/headers";

const USERS_API = process.env.NEXT_PUBLIC_USERS_API!;
const ACADEMIC_API = process.env.NEXT_PUBLIC_ACADEMIC_API!;

async function axiosWithAuth(
  url: string,
  method: "get" | "post" | "put" | "delete",
  body?: any
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  return axios({
    url,
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    data: body,
  });
}

/* =========================
   🔐 AUTH (USERS SERVICE)
========================= */

export async function register(body: {
  dni: string;
  email: string;
  password: string;
  confirmPassword: string;
  rol: string;
}) {
  try {
    const { data } = await axiosWithAuth(
      `${USERS_API}/auth/register`,
      "post",
      body
    );

    return data;
  } catch (error: any) {
    return {
      error: error.response?.data?.message || "Error al registrar al usuario",
    };
  }
}

export async function loginAction(formData: {
  email: string;
  password: string;
}) {
  try {
    const { data } = await axiosWithAuth(
      `${USERS_API}/auth/login`,
      "post",
      formData
    );

    if (data.token) {
      const cookieStore = await cookies();
      cookieStore.set("token", data.token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
      });
    }

    return {
      user: {
        email: data.user.email,
        dni: data.user.dni,
        rol: data.user.rol,
      },
    };
  } catch (error: any) {
    return {
      error: error.response?.data?.error || "Error al iniciar sesión",
    };
  }
}

export async function logoutServer() {
  const cookieStore = await cookies();
  cookieStore.delete("token");

  return { ok: true };
}

/* =========================
   📚 MATERIAS
========================= */

export async function obtenerMaterias() {
  try {
    const { data } = await axiosWithAuth(
      `${ACADEMIC_API}/materias`,
      "get"
    );

    return data;
  } catch (error: any) {
    return {
      error: error.response?.data?.message || "Error al obtener materias",
    };
  }
}

export async function crearMateria(body: {
  id_profesor: number;
  descripcion: string;
}) {
  try {
    const { data } = await axiosWithAuth(
      `${ACADEMIC_API}/materias`,
      "post",
      body
    );

    return data;
  } catch (error: any) {
    return {
      error: error.response?.data?.message || "Error al crear materia",
    };
  }
}

export async function editarMateria({
  id,
  body,
}: {
  id: number;
  body: { id_profesor: number; descripcion: string };
}) {
  try {
    const { data } = await axiosWithAuth(
      `${ACADEMIC_API}/materias/${id}`,
      "put",
      body
    );

    return data;
  } catch (error: any) {
    return {
      error: error.response?.data?.message || "Error al editar materia",
    };
  }
}

export async function eliminarMateria(id: number) {
  try {
    const { data } = await axiosWithAuth(
      `${ACADEMIC_API}/materias/${id}`,
      "delete"
    );

    return data;
  } catch (error: any) {
    return {
      error: error.response?.data?.message || "Error al eliminar materia",
    };
  }
}

/* =========================
   👨‍🎓 ALUMNOS
========================= */

export async function obtenerAlumnos() {
  try {
    const {
      data: { alumnos },
    } = await axiosWithAuth(`${ACADEMIC_API}/alumno`, "get");

    return alumnos;
  } catch (error: any) {
    return {
      error: error.response?.data?.message || "Error al obtener alumnos",
    };
  }
}

export async function editeEmail(body: { dni: string; email: string }) {
  try {
    const { data } = await axiosWithAuth(
      `${ACADEMIC_API}/alumno/${body.dni}`,
      "put",
      body
    );

    return data;
  } catch (error: any) {
    return {
      error: error.response?.data?.message || "Error al editar el email",
    };
  }
}

/* =========================
   📝 INSCRIPCIONES
========================= */

export async function obtenerInscripcionAlumno(dni: string) {
  try {
    const DNI = Number(dni);

    const {
      data: { inscripciones },
    } = await axiosWithAuth(
      `${ACADEMIC_API}/inscripciones/alumno/${DNI}`,
      "get"
    );

    return inscripciones;
  } catch (error: any) {
    return {
      error: error.response?.data?.message || "Error al obtener inscripciones",
    };
  }
}

export async function crearInscripcion(body: {
  dni: string;
  id_materia: number;
  estado: string;
  fecha_inscripcion: string;
}) {
  try {
    const { data } = await axiosWithAuth(
      `${ACADEMIC_API}/inscripciones`,
      "post",
      body
    );

    return data;
  } catch (error: any) {
    return {
      error: error.response?.data?.message || "Error al crear inscripcion",
    };
  }
}

export async function editartEstadoInscripcion(body: {
  id_inscripcion: number;
  estado: string;
}) {
  try {
    const { data } = await axiosWithAuth(
      `${ACADEMIC_API}/inscripciones/aprobar`,
      "post",
      body
    );

    return data;
  } catch (error: any) {
    return {
      error: error.response?.data?.message || "Error al actualizar estado",
    };
  }
}

export async function eliminarInscripcion(id_inscripcion: number) {
  try {
    const { data } = await axiosWithAuth(
      `${ACADEMIC_API}/inscripciones/${id_inscripcion}`,
      "delete"
    );

    return data;
  } catch (error: any) {
    return {
      error: error.response?.data?.message || "Error al eliminar inscripción",
    };
  }
}