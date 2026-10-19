import { useEffect, useState } from "react";
import { Delete } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatMoney } from "@/lib/ventas";

interface Props {
  abierto: boolean;
  titulo: string;
  precioActual: number;
  precioOriginal: number;
  onConfirmar: (precio: number) => void;
  onCerrar: () => void;
}

// Teclado numérico en pantalla para ajustar un precio con botones (sin escribir en un formulario).
export function PrecioDialog({ abierto, titulo, precioActual, precioOriginal, onConfirmar, onCerrar }: Props) {
  const [texto, setTexto] = useState("");

  useEffect(() => { if (abierto) setTexto(String(precioActual)); }, [abierto, precioActual]);

  const pulsar = (t: string) => setTexto(prev => {
    if (t === ".") return prev.includes(".") ? prev : (prev === "" ? "0." : prev + ".");
    const base = prev === "0" ? "" : prev;
    const [, dec] = (base + t).split(".");
    if (dec !== undefined && dec.length > 2) return prev;      // máximo 2 decimales
    if ((base + t).replace(".", "").length > 8) return prev;    // máximo 8 dígitos
    return base + t;
  });
  const borrar = () => setTexto(prev => prev.slice(0, -1));
  const sumar = (n: number) => setTexto(String(Math.max(0, Math.round(((Number(texto) || 0) + n) * 100) / 100)));

  const valor = Number(texto);
  const valido = Number.isFinite(valor) && valor > 0;

  return (
    <Dialog open={abierto} onOpenChange={o => !o && onCerrar()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>Precio original: {formatMoney(precioOriginal)}</DialogDescription>
        </DialogHeader>

        <div className="rounded-xl bg-muted px-4 py-3 text-right text-4xl font-bold tabular-nums" aria-live="polite">
          S/ {texto === "" ? "0" : texto}
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[-5, -1, 1, 5].map(n => (
            <Button key={n} type="button" variant="outline" className="h-11" onClick={() => sumar(n)}>{n > 0 ? `+${n}` : n}</Button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0"].map(t => (
            <Button key={t} type="button" variant="secondary" className="h-14 text-xl font-semibold" onClick={() => pulsar(t)}>{t}</Button>
          ))}
          <Button type="button" variant="secondary" className="h-14" onClick={borrar} aria-label="Borrar"><Delete className="h-5 w-5" /></Button>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={() => setTexto(String(precioOriginal))}>Precio original</Button>
          <Button type="button" disabled={!valido} onClick={() => onConfirmar(Math.round(valor * 100) / 100)}>Aceptar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
