"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Recursos soportados por la API de reportes
const RECURSOS: { value: string; label: string; fecha?: boolean }[] = [
  { value: 'usuarios', label: 'Usuarios' },
  { value: 'platos', label: 'Platos' },
  { value: 'pedidosDelDia', label: 'Pedidos del Día', fecha: true },
  { value: 'ventas', label: 'Estadísticas de Ventas', fecha: true },
]

function descargar(url: string, nombreSugerido?: string) {
  fetch(url)
    .then(async (res) => {
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(`Error ${res.status}: ${txt}`)
      }
      const disposition = res.headers.get('Content-Disposition') || ''
      let filename = nombreSugerido || 'reporte'
      const match = /filename="?([^";]+)"?/i.exec(disposition || '')
      if (match) filename = match[1]
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(a.href), 5000)
    })
    .catch((e) => alert(e.message))
}

export function ReportButtons() {
  const [recurso, setRecurso] = useState('usuarios')
  const [fecha, setFecha] = useState<string>('')
  // Las rutas servidor se han deshabilitado: todo reporte se genera en el cliente.
  const recursoActual = RECURSOS.find((r) => r.value === recurso)

  const buildLegacyUrl = (formato: 'pdf' | 'excel') => {
    // Placeholder de la antigua ruta (ya eliminada)
    return `#legacy-${formato}-${recurso}`
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <label className="text-sm font-medium">Recurso</label>
        <Select value={recurso} onValueChange={setRecurso}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un recurso" />
          </SelectTrigger>
          <SelectContent>
            {RECURSOS.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {recursoActual?.fecha && (
        <div className="grid gap-2">
          <label className="text-sm font-medium">Fecha (YYYY-MM-DD)</label>
          <Input
            placeholder="2025-11-16"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            type="date"
          />
        </div>
      )}
      <div className="rounded-md border p-3 text-xs text-muted-foreground bg-muted/40">
        Los reportes PDF y Excel ahora se generan directamente en tu navegador
        usando los datos devueltos por la consulta GraphQL. Las rutas server
        fueron desactivadas para evitar caídas. Para un servicio centralizado
        futuro, se recomienda un micro-servicio Node separado.
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={() => alert('Usa los botones de exportar en el resultado de la consulta (PDF/Excel)')}>
          Cómo exportar PDF
        </Button>
        <Button
          variant="outline"
          onClick={() => alert('Usa los botones de exportar en el resultado de la consulta (PDF/Excel)')}>
          Cómo exportar Excel
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Usa estos botones para generar reportes de los datos en memoria. Para
        <strong>pedidosDelDia</strong> y <strong>ventas</strong> puedes elegir una fecha; si la dejas vacía se usa la actual.
      </p>
    </div>
  )
}
