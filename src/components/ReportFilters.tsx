import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface ReportFilterValues {
  local_id: string; // "todos" o UUID
  desde: string;
  hasta: string;
  hora_desde: string;
  hora_hasta: string;
}

export const defaultReportFilters = (): ReportFilterValues => {
  const fmt = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  const hoy = new Date();
  const inicio = new Date();
  inicio.setDate(hoy.getDate() - 29);
  return { local_id: "todos", desde: fmt(inicio), hasta: fmt(hoy), hora_desde: "", hora_hasta: "" };
};

export const filtersToQuery = (f: ReportFilterValues) => {
  const p = new URLSearchParams();
  if (f.local_id !== "todos") p.set("local_id", f.local_id);
  if (f.desde) p.set("desde", f.desde);
  if (f.hasta) p.set("hasta", f.hasta);
  if (f.hora_desde) p.set("hora_desde", f.hora_desde);
  if (f.hora_hasta) p.set("hora_hasta", f.hora_hasta);
  return p.toString();
};

interface Props {
  value: ReportFilterValues;
  onChange: (v: ReportFilterValues) => void;
  locales: { id: string; nombre: string }[];
  /** Mostrar el filtro por rango de horas (por defecto sí) */
  conHoras?: boolean;
}

export function ReportFilters({ value, onChange, locales, conHoras = true }: Props) {
  const set = (patch: Partial<ReportFilterValues>) => onChange({ ...value, ...patch });
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end [&>div]:min-w-0 [&_input]:min-w-0">
      <div className="col-span-2 md:col-span-1">
        <Label>Local</Label>
        <Select value={value.local_id} onValueChange={v => set({ local_id: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los locales</SelectItem>
            {locales.map(l => <SelectItem key={l.id} value={l.id}>{l.nombre}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="f-desde">Desde</Label>
        <Input id="f-desde" type="date" value={value.desde} max={value.hasta || undefined}
          onChange={e => set({ desde: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="f-hasta">Hasta</Label>
        <Input id="f-hasta" type="date" value={value.hasta} min={value.desde || undefined}
          onChange={e => set({ hasta: e.target.value })} />
      </div>
      {conHoras && <div>
        <Label htmlFor="f-hd">Hora desde</Label>
        <Input id="f-hd" type="time" value={value.hora_desde} onChange={e => set({ hora_desde: e.target.value })} />
      </div>}
      {conHoras && <div>
        <Label htmlFor="f-hh">Hora hasta</Label>
        <Input id="f-hh" type="time" value={value.hora_hasta} onChange={e => set({ hora_hasta: e.target.value })} />
      </div>}
    </div>
  );
}
