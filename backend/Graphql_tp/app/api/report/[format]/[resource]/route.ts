import { NextRequest } from 'next/server'
// Se importa de forma diferida dentro del handler para minimizar coste inicial
import type { ReportResource } from '@/lib/reporting/generators'

export const runtime = 'nodejs'

type Params = { format: string; resource: string }

export async function GET(request: NextRequest, { params }: { params: Params }) {
  const { format, resource } = params
  const searchParams = request.nextUrl.searchParams
  const fecha = searchParams.get('fecha') || undefined
  if (!['pdf', 'excel'].includes(format)) {
    return new Response('Formato no soportado', { status: 400 })
  }
  // Nuevos recursos simplificados
  const validResources: ReportResource[] = ['platosBasico', 'ventasResumen']
  if (!validResources.includes(resource as ReportResource)) {
    return new Response('Recurso no soportado', { status: 400 })
  }
  const modoMeta = searchParams.get('meta') === '1'
  const modoPing = searchParams.get('meta') === 'ping'
  if (modoPing) {
    return new Response(JSON.stringify({ ok: true, recurso: resource, formato: format }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  try {
    const { generateReport } = await import('@/lib/reporting/generators')
    const { data, mime, filename } = await generateReport(
      resource as ReportResource,
      format as 'pdf' | 'excel',
      fecha,
    )
    
    // 🔔 Enviar notificación WebSocket después de generar el reporte
    try {
      const registros = resource === 'platosBasico' ? 'varios' : 'resumen'
      await fetch('http://localhost:8081/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'reportes',
          event: 'reporte_generado',
          data: {
            recurso: resource,
            formato: format,
            filename: filename,
            registros: registros,
            timestamp: new Date().toISOString()
          }
        })
      })
      console.log('✅ Notificación de reporte enviada al WebSocket')
    } catch (wsError) {
      console.warn('⚠️ No se pudo enviar notificación WebSocket:', wsError)
      // No fallar la generación del reporte por error de notificación
    }
    
    if (modoMeta) {
      return new Response(
        JSON.stringify({ recurso: resource, formato: format, bytes: data.length, fecha }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    }
    const uint = data instanceof Uint8Array ? data : new Uint8Array(data as ArrayBuffer)
    // Evitar Buffer si hubiera entorno edge (aunque runtime nodejs). Se usa ArrayBuffer directo.
    const arrayBuffer: ArrayBuffer = uint.buffer.slice(
      uint.byteOffset,
      uint.byteOffset + uint.byteLength,
    ) as ArrayBuffer
    return new Response(arrayBuffer, {
      headers: {
        'Content-Type': mime,
        'Content-Length': uint.length.toString(),
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e: any) {
    console.error('[REPORT ERROR]', e)
    const body = JSON.stringify({ error: e?.message || 'Error', stack: e?.stack, resource, format, fecha })
    return new Response(body, { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}