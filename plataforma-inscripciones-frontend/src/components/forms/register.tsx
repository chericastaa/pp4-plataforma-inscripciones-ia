"use client";

import React from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Label,
  Input,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  CardTitle,
} from "@/src/components/ui";
import { validateRegisterForm } from "./validation";
import axios from "axios";

export const RegisterForm = ({
  setFormState,
}: {
  setFormState: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const [formData, setFormData] = React.useState({
    dni: "",
    email: "",
    password: "",
    confirmPassword: "",
    rol: "administrador",
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

  const handleRoleChange = (value: string) => {
    const updatedData = { ...formData, rol: value };
    setFormData(updatedData);

    const newErrors = validateRegisterForm(updatedData);
    setErrors((prev) => ({
      ...prev,
      rol: newErrors.rol || "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const validationErrors = validateRegisterForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }
    try {
      const { data } = await axios.post(
  `${process.env.NEXT_PUBLIC_ACADEMIC_API}/api/auth/register`,
  formData);
      setFormData({ dni: "", email: "", password: "", confirmPassword: "", rol: "administrador" });
      toast.success("¡Usuario registrado con éxito!");
      return setFormState("login");
    } catch (error: any) {
      toast.warning("Ups! parece que ocurrió un error", {
        description: error.response?.data?.error || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle>
            <strong>Regístrate</strong>. Es rápido y fácil.
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col gap-5 items-center">
          <div className="flex flex-col gap-2 w-full">
            <Label htmlFor="dni">DNI</Label>
            <Input
              id="dni"
              name="dni"
              value={formData.dni}
              onChange={handleChange}
              placeholder="Tu número de DNI"
            />
            {errors.dni && (
              <span className="text-red-500 text-sm">{errors.dni}</span>
            )}
          </div>
          <div className="flex flex-col gap-2 w-full">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="ejemplo@gmail.com"
            />
            {errors.email && (
              <span className="text-red-500 text-sm">{errors.email}</span>
            )}
          </div>
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
          <div className="flex flex-col gap-2 justify-start w-full">
            <Label>Seleccione su rol</Label>
            <Select value={formData.rol} onValueChange={handleRoleChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="administrador">Administrador</SelectItem>
              </SelectContent>
            </Select>
            {errors.rol && (
              <span className="text-red-500 text-sm">{errors.rol}</span>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex justify-center">
          <Button type="submit" className="cursor-pointer">
            Registrarse
          </Button>
        </CardFooter>
      </Card>

      <div className="flex justify-center">
        <Button
          type="button"
          variant="link"
          onClick={() => setFormState("login")}
        >
          Iniciar sesión
        </Button>
      </div>
    </form>
  );
};
