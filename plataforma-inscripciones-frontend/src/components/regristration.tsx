"use client";

import React from "react";
import { obtenerInscripcionAlumno } from "../actions";
import { toast } from "sonner";
import { Button, Card, CardContent, CardHeader, CardTitle } from "./ui";
import { Dialog, DialogTrigger, DialogContent } from "./ui/dialog";
import { LuNotebook, LuPenLine, LuTrash2 } from "react-icons/lu";
import { useAppStore } from "../store";
import { InscriptionForm } from "./forms/add-register-subject";
import { EditInscriptionForm } from "./edit-incription";
import { DeleteInscriptionModal } from "./delete-inscripcion";

export const Registration = () => {
  const { alumnos, alumnoSeleccionado, setAlumnoSeleccionado, materias } =
    useAppStore();
  const [inscripcionSeleccionada, setInscripcionSeleccionada] =
    React.useState(null);
  const [openDelete, setOpenDelete] = React.useState(false);
  const [openEdit, setOpenEdit] = React.useState(false);
  const [subjects, setSubjects] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState<boolean>(false);
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  React.useEffect(() => {
    if (alumnos.length === 0) return;

    if (alumnoSeleccionado) return;

    setAlumnoSeleccionado(alumnos[0]);
  }, [alumnos]);

  const refresh = async () => {
    if (!alumnoSeleccionado) return;
    setLoading(true);
    try {
      const response = await obtenerInscripcionAlumno(alumnoSeleccionado.dni);

      if ("error" in response) {
        toast.error("Ups! ocurrió un error", {
          description: response.error,
        });
        setSubjects([]);
      } else {
        setSubjects(response);
      }
    } catch (error: any) {
      toast.error("Error al cargar datos", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!alumnoSeleccionado) return;

    refresh();
  }, [alumnoSeleccionado]);

  return (
    <Card>
      <CardHeader className="flex! flex-row! justify-between items-center!">
        <select
          value={alumnoSeleccionado?.dni ?? ""}
          onChange={(e) => {
            const DNI = Number(e.target.value);
            const alumno = alumnos.find((a: any) => a.dni === DNI);
            setAlumnoSeleccionado(alumno || null);
          }}
          className="border p-2 rounded-md"
        >
          {alumnos?.map((s) => (
            <option key={s.uid} value={s.dni}>
              {s.dni}
            </option>
          ))}
        </select>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setOpen(true);
              }}
            >
              Agregar inscripción
            </Button>
          </DialogTrigger>
          <DialogContent>
            <InscriptionForm onClose={() => setOpen(false)} refresh={refresh} />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 overflow-auto h-[calc(100vh-285px)]">
        <CardTitle className="text-2xl">Listado de materias</CardTitle>
        {loading && <p>Cargando materias...</p>}

        {!loading && !alumnoSeleccionado && (
          <p className="text-gray-500">Seleccione un estudiante.</p>
        )}

        {!loading && alumnoSeleccionado && subjects.length === 0 && (
          <p className="text-red-500">Este alumno no tiene inscripciones.</p>
        )}

        {!loading &&
          subjects.length > 0 &&
          subjects?.map((subj) => {
            const find_materias = materias.find(
              (m) => m.id === subj?.materias?.id
            );
           
            return (
              <div
                key={subj.id_inscripcion}
                className="p-5 border border-slate-200 rounded-lg flex gap-2 items-center"
              >
                <LuNotebook className="size-10" />
                <div className="w-full flex flex-col">
                  <span className="font-bold text-xl">
                    {find_materias?.descripcion?.toUpperCase()}
                  </span>
                  <div className="flex gap-1 items-center">
                    <span className="text-base">
                      {formatDate(subj?.fecha_inscripcion)}
                    </span>
                    -
                    <span
                      className={`
    text-base font-bold
    ${
      subj?.estado?.toUpperCase() === "APROBADA"
        ? "text-green-600"
        : subj?.estado?.toUpperCase() === "ACTIVA"
        ? "text-amber-500"
        : "text-gray-600"
    }
  `}
                    >
                      {subj?.estado?.toUpperCase()}
                    </span>
                  </div>
                </div>
                <Dialog open={openEdit} onOpenChange={setOpenEdit}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setInscripcionSeleccionada(subj);
                        setOpenEdit(true);
                      }}
                    >
                      <LuPenLine className="size-6" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <EditInscriptionForm
                      inscripcion={inscripcionSeleccionada}
                      onClose={() => setOpenEdit(false)}
                      refresh={refresh}
                    />
                  </DialogContent>
                </Dialog>
                <Dialog open={openDelete} onOpenChange={setOpenDelete}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setInscripcionSeleccionada(subj);
                        setOpenDelete(true);
                      }}
                    >
                      <LuTrash2 className="size-6 text-red-500" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DeleteInscriptionModal
                      inscripcion={inscripcionSeleccionada}
                      refresh={refresh}
                      onClose={() => setOpenDelete(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            );
          })}
      </CardContent>
    </Card>
  );
};
