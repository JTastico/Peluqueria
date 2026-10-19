export { API_URL } from "./api";

export interface ItemVenta {
  id: string;
  servicio_id: string | null;
  servicio_nombre: string;
  trabajador_id: string | null;
  trabajador_nombre: string;
  precio: number;
  porcentaje_trabajador: number;
  monto_trabajador: number;
  monto_local: number;
}

export interface Venta {
  id: string;
  local_id: string;
  local_nombre: string;
  fecha_hora: string; // "YYYY-MM-DD HH:mm:ss"
  total: number;
  metodo_pago: string;
  estado: "activa" | "anulada";
  registrado_por: string;
  items: ItemVenta[];
}

export const METODOS_PAGO = [
  { value: "efectivo", label: "Efectivo" },
  { value: "yape", label: "Yape" },
  { value: "plin", label: "Plin" },
  { value: "tarjeta", label: "Tarjeta" },
];

export const formatMoney = (n: number) =>
  `S/ ${(Number(n) || 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// "2026-10-07 14:01:48" -> "14:01"
export const formatHora = (dt: string | null) => (dt ? dt.substring(11, 16) : "—");

const pad = (n: number) => String(n).padStart(2, "0");
export const fechaStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayStr = () => fechaStr(new Date());
export const ayerStr = () => { const d = new Date(); d.setDate(d.getDate() - 1); return fechaStr(d); };

// "50" -> "Trabajador 50% · Local 50%"
export const textoReparto = (pctTrabajador: number) =>
  `Trabajador ${pctTrabajador}% · Local ${Math.round((100 - pctTrabajador) * 100) / 100}%`;
