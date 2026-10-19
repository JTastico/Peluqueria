import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useBrand } from "@/hooks/useBrand";
import { ITEMS_NAV, puedeAcceder } from "@/lib/navegacion";

const NotFound = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { nombre, logoUrl } = useBrand();
  // Accesos rápidos: las pantallas a las que este usuario realmente puede entrar
  const accesos = ITEMS_NAV.filter(i => puedeAcceder(i, user)).slice(0, 4);

  useEffect(() => {
    const anterior = document.title;
    document.title = `Página no encontrada · ${nombre}`;
    return () => { document.title = anterior; };
  }, [nombre]);

  return (
    <div className="relative flex min-h-[calc(100vh-5rem)] items-center justify-center overflow-hidden px-4 py-12">
      {/* Fondo decorativo */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-stylepro-lavender-200/50 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-stylepro-gold-200/40 blur-3xl" />
      </div>

      <section className="relative w-full max-w-xl text-center motion-safe:animate-fade-in" aria-labelledby="nf-titulo">
        <div className="relative mx-auto mb-6 flex h-28 w-28 items-center justify-center">
          <span aria-hidden className="absolute inset-0 rounded-3xl bg-gradient-to-br from-stylepro-lavender-500 to-stylepro-lavender-700 shadow-lg shadow-stylepro-lavender-500/30 rotate-6" />
          <span aria-hidden className="absolute inset-1.5 rounded-[1.25rem] bg-white" />
          {logoUrl ? (
            <img src={logoUrl} alt="" className="relative h-14 w-14 object-contain" />
          ) : (
            <Scissors className="relative h-12 w-12 -rotate-45 text-stylepro-lavender-600" aria-hidden />
          )}
        </div>

        <p className="bg-gradient-to-r from-stylepro-lavender-600 to-stylepro-gold-500 bg-clip-text text-8xl font-extrabold leading-none tracking-tighter text-transparent sm:text-9xl" aria-hidden>
          404
        </p>
        <h1 id="nf-titulo" className="mt-4 text-3xl font-bold tracking-tight text-foreground">
          Esta página se fue de corte
        </h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          No encontramos lo que buscabas. Puede que el enlace esté mal escrito o que la página ya no exista.
        </p>

        <p className="mx-auto mt-4 max-w-full truncate rounded-lg border bg-white/80 px-3 py-2 font-mono text-sm text-muted-foreground" title={pathname}>
          {pathname}
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="min-h-[44px] w-full sm:w-auto">
            <Link to="/"><Home className="mr-2 h-4 w-4" aria-hidden /> Ir a mi inicio</Link>
          </Button>
          <Button variant="outline" size="lg" className="min-h-[44px] w-full sm:w-auto" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden /> Volver atrás
          </Button>
        </div>

        {accesos.length > 0 && (
          <nav aria-label="Accesos rápidos" className="mt-10">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">O ve directo a</p>
            <ul className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {accesos.map(({ url: to, title: label, icon: Icon }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="inline-flex min-h-[40px] items-center gap-2 rounded-full border bg-white px-4 text-sm font-medium text-foreground shadow-sm transition-colors duration-150 hover:border-primary/40 hover:bg-stylepro-lavender-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Icon className="h-4 w-4 text-stylepro-lavender-600" aria-hidden />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </section>
    </div>
  );
};

export default NotFound;
