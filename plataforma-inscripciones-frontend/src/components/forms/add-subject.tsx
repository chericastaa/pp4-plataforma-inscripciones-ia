"use client";

import React from "react";
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui";
import { toast } from "sonner";
import { crearMateria, editarMateria } from "@/src/actions";
import { DialogClose, DialogFooter, DialogTitle } from "../ui/dialog";
import { useAppStore } from "@/src/store";

export const AddSubjectForm = ({
  onClose,
  refresh,
  item,
  setItem,
}: {
  onClose: () => void;
  refresh: () => Promise<void>;
  item: {
    id: number;
    descripcion: string;
    id_profesor: number;
  } | null;
  setItem: (
    item: {
      id: number;
      descripcion: string;
      id_profesor: number;
    } | null
  ) => void;
}) => {
  const { profesionales } = useAppStore();
  const [loading, setLoading] = React.useState<boolean>(false);
  const [data, setData] = React.useState<{
    descripcion: string;
    id_profesor: number;
  }>({
    descripcion: item?.descripcion || "",
    id_profesor: item?.id_profesor || profesionales?.[0]?.id_profesor,
  });

  const handleChange = (e: any) => {
    const { name, value } = e.target;

    setData({
      ...data,
      [name]: value,
    });
  };

  React.useEffect(() => {
    if (item) {
      setData({ descripcion: item.descripcion, id_profesor: item.id_profesor });
    } else if (profesionales?.length > 0) {
      setData((prev) => ({
        ...prev,
        id_profesor: profesionales?.[0]?.id_profesor,
      }));
    }
  }, [item, profesionales]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const NEW_OBJECTS = {
        ...data,
        id_profesor: Number(data.id_profesor),
      };

      const response = item?.id
        ? await editarMateria({ body: NEW_OBJECTS, id: item?.id })
        : await crearMateria(NEW_OBJECTS);

      if ("error" in response) {
        return toast.warning("Ups! parece que ocurrio un error", {
          description: response.error,
        });
      } else {
        setData({
          descripcion: "",
          id_profesor: 0,
        });
        setItem(null);
        refresh();
        toast.success("Materia creada con exito", {
          description: "Vera los cambios reflejados en la vista",
        });
        onClose();
      }
    } catch (error: any) {
      return toast.warning("Ups! parece que ocurio un error", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DialogTitle>Nueva materia</DialogTitle>
      <form className="flex flex-col gap-5 pt-5" onSubmit={onSubmit}>
        <div className="flex flex-col gap-2">
          <Label>Nombre de materia</Label>
          <Input
            name="descripcion"
            value={data?.descripcion}
            onChange={handleChange}
            placeholder="Ingrese la materia"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Seleccionar profesor</Label>
          <Select
            value={String(data?.id_profesor)}
            onValueChange={(value) =>
              setData({ ...data, id_profesor: Number(value) })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccionar profesor" />
            </SelectTrigger>
            <SelectContent>
              {profesionales?.map(
                (
                  p: {
                    id_profesor: number;
                    dni: string;
                    nombre: string;
                    apellido: string;
                  },
                  index: number
                ) => (
                  <SelectItem key={index} value={String(p.id_profesor)}>
                    {p.nombre}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter className="pt-3 flex justify-end gap-3">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="cursor-pointer">
              Cancelar
            </Button>
          </DialogClose>
          <Button disabled={loading} type="submit" className="cursor-pointer">
            Guardar
          </Button>
        </DialogFooter>
      </form>
    </>
  );
};
