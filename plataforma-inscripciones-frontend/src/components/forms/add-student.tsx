"use client";

import React from "react";
import { toast } from "sonner";
import { Button, Input, Label, CardFooter } from "@/src/components/ui";
import {
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/src/components/ui/dialog";
import { validateRegisterForm } from "./validation";
import { editeEmail, register } from "@/src/actions";
import { useAppStore } from "@/src/store";

interface UserModalFormProps {
  mode: "create" | "edit";
  onClose: () => void;
  refresh: () => Promise<void>;
}

export const StudentForm: React.FC<UserModalFormProps> = ({
  mode = "create",
  onClose,
  refresh,
}) => {
  const { alumnoSeleccionado } = useAppStore();
  const [formData, setFormData] = React.useState({
    uid: alumnoSeleccionado?.uid || "",
    dni: alumnoSeleccionado?.dni || "",
    email: alumnoSeleccionado?.email || "",
    password: alumnoSeleccionado?.password_hash || "",
    confirmPassword: alumnoSeleccionado?.password_hash || "",
    rol: "alumno",
  });
  const [errors, setErrors] = React.useState<{ [key: string]: string }>({});
  const [loading, setLoading] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedData = { ...formData, [name]: value };
    setFormData(updatedData);

    const newErrors = validateRegisterForm(updatedData);
    setErrors((prev) => ({
      ...prev,
      [name]: newErrors[name] || "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const validationErrors = validateRegisterForm(formData);

    try {
      if (mode === "create") {
        if (Object.keys(validationErrors)?.length > 0) {
          setErrors(validationErrors);
          setLoading(false);
          return;
        }
        const response = await register(formData);
        if ("error" in response) {
          toast.warning("Ups! parece que ocurrió un error", {
            description: response.error,
          });
        } else {
          toast.success("¡Usuario registrado con éxito!");
          setFormData({
            uid: "",
            dni: "",
            email: "",
            password: "",
            confirmPassword: "",
            rol: "alumno",
          });

          onClose();
          refresh();
        }
      } else {
        const response = await editeEmail({
          dni: formData.dni,
          email: formData.email,
        });
        if ("error" in response) {
          toast.warning("Ups! ocurrió un error al actualizar", {
            description: response.error,
          });
        } else {
          toast.success("¡Usuario actualizado con éxito!");
          if (refresh) await refresh();
          onClose();
        }
      }
    } catch (error: any) {
      toast.error("¡Ups! hubo un error", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (alumnoSeleccionado) {
      setFormData({
        uid: alumnoSeleccionado?.uid,
        dni: String(alumnoSeleccionado?.dni),
        email: alumnoSeleccionado?.email,
        password: alumnoSeleccionado?.password_hash,
        confirmPassword: alumnoSeleccionado?.password_hash,
        rol: alumnoSeleccionado?.rol,
      });
    }
  }, [alumnoSeleccionado]);

  return (
    <>
      <DialogTitle>
        {mode === "create" ? "Agregar alumno" : "Editar alumno"}
      </DialogTitle>
      <form className="flex flex-col gap-5 pt-5" onSubmit={handleSubmit}>
        {mode === "create" && (
          <div className="flex flex-col gap-2 w-full">
            <Label htmlFor="dni">DNI</Label>
            <Input
              id="dni"
              name="dni"
              value={formData.dni}
              onChange={handleChange}
              placeholder="Ingrese DNI"
            />
            {errors.dni && (
              <span className="text-red-500 text-sm">{errors.dni}</span>
            )}
          </div>
        )}
        <div className="flex flex-col gap-2 w-full">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Ingrese email"
          />
          {errors.email && (
            <span className="text-red-500 text-sm">{errors.email}</span>
          )}
        </div>
        {mode === "create" && (
          <>
            <div className="flex flex-col gap-2 w-full">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="********"
              />
              {errors.password && (
                <span className="text-red-500 text-sm">{errors.password}</span>
              )}
            </div>
            <div className="flex flex-col gap-2 w-full">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="********"
              />
              {errors.confirmPassword && (
                <span className="text-red-500 text-sm">
                  {errors.confirmPassword}
                </span>
              )}
            </div>
          </>
        )}
        <DialogFooter className="pt-3 flex justify-end gap-3">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => {
                onClose();
                setFormData({
                  uid: "",
                  dni: "",
                  email: "",
                  password: "",
                  confirmPassword: "",
                  rol: "student",
                });
              }}
            >
              Cancelar
            </Button>
          </DialogClose>
          <Button disabled={loading} type="submit" className="cursor-pointer">
            {mode === "create" ? "Registrarse" : "Guardar"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
};
