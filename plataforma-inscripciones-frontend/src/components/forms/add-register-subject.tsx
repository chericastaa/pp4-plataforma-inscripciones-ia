"use client";

import React from "react";
import { Button, Input, Label } from "@/src/components/ui";
import {
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/src/components/ui/dialog";
import { toast } from "sonner";
import { useAppStore } from "@/src/store";
import { crearInscripcion } from "@/src/actions";

export const InscriptionForm = ({
  onClose,
  refresh,
}: {
  onClose: () => void;
  refresh: () => Promise<void>;
}) => {
  const { materias, alumnoSeleccionado } = useAppStore();

  const [formData, setFormData] = React.useState({
    id_materia: materias?.[0]?.id || "",
  });

  const [loading, setLoading] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, id_materia: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!alumnoSeleccionado) {
      toast.error("No hay alumno seleccionado.");
      return;
    }

    try {
      const payload = {
        dni: alumnoSeleccionado.dni,
        id_materia: Number(formData.id_materia),
        fecha_inscripcion: new Date().toISOString(),
        estado: "inscripto",
      };

      const response = await crearInscripcion(payload);

      if (response.error) {
        toast.error("No se pudo registrar la inscripción", {
          description: response.error,
        });
      } else {
        toast.success("Inscripción creada con éxito");
        refresh();
        onClose();
        setFormData({ id_materia: "" });
      }
    } catch (error: any) {
      toast.error("Error inesperado", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DialogTitle>Registrar inscripción</DialogTitle>
      <form className="flex flex-col gap-5 pt-5" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2 w-full">
          <Label htmlFor="materia">Materia</Label>
          <select
            id="materia"
            name="id_materia"
            value={formData.id_materia}
            onChange={handleChange}
            className="border p-2 rounded-md"
          >
            <option value="">Seleccione una materia</option>
            {materias.map((m) => (
              <option key={m.id} value={m.id}>
                {m.descripcion}
              </option>
            ))}
          </select>
        </div>

        <DialogFooter className="pt-3 flex justify-end gap-3">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => {
                setFormData({ id_materia: "" });
                onClose();
              }}
            >
              Cancelar
            </Button>
          </DialogClose>

          <Button disabled={loading} type="submit" className="cursor-pointer">
            Registrar
          </Button>
        </DialogFooter>
      </form>
    </>
  );
};
