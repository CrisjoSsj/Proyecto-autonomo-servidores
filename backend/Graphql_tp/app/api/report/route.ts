import { NextRequest } from 'next/server'
import { graphql, buildSchema } from 'graphql'
import { typeDefs } from '@/lib/graphql/schema'
import { resolvers } from '@/lib/graphql/resolvers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Construye schema ejecutable simple usando buildSchema y root resolvers adaptados.
const schema = buildSchema(typeDefs)

// Adaptación: buildSchema requiere un rootValue plano, mapeamos solo Query.*
const rootValue = Object.fromEntries(
  Object.entries((resolvers as any).Query || {}).map(([k, fn]) => [k, fn])
)

async function ejecutar(query: string) {
  return graphql({ schema, source: query, rootValue })
}

// NOTA: exportPdfFromResult / exportExcelFromResult son funciones cliente.
// Aquí implementamos versión servidor mínima.
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import ExcelJS from 'exceljs'

function extraerTablas(data: any) {
  const tablas: { nombre: string; filas: any[] }[] = []
  if (!data || typeof data !== 'object') return tablas
  for (const k of Object.keys(data)) {
    const v = (data as any)[k]
    if (Array.isArray(v)) tablas.push({ nombre: k, filas: v })
    else if (v && typeof v === 'object') tablas.push({ nombre: k, filas: [v] })
  }
  return tablas
}

// Serializa valores (primitivos, arrays, objetos) en una representación amigable
function serializarValor(value: any): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'string') return value
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '-'
  if (typeof value === 'boolean') return value ? 'sí' : 'no'
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    // Si son objetos, tomar campos clave
    if (value.every(v => typeof v === 'object' && v !== null)) {
      return value.map(obj => {
        if (obj.nombre) return obj.nombre
        if (obj.name) return obj.name
        if (obj.id && obj.role) return `${obj.id}:${obj.role}`
        if (obj.id && obj.categoria) return `${obj.id}:${obj.categoria}`
        if (obj.id) return String(obj.id)
        return JSON.stringify(obj)
      }).join(', ')
    }
    return value.map(v => serializarValor(v)).join(', ')
  }
  if (typeof value === 'object') {
    // Selección de campos comunes
    if (value.nombre) return String(value.nombre)
    if (value.name) return String(value.name)
    if (value.id && value.categoria && value.precio) return `${value.id}:${value.categoria}:$${value.precio}`
    if (value.id) return String(value.id)
    // Reducir objeto sin campos conocidos
    const keys = Object.keys(value).slice(0, 3)
    return '{' + keys.map(k => `${k}:${serializarValor(value[k])}`).join(', ') + (Object.keys(value).length > 3 ? ',…' : '') + '}'
  }
  return String(value)
}

async function generarPDF(data: any) {
  const doc = await PDFDocument.create()
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const tablas = extraerTablas(data)
  
  for (const t of tablas) {
    let page = doc.addPage([595, 842]) // A4 size
    const { width, height } = page.getSize()
    const margin = 50
    let y = height - margin
    
    // Título del reporte con fondo
    const titleWidth = width - (margin * 2)
    page.drawRectangle({
      x: margin,
      y: y - 25,
      width: titleWidth,
      height: 30,
      color: rgb(0.9, 0.92, 0.95)
    })
    
    page.drawText(t.nombre.toUpperCase(), { 
      x: margin + 10, 
      y: y - 5, 
      size: 16, 
      font: fontBold, 
      color: rgb(0.1, 0.2, 0.5) 
    })
    y -= 40
    
    if (!t.filas.length) {
      page.drawText('Sin datos disponibles', { x: margin, y, size: 12, font })
      continue
    }
    
    // Obtener headers y limpiar datos
    const headers = Array.from(new Set(t.filas.flatMap((r) => Object.keys(r))))
    const cleanData = t.filas.map(row => {
      const cleanRow: Record<string,string> = {}
      headers.forEach(h => {
        try {
          cleanRow[h] = serializarValor(row[h])
        } catch {
          cleanRow[h] = '-'
        }
      })
      return cleanRow
    })
    
    // Calcular anchos de columna
    const maxWidth = width - (margin * 2)
    const colWidth = Math.min(maxWidth / headers.length, 120)
    
    y -= 10
    
    // Fondo de headers
    page.drawRectangle({
      x: margin,
      y: y - 18,
      width: headers.length * colWidth,
      height: 22,
      color: rgb(0.3, 0.4, 0.7)
    })
    
    // Headers
    headers.forEach((h, i) => {
      const headerText = h.charAt(0).toUpperCase() + h.slice(1)
      page.drawText(headerText.slice(0, 12), { 
        x: margin + 5 + i * colWidth, 
        y: y - 3, 
        size: 10, 
        font: fontBold,
        color: rgb(1, 1, 1)
      })
    })
    y -= 25
    
    // Filas de datos
    cleanData.forEach((row, rowIndex) => {
      // Alternar color de fondo
      if (rowIndex % 2 === 0) {
        page.drawRectangle({
          x: margin,
          y: y - 14,
          width: headers.length * colWidth,
          height: 16,
          color: rgb(0.97, 0.97, 0.97)
        })
      }
      
      headers.forEach((h, i) => {
        const text = (row[h] || '-').slice(0, 28)
        page.drawText(text, { 
          x: margin + 5 + i * colWidth, 
          y: y - 2, 
          size: 9, 
          font,
          color: rgb(0.2, 0.2, 0.2)
        })
      })
      
      y -= 16
      
      // Nueva página si es necesario
      if (y < 80) {
        page = doc.addPage([595, 842])
        y = height - margin
        
        // Re-dibujar título
        page.drawRectangle({
          x: margin,
          y: y - 20,
          width: titleWidth,
          height: 25,
          color: rgb(0.9, 0.92, 0.95)
        })
        
        page.drawText(t.nombre.toUpperCase() + ' (continuación)', { 
          x: margin + 10, 
          y: y - 5, 
          size: 12, 
          font: fontBold, 
          color: rgb(0.1, 0.2, 0.5) 
        })
        y -= 35
        
        // Re-dibujar headers
        page.drawRectangle({
          x: margin,
          y: y - 18,
          width: headers.length * colWidth,
          height: 22,
          color: rgb(0.3, 0.4, 0.7)
        })
        
        headers.forEach((h, i) => {
          const headerText = h.charAt(0).toUpperCase() + h.slice(1)
          page.drawText(headerText.slice(0, 12), { 
            x: margin + 5 + i * colWidth, 
            y: y - 3, 
            size: 10, 
            font: fontBold,
            color: rgb(1, 1, 1)
          })
        })
        y -= 25
      }
    })
    
    // Footer en todas las páginas del reporte
    const pages = doc.getPages()
    pages.forEach((p, idx) => {
      p.drawText(`Total: ${cleanData.length} registros`, {
        x: margin,
        y: 30,
        size: 8,
        font,
        color: rgb(0.5, 0.5, 0.5)
      })
      p.drawText(new Date().toLocaleDateString('es-ES'), {
        x: width - margin - 80,
        y: 30,
        size: 8,
        font,
        color: rgb(0.5, 0.5, 0.5)
      })
      p.drawText(`Pág. ${idx + 1}`, {
        x: width / 2 - 20,
        y: 30,
        size: 8,
        font,
        color: rgb(0.5, 0.5, 0.5)
      })
    })
  }
  
  return await doc.save()
}

async function generarExcel(data: any) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Sistema de Reportes'
  wb.created = new Date()
  
  const tablas = extraerTablas(data)
  
  tablas.forEach((t) => {
    const ws = wb.addWorksheet(t.nombre.slice(0, 31)) // Excel limita a 31 caracteres
    
    if (!t.filas.length) {
      ws.addRow(['Sin datos disponibles'])
      ws.getCell('A1').font = { italic: true, color: { argb: 'FF666666' } }
      return
    }
    
    // Obtener headers y limpiar datos
    const headers = Array.from(new Set(t.filas.flatMap((r) => Object.keys(r))))
    const cleanData = t.filas.map(row => headers.map(h => serializarValor(row[h])))
    
    // Agregar título
    ws.addRow([`Reporte: ${t.nombre.toUpperCase()}`])
    ws.mergeCells(1, 1, 1, headers.length)
    const titleCell = ws.getCell(1, 1)
    titleCell.font = { size: 16, bold: true, color: { argb: 'FF1F4788' } }
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE7E9F5' }
    }
    ws.getRow(1).height = 30
    
    // Espacio
    ws.addRow([])
    
    // Headers
    const headerRow = ws.addRow(headers.map(h => h.charAt(0).toUpperCase() + h.slice(1)))
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    }
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' }
    headerRow.height = 25
    
    // Bordes para headers
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      }
    })
    
    // Datos
    cleanData.forEach((rowData, index) => {
      const dataRow = ws.addRow(rowData)
      
      // Alternar colores de fila
      if (index % 2 === 0) {
        dataRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8F9FA' }
        }
      }
      
      // Bordes para datos
      dataRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
        }
        cell.alignment = { vertical: 'middle' }
      })
    })
    
    // Ajustar ancho de columnas automáticamente
    headers.forEach((header, i) => {
      const col = ws.getColumn(i + 1)
      const maxLength = Math.max(
        header.length,
        ...cleanData.map(row => String(row[i] || '').length)
      )
      col.width = Math.min(Math.max(maxLength + 2, 12), 50)
    })
    
    // Footer con información
    ws.addRow([])
    const footerRow = ws.addRow([`Total de registros: ${cleanData.length}`, '', '', `Generado: ${new Date().toLocaleString('es-ES')}`])
    footerRow.font = { italic: true, size: 9, color: { argb: 'FF666666' } }
    
    // Congelar primera fila (título y headers)
    ws.views = [
      { state: 'frozen', xSplit: 0, ySplit: 3 }
    ]
  })
  
  const buf = await wb.xlsx.writeBuffer()
  const arr = buf instanceof Uint8Array ? buf : new Uint8Array(buf as ArrayBuffer)
  const clone = new Uint8Array(arr.length)
  clone.set(arr)
  return clone
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { query, formato } = body as { query?: string; formato?: 'pdf' | 'excel' }
    if (!query || !formato) {
      return new Response(JSON.stringify({ error: 'Falta query o formato' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    const resultado = await ejecutar(query)
    if (resultado.errors?.length) {
      return new Response(JSON.stringify({ error: resultado.errors.map((e) => e.message) }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    const data = resultado.data
    if (!data) {
      return new Response(JSON.stringify({ error: 'Sin datos' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (formato === 'pdf') {
      const pdfBytes = await generarPDF(data)
      const pdfArray = pdfBytes instanceof Uint8Array ? pdfBytes : new Uint8Array(pdfBytes as ArrayBuffer)
      const pdfBuf: ArrayBuffer = pdfArray.buffer.slice(pdfArray.byteOffset, pdfArray.byteOffset + pdfArray.byteLength) as ArrayBuffer
      return new Response(new Uint8Array(pdfBuf), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="reporte.pdf"',
        },
      })
    } else {
      const excelBytes = await generarExcel(data)
      const xArr = excelBytes instanceof Uint8Array ? excelBytes : new Uint8Array(excelBytes as ArrayBuffer)
      const excelBuf: ArrayBuffer = xArr.buffer.slice(xArr.byteOffset, xArr.byteOffset + xArr.byteLength) as ArrayBuffer
      return new Response(new Uint8Array(excelBuf), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="reporte.xlsx"',
        },
      })
    }
  } catch (e: any) {
    console.error('[REPORT POST ERROR]', e)
    return new Response(JSON.stringify({ error: e?.message || 'Error desconocido' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
