export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  const { email, nombre } = await req.json();

  if (!email || !nombre) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS?.replace(/\s/g, ""),
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  try {
    await transporter.sendMail({
      from: `"Aula Virtual" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "¡Bienvenido/a al Aula Virtual!",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#f9fafb;border-radius:12px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#185FA5,#0d1f35);padding:32px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:24px;">Plataforma de Inscripciones</h1>
          </div>
          <div style="padding:32px;">
            <p style="font-size:18px;color:#111827;margin-bottom:12px;">Hola, <strong>${nombre}</strong>!</p>
            <p style="font-size:15px;color:#374151;line-height:1.6;">
              Tu cuenta fue creada con éxito. Ya podés ingresar a la plataforma e inscribirte en tus materias.
            </p>
            <p style="font-size:22px;text-align:center;margin:28px 0;">¡Ahora a aprender! 🎓</p>
            <p style="font-size:13px;color:#9ca3af;margin-top:24px;">
              Si no fuiste vos quien creó esta cuenta, ignorá este mensaje.
            </p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Nodemailer error:", err);
    return NextResponse.json({ error: "No se pudo enviar el email", detail: String(err) }, { status: 500 });
  }
}
