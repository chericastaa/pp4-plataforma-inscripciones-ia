"use client";

import React from "react";
import { Button, Label, Input } from "@/src/components/ui";
import {
  DialogFooter,
  DialogClose,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { toast } from "sonner";
import { editartEstadoInscripcion } from "../actions";

interface EditInscriptionFormProps {
  inscripcion: any; 
  onClose: () => void;
  refresh: () => Promise<void>;
}

export const EditInscriptionForm = ({
  inscripcion,
  onClose,
  refresh,
}: EditInscriptionFormProps) => {
  const [estado, setEstado] = React.useState(inscripcion?.estado || "");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await editartEstadoInscripcion({
        id_inscripcion: inscripcion.id_inscripcion,
        estado,
      });

      if ("error" in response) {
        toast.error("No se pudo actualizar la inscripción", {
          description: response.error,
        });
      } else {
        toast.success("Inscripción actualizada con éxito");
        await refresh();
        onClose();
      }
    } catch (error: any) {
      toast.error("Ups! ocurrió un error", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DialogTitle>Editar inscripción</DialogTitle>

      <form className="flex flex-col gap-5 pt-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1">
          <Label htmlFor="estado">Estado</Label>
          <select
            id="estado"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="border p-2 rounded-md"
          >
            <option value="aprobada">APROBADA</option>
            <option value="activa">ACTIVA</option>
            <option value="pendiente">PENDIENTE</option>
          </select>
        </div>

        <DialogFooter className="pt-3">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="cursor-pointer">
              Cancelar
            </Button>
          </DialogClose>

          <Button type="submit" disabled={loading}>
            Guardar cambios
          </Button>
        </DialogFooter>
      </form>
    </>
  );
};
