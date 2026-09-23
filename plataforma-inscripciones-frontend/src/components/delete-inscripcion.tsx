"use client";

import React from "react";
import { Button } from "@/src/components/ui";
import { DialogTitle, DialogFooter, DialogClose } from "@/src/components/ui/dialog";
import { toast } from "sonner";
import { eliminarInscripcion } from "@/src/actions";

interface DeleteInscriptionProps {
  inscripcion: any; 
  onClose: () => void;
  refresh: () => Promise<void>;
}

export const DeleteInscriptionModal = ({
  inscripcion,
  onClose,
  refresh,
}: DeleteInscriptionProps) => {
  const [loading, setLoading] = React.useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await eliminarInscripcion(inscripcion.id_inscripcion);

      if ("error" in response) {
        toast.error("No se pudo eliminar", {
          description: response.error,
        });
      } else {
        toast.success("Inscripción eliminada con éxito");
        await refresh();
        onClose();
      }
    } catch (err: any) {
      toast.error("Ups! ocurrió un error", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DialogTitle>Eliminar inscripción</DialogTitle>

      <p className="text-sm text-gray-700 py-3">
        ¿Estás seguro que deseas eliminar esta inscripción? <br />
        Esta acción no se puede deshacer.
      </p>

      <DialogFooter className="pt-4 flex justify-end gap-3">
        <DialogClose asChild>
          <Button variant="outline" className="cursor-pointer">
            Cancelar
          </Button>
        </DialogClose>

        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={loading}
          className="cursor-pointer"
        >
          Eliminar
        </Button>
      </DialogFooter>
    </>
  );
};