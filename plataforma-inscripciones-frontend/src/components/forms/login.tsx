"use client";
import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  Label,
  Input,
  Button,
} from "@/src/components/ui";
import { useAppStore } from "@/src/store";

export const LoginForm = ({
  setFormState,
}: {
  setFormState: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const { setUser } = useAppStore();
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (!formData.email || !formData.password) {
      setLoading(false);
      return setError("Todos los campos son obligatorios");
    }
    try {
      const { data } = await axios.post(
  `${process.env.NEXT_PUBLIC_ACADEMIC_API}/api/auth/login`,
  formData);
      setUser(data.user);
      document.cookie = `token=${data.user.id}; path=/`;
      toast.success("Bienvenido!");
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al iniciar sesión");
      toast.warning("Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <CardDescription>
            ¡Hola! Ingresa tu usuario y contraseña para iniciar sesión.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="flex flex-col gap-5 items-center">
            <div className="flex flex-col gap-2 w-full">
              <Label>Email</Label>
              <Input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="tuemail@ejemplo.com" />
            </div>
            <div className="flex flex-col gap-2 w-full">
              <Label>Contraseña</Label>
              <Input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="********" />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </CardContent>
          <CardFooter className="flex justify-center pt-5">
            <Button className="cursor-pointer" type="submit" disabled={loading}>
              {loading ? "Cargando..." : "Iniciar sesión"}
            </Button>
          </CardFooter>
        </form>
      </Card>
      <div className="flex justify-center">
        <Button type="button" variant="link" onClick={() => setFormState("register")}>
          Registrarme
        </Button>
      </div>
    </div>
  );
};