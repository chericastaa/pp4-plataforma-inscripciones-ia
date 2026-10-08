import { Fragment, ReactNode } from "react";

const INLINE = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*\s][^*]*\*|_[^_\s][^_]*_)/g;

const inline = (texto: string): ReactNode[] =>
  texto.split(INLINE).map((parte, i) => {
    if (/^\*\*[^*]+\*\*$/.test(parte) || /^__[^_]+__$/.test(parte)) return <strong key={i}>{parte.slice(2, -2)}</strong>;
    if (/^`[^`]+`$/.test(parte)) return <code key={i}>{parte.slice(1, -1)}</code>;
    if (/^\*[^*\s][^*]*\*$/.test(parte) || /^_[^_\s][^_]*_$/.test(parte)) return <em key={i}>{parte.slice(1, -1)}</em>;
    return <Fragment key={i}>{parte}</Fragment>;
  });

type Bloque =
  | { tipo: "p"; lineas: string[] }
  | { tipo: "h"; texto: string }
  | { tipo: "ul"; items: string[] }
  | { tipo: "ol"; items: string[] };

const parsear = (md: string): Bloque[] => {
  const bloques: Bloque[] = [];
  let actual: Bloque | null = null;

  const cerrar = () => {
    if (actual) bloques.push(actual);
    actual = null;
  };

  for (const linea of md.replace(/\r/g, "").split("\n")) {
    const vineta = linea.match(/^\s*[*-]\s+(.*)$/);
    const numero = linea.match(/^\s*\d+[.)]\s+(.*)$/);
    const titulo = linea.match(/^\s*#{1,6}\s+(.*)$/);

    if (!linea.trim()) {
      cerrar();
    } else if (titulo) {
      cerrar();
      bloques.push({ tipo: "h", texto: titulo[1] });
    } else if (vineta) {
      if (actual?.tipo !== "ul") {
        cerrar();
        actual = { tipo: "ul", items: [] };
      }
      actual.items.push(vineta[1]);
    } else if (numero) {
      if (actual?.tipo !== "ol") {
        cerrar();
        actual = { tipo: "ol", items: [] };
      }
      actual.items.push(numero[1]);
    } else {
      if (actual?.tipo !== "p") {
        cerrar();
        actual = { tipo: "p", lineas: [] };
      }
      actual.lineas.push(linea.trim());
    }
  }
  cerrar();
  return bloques;
};

export const Markdown = ({ texto }: { texto: string }) => (
  <>
    {parsear(texto).map((b, i) => {
      if (b.tipo === "h") return <p key={i}><strong>{inline(b.texto)}</strong></p>;
      if (b.tipo === "ul") return <ul key={i}>{b.items.map((t, j) => <li key={j}>{inline(t)}</li>)}</ul>;
      if (b.tipo === "ol") return <ol key={i}>{b.items.map((t, j) => <li key={j}>{inline(t)}</li>)}</ol>;
      return (
        <p key={i}>
          {b.lineas.map((l, j) => (
            <Fragment key={j}>
              {j > 0 && <br />}
              {inline(l)}
            </Fragment>
          ))}
        </p>
      );
    })}
  </>
);
