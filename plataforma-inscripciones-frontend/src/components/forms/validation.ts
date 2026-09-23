export const validateRegisterForm = (formData: {
  dni: string;
  email: string;
  password: string;
  confirmPassword: string;
  rol: string;
}) => {
  const newErrors: { [key: string]: string } = {};
  const { dni, email, password, confirmPassword, rol } = formData;

  if (!dni?.trim()) newErrors.dni = "El DNI es obligatorio";
  else if (dni.length < 6)
    newErrors.dni = "El DNI debe tener al menos 6 caracteres";

  if (!email.trim()) newErrors.email = "El email es obligatorio";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    newErrors.email = "Formato de email inválido";

  if (!password) newErrors.password = "La contraseña es obligatoria";
  else if (password.length < 6)
    newErrors.password = "Debe tener al menos 6 caracteres";

  if (!confirmPassword) newErrors.confirmPassword = "Confirma tu contraseña";
  else if (password !== confirmPassword)
    newErrors.confirmPassword = "Las contraseñas no coinciden";

  if (!rol) newErrors.rol = "Debes seleccionar un rol";

  return newErrors;
};
