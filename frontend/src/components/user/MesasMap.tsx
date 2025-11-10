import { useMemo } from "react";
import "../../css/user/MesasMap.css";

type EstadoMesa = "libre" | "disponible" | "ocupada" | "reservada" | "limpieza" | string;

export interface MesaEnMapa {
  id: number;
  numero: number;
  capacidad: number;
  estado: EstadoMesa;
  ubicacion?: string;
}

interface MesasMapProps {
  mesas: MesaEnMapa[];
}

const estadoClaseMap: Record<string, string> = {
  libre: "mesa-disponible",
  disponible: "mesa-disponible",
  ocupada: "mesa-ocupada",
  reservada: "mesa-reservada",
  limpieza: "mesa-limpieza",
};

const estadoTextoMap: Record<string, string> = {
  libre: "Disponible",
  disponible: "Disponible",
  ocupada: "Ocupada",
  reservada: "Reservada",
  limpieza: "En limpieza",
};

export function MesasMap({ mesas }: MesasMapProps) {
  const mapaMesas = useMemo(() => {
    const ordenadas = [...mesas].sort((a, b) => a.numero - b.numero);
    const filas: (number | null)[][] = [];

    for (let i = 0; i < ordenadas.length; i += 4) {
      const grupo = ordenadas.slice(i, i + 4);
      filas.push([
        grupo[0]?.numero ?? null,
        grupo[1]?.numero ?? null,
        null,
        grupo[2]?.numero ?? null,
        grupo[3]?.numero ?? null,
      ]);
    }

    if (filas.length === 0) {
      filas.push([null, null, null, null, null]);
    }

    return filas;
  }, [mesas]);

  const mesasPorNumero = useMemo(() => {
    const map = new Map<number, MesaEnMapa>();
    mesas.forEach((mesa) => map.set(mesa.numero, mesa));
    return map;
  }, [mesas]);

  return (
    <div className="mesas-map">
      <div className="mesas-map__header">
        <div className="mesas-map__label">Entrada</div>
        <div className="mesas-map__pasillo-central">Pasillo central</div>
        <div className="mesas-map__label">Cocina</div>
      </div>

      {mesas.length === 0 && (
        <div className="mesas-map__empty">
          No hay mesas registradas todavía. Añade nuevas mesas desde el panel de administración.
        </div>
      )}

      <div className="mesas-map__grid">
        {mapaMesas.map((fila, filaIndex) => (
          <div className="mesas-map__row" key={`fila-${filaIndex}`}>
            {fila.map((numeroMesa, celdaIndex) => {
              if (numeroMesa === null) {
                return (
                  <div
                    key={`pasillo-${filaIndex}-${celdaIndex}`}
                    className="mesas-map__aisle"
                  >
                    &nbsp;
                  </div>
                );
              }

              const mesa = mesasPorNumero.get(numeroMesa);
              const estadoNormalizado = (mesa?.estado || "libre").toLowerCase();
              const claseEstado = estadoClaseMap[estadoNormalizado] || "mesa-desconocida";
              const estadoTexto = estadoTextoMap[estadoNormalizado] || mesa?.estado || "Sin datos";

              return (
                <div
                  key={`mesa-${numeroMesa}`}
                  className={`mesas-map__seat ${claseEstado}`}
                >
                  <span className="mesas-map__seat-numero">Mesa {numeroMesa}</span>
                  <span className="mesas-map__seat-capacidad">
                    {mesa ? `${mesa.capacidad} personas` : "Capacidad desconocida"}
                  </span>
                  <span className="mesas-map__seat-estado">{estadoTexto}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="mesas-map__legend">
        <div className="mesas-map__legend-item">
          <span className="mesas-map__legend-color mesa-disponible" />
          <span>Disponible</span>
        </div>
        <div className="mesas-map__legend-item">
          <span className="mesas-map__legend-color mesa-ocupada" />
          <span>Ocupada</span>
        </div>
        <div className="mesas-map__legend-item">
          <span className="mesas-map__legend-color mesa-reservada" />
          <span>Reservada</span>
        </div>
        <div className="mesas-map__legend-item">
          <span className="mesas-map__legend-color mesa-limpieza" />
          <span>En limpieza</span>
        </div>
        <div className="mesas-map__legend-item">
          <span className="mesas-map__legend-color mesa-desconocida" />
          <span>Sin datos</span>
        </div>
      </div>
    </div>
  );
}

export default MesasMap;

