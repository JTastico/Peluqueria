import { ReactNode, useCallback, useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Opciones {
  titulo: string;
  descripcion?: ReactNode;
  textoConfirmar?: string;
  textoCancelar?: string;
  /** Acción que borra o anula: el botón de confirmar se pinta en rojo */
  destructivo?: boolean;
}

// Reemplaza al `window.confirm` del navegador por una ventana propia:
//   const { confirmar, dialogo } = useConfirmar();
//   if (!(await confirmar({ titulo: "¿Eliminar?", destructivo: true }))) return;
//   ... y renderizar {dialogo} en el componente.
export function useConfirmar() {
  const [estado, setEstado] = useState<{ opts: Opciones; resolver: (v: boolean) => void } | null>(null);

  const confirmar = useCallback(
    (opts: Opciones) => new Promise<boolean>(resolver => setEstado({ opts, resolver })),
    []
  );

  const cerrar = (valor: boolean) => {
    estado?.resolver(valor);
    setEstado(null);
  };

  const o = estado?.opts;
  const dialogo = (
    <AlertDialog open={!!estado} onOpenChange={abierto => !abierto && cerrar(false)}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {o?.destructivo && <span className="rounded-full bg-red-100 p-2 text-red-600" aria-hidden><AlertTriangle className="h-5 w-5" /></span>}
            {o?.titulo}
          </AlertDialogTitle>
          {o?.descripcion && <AlertDialogDescription>{o.descripcion}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel className="min-h-[44px]" onClick={() => cerrar(false)}>{o?.textoCancelar ?? "Cancelar"}</AlertDialogCancel>
          <AlertDialogAction
            className={`min-h-[44px] ${o?.destructivo ? "bg-red-600 text-white hover:bg-red-700" : ""}`}
            onClick={() => cerrar(true)}>
            {o?.textoConfirmar ?? "Aceptar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { confirmar, dialogo };
}
