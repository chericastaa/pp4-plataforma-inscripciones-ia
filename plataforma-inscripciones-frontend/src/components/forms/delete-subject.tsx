"use client";

import { toast } from "sonner";
import {
  DialogContent,
  DialogTitle,
  Dialog,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui";
import { eliminarMateria } from "@/src/actions";

export const DeleteSubject = ({
  item,
  setOpenDelete,
  refresh,
  setItem,
  openDelete,
}: {
  item: {
    id: number;
    descripcion: string;
    id_profesor: number;
  } | null;
  setOpenDelete: (value: boolean) => void;
  refresh: () => Promise<void>;
  setItem: (
    item: {
      id: number;
      descripcion: string;
      id_profesor: number;
    } | null
  ) => void;
  openDelete: boolean;
}) => { 
  const handleConfirmDelete = async () => {
    try {
     
      const response = await eliminarMateria(item?.id!);
      
      if ("error" in response) {
        toast.error("No se pudo eliminar", { description: response?.error });
        return;
      }
      toast.success("Materia eliminada");
      setOpenDelete(false);
      setItem(null);
      refresh();
    } catch (err: any) {
      toast.error("Error eliminando materia", {
        description: err.message,
      });
    }
  };

  return (
    <Dialog open={openDelete} onOpenChange={setOpenDelete}>
      <DialogContent>
        <DialogTitle>Eliminar materia</DialogTitle>
        <DialogDescription>
          ¿Seguro que deseas eliminar esta materia?
        </DialogDescription>
        <div className="flex justify-end gap-3 mt-5">
          <Button variant="outline" onClick={() => setOpenDelete(false)}>
            Cancelar
          </Button>

          <Button variant="destructive" onClick={handleConfirmDelete}>
            Eliminar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
