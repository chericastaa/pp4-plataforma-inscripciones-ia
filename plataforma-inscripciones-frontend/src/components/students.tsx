"use client";

import React from "react";
import { LuPenLine, LuCircleUserRound } from "react-icons/lu";
import { toast } from "sonner";
import { Button, Card, CardContent, CardHeader, CardTitle } from "./ui";
import { obtenerAlumnos } from "../actions";
import { Dialog, DialogTrigger, DialogContent } from "./ui/dialog";
import { Skeleton } from "./ui/skeleton";
import { StudentForm } from "./forms/add-student";
import { useAppStore } from "../store";

export const StudentsView = () => {
  const { alumnos, setAlumnos, setAlumnoSeleccionado } = useAppStore();
  const [mode, setMode] = React.useState<"create" | "edit">("create");
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState<boolean>(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const response = await obtenerAlumnos();
      if ("error" in response) {
        toast.error("Ups! parece que ocurrio un error", {
          description: response.error,
        });
      } else {
        setAlumnos(response);
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
    refresh();
  }, []);

  return (
    <Card>
      <CardHeader className="justify-between flex! flex-row!">
        <CardTitle className="text-xl">Listado de alumnos</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setAlumnoSeleccionado(null);
                setMode("create");
              }}
            >
              Agregar alumno
            </Button>
          </DialogTrigger>
          <DialogContent>
            <StudentForm
              refresh={refresh}
              mode={mode}
              onClose={() => setOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 overflow-auto h-[calc(100vh-280px)]">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="p-5 border border-slate-200 rounded-lg flex gap-2 items-center"
              >
                <Skeleton className="size-10 rounded-full" />
                <div className="w-full flex flex-col gap-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="size-8 rounded-md" />
                <Skeleton className="size-8 rounded-md" />
              </div>
            ))
          : alumnos?.map(
              (
                m: {
                  uid: string;
                  dni: string;
                  email: string;
                  password_hash: string;
                  rol: string;
                },
                index: number
              ) => (
                <div
                  key={index}
                  className="p-5 border border-slate-200 rounded-lg flex gap-2 items-center"
                >
                  <LuCircleUserRound className="size-10" />
                  <div className="w-full flex flex-col">
                    <span className="font-bold text-xl">{m.dni}</span>
                    <span className="text-base text-semibold">{m.email}</span>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setAlumnoSeleccionado(m);
                      setOpen(true);
                      setMode("edit");
                    }}
                  >
                    <LuPenLine className="size-6" />
                  </Button>
                </div>
              )
            )}
      </CardContent>
    </Card>
  );
};
