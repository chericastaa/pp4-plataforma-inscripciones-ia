"use client";
import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppStore } from "@/src/store";

type ApiError = {
  response?: {
    data?: {
      error?: string;
      message?: string;
    };
  };
};

const Eye = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

export default function Home() {
  const { setUser } = useAppStore();
  const router = useRouter();
  const [active, setActive] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({ nombre: "", dni: "", email: "", password: "", confirmPassword: "", rol: "alumno", codigoProfesor: "" });
  const [loading, setLoading] = useState(false);
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showRegisterPass, setShowRegisterPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [showCodigo, setShowCodigo] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  try {
    const { data } = await axios.post("http://localhost:3001/acceso", loginData);
    const { token, user: userData } = data;
    setUser({ id: userData.id, rol: userData.rol, nombre: userData.nombre });
    document.cookie = `token=${token}; path=/; SameSite=Strict`;
    localStorage.setItem("token", token);
    toast.success("Bienvenido!");
    router.push("/dashboard");
  } catch (err) {
    const apiError = err as ApiError;
    toast.warning(apiError.response?.data?.message || "Error al iniciar sesión");
  } finally {
    setLoading(false);
  }
};

const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();
  if (registerData.password !== registerData.confirmPassword) {
    return toast.warning("Las contraseñas no coinciden");
  }
  if (registerData.rol === "profesor") {
    if (!registerData.codigoProfesor) {
      return toast.warning("Ingresá el código de acceso para profesores");
    }
    if (registerData.codigoProfesor !== "PROF2026") {
      return toast.warning("Código incorrecto");
    }
  }
  setLoading(true);
  try {
    const { data } = await axios.post("http://localhost:3001/usuarios", registerData);
    const { token, user: userData } = data;
    setUser({ id: userData.id, rol: userData.rol, nombre: userData.nombre });
    document.cookie = `token=${token}; path=/; SameSite=Strict`;
    localStorage.setItem("token", token);
    toast.success("¡Bienvenido!");
    router.push("/dashboard");
  } catch (err) {
    const apiError = err as ApiError;
    const msg = apiError.response?.data?.message || apiError.response?.data?.error || "";
    const emailDuplicado = msg.toLowerCase().includes("email") || msg.toLowerCase().includes("existe") || msg.toLowerCase().includes("already") || msg.toLowerCase().includes("duplicate");
    toast.warning(emailDuplicado ? "Ya existe una cuenta con ese email" : msg || "Error al registrarse");
  } finally {
    setLoading(false);
  }
};

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; font-family:'Poppins',sans-serif; }
        body { display:flex; justify-content:center; align-items:center; min-height:100vh; background:linear-gradient(90deg,#0d1f35,#1a3a5c); }
        .container { position:relative; width:820px; height:520px; background:#fff; border-radius:30px; box-shadow:0 0 40px rgba(0,0,0,.4); overflow:hidden; }
        .form-box { position:absolute; right:0; width:50%; height:100%; background:#fff; display:flex; align-items:center; color:#333; text-align:center; padding:40px; z-index:1; transition:.6s ease-in-out 1.2s, visibility 0s 1s; }
        .container.active .form-box { right:50%; }
        .form-box.register { visibility:hidden; }
        .container.active .form-box.register { visibility:visible; }
        .form-box form { width:100%; }
        .form-box h1 { font-size:28px; margin-bottom:20px; color:#1a3a5c; }
        .input-box { position:relative; margin:14px 0; }
        .input-box input { width:100%; padding:12px 16px; background:#eee; border-radius:8px; border:none; outline:none; font-size:14px; color:#333; font-family:'Poppins',sans-serif; }
        .input-box input::placeholder { color:#888; }
        .input-box select { width:100%; padding:12px 16px; background:#eee; border-radius:8px; border:none; outline:none; font-size:14px; color:#333; font-family:'Poppins',sans-serif; }
        .btn { width:100%; height:44px; background:#185FA5; border-radius:8px; border:none; cursor:pointer; font-size:15px; color:#fff; font-weight:600; font-family:'Poppins',sans-serif; transition:background .2s; margin-top:8px; }
        .btn:hover { background:#378ADD; }
        .toggle-box { position:absolute; width:100%; height:100%; }
        .toggle-box::before { content:''; position:absolute; left:-250%; width:300%; height:100%; background:linear-gradient(135deg,#185FA5,#0d1f35); border-radius:150px; z-index:2; transition:1.8s ease-in-out; }
        .container.active .toggle-box::before { left:50%; }
        .toggle-panel { position:absolute; width:50%; height:100%; color:#fff; display:flex; flex-direction:column; justify-content:center; align-items:center; z-index:2; transition:.6s ease-in-out; padding:40px; text-align:center; }
        .toggle-panel h1 { font-size:26px; margin-bottom:10px; }
        .toggle-panel p { font-size:13px; margin-bottom:20px; opacity:0.8; }
        .toggle-panel.toggle-left { left:0; transition-delay:1.2s; }
        .container.active .toggle-panel.toggle-left { left:-50%; transition-delay:.6s; }
        .toggle-panel.toggle-right { right:-50%; transition-delay:.6s; }
        .container.active .toggle-panel.toggle-right { right:0; transition-delay:1.2s; }
        .toggle-btn { width:160px; height:44px; background:transparent; border:2px solid #fff; border-radius:8px; cursor:pointer; font-size:14px; color:#fff; font-weight:600; font-family:'Poppins',sans-serif; transition:background .2s; }
        .toggle-btn:hover { background:rgba(255,255,255,0.15); }
        .platform-name { font-size:12px; opacity:0.6; margin-bottom:16px; }
        .eye-btn { position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:#888; padding:0; display:flex; align-items:center; }
        .eye-btn:hover { color:#555; }
        .input-box .pass-input { padding-right:40px; }
      `}</style>

      <div className="auth-page">
        <div className={`container${active ? ' active' : ''}`}>

          <div className="form-box login">
            <form onSubmit={handleLogin}>
              <h1>Iniciar sesión</h1>
              <div className="input-box">
                <input type="email" placeholder="Correo electrónico" value={loginData.email} onChange={e => setLoginData({ ...loginData, email: e.target.value })} required />
              </div>
              <div className="input-box">
                <input className="pass-input" type={showLoginPass ? "text" : "password"} placeholder="Contraseña" value={loginData.password} onChange={e => setLoginData({ ...loginData, password: e.target.value })} required />
                <button type="button" className="eye-btn" onClick={() => setShowLoginPass(v => !v)} tabIndex={-1}>
                  {showLoginPass ? <EyeOff /> : <Eye />}
                </button>
              </div>
              <button type="submit" className="btn" disabled={loading}>{loading ? "Cargando..." : "Ingresar"}</button>
            </form>
          </div>

          <div className="form-box register">
            <form onSubmit={handleRegister}>
              <h1>Registro</h1>
              <div className="input-box">
                <input type="text" placeholder="Nombre completo" value={registerData.nombre} onChange={e => setRegisterData({ ...registerData, nombre: e.target.value })} required />
              </div>
              <div className="input-box">
                {registerData.rol === "profesor" ? (
                  <>
                    <input
                      className="pass-input"
                      type={showCodigo ? "text" : "password"}
                      placeholder="Código de acceso para profesores"
                      value={registerData.codigoProfesor}
                      onChange={e => setRegisterData({ ...registerData, codigoProfesor: e.target.value })}
                      required
                    />
                    <button type="button" className="eye-btn" onClick={() => setShowCodigo(v => !v)} tabIndex={-1}>
                      {showCodigo ? <EyeOff /> : <Eye />}
                    </button>
                  </>
                ) : (
                  <input
                    type="text"
                    placeholder="DNI"
                    value={registerData.dni}
                    onChange={e => setRegisterData({ ...registerData, dni: e.target.value })}
                  />
                )}
              </div>
              <div className="input-box">
                <input type="email" placeholder="Correo electrónico" value={registerData.email} onChange={e => setRegisterData({ ...registerData, email: e.target.value })} required />
              </div>
              <div className="input-box">
                <input className="pass-input" type={showRegisterPass ? "text" : "password"} placeholder="Contraseña" value={registerData.password} onChange={e => setRegisterData({ ...registerData, password: e.target.value })} required />
                <button type="button" className="eye-btn" onClick={() => setShowRegisterPass(v => !v)} tabIndex={-1}>
                  {showRegisterPass ? <EyeOff /> : <Eye />}
                </button>
              </div>
              <div className="input-box">
                <input className="pass-input" type={showConfirmPass ? "text" : "password"} placeholder="Confirmar contraseña" value={registerData.confirmPassword} onChange={e => setRegisterData({ ...registerData, confirmPassword: e.target.value })} required />
                <button type="button" className="eye-btn" onClick={() => setShowConfirmPass(v => !v)} tabIndex={-1}>
                  {showConfirmPass ? <EyeOff /> : <Eye />}
                </button>
              </div>
              <div className="input-box">
                <select aria-label="Rol de registro" value={registerData.rol} onChange={e => setRegisterData({ ...registerData, rol: e.target.value })}>
                  <option value="alumno">Alumno</option>
                  <option value="profesor">Profesor</option>
                </select>
              </div>
              <button type="submit" className="btn" disabled={loading}>{loading ? "Cargando..." : "Registrarme"}</button>
            </form>
          </div>

          <div className="toggle-box">
            <div className="toggle-panel toggle-left">
              <h1>Bienvenido!</h1>
              <p className="platform-name">Plataforma de Inscripciones</p>
              <p>¿No tenés cuenta?</p>
              <button className="toggle-btn" onClick={() => setActive(true)}>Registrarme</button>
            </div>
            <div className="toggle-panel toggle-right">
              <h1>Hola de nuevo!</h1>
              <p className="platform-name">Plataforma de Inscripciones</p>
              <p>¿Ya tenés cuenta?</p>
              <button className="toggle-btn" onClick={() => setActive(false)}>Iniciar sesión</button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}