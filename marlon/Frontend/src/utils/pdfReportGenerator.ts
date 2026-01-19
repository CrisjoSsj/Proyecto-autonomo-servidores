import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Chart, registerables } from 'chart.js';

// Registrar todos los componentes de Chart.js
Chart.register(...registerables);

interface DashboardData {
  totalServicios: number;
  totalReservas: number;
  ingresosTotales: string;
  serviciosPopulares: Array<{
    servicio: { nombreServicio: string; precio: string; ratingPromedio?: number };
    cantidadVendida: number;
    ingresosGenerados: string;
  }>;
  topProveedores: Array<{
    proveedor: { user: { firstName: string; lastName: string } };
    totalServicios: number;
    ingresosTotales: string;
    promedioCalificacion?: number;
  }>;
  clientesActivos: Array<{
    cliente: { user: { firstName: string; lastName: string; username?: string } };
    totalReservas: number;
    gastoTotal: string;
  }>;
}

// Función para crear un gráfico y convertirlo a imagen
async function createChartImage(type: 'bar' | 'pie' | 'line', data: any, options: any): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 400;
    
    const chart = new Chart(canvas, {
      type,
      data,
      options: {
        ...options,
        responsive: false,
        animation: false,
      }
    });

    // Esperar a que el gráfico se renderice
    setTimeout(() => {
      const imageData = canvas.toDataURL('image/png');
      chart.destroy();
      resolve(imageData);
    }, 100);
  });
}

export async function generateDashboardPDF(data: DashboardData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  let yPosition = 20;

  // Función para agregar nueva página si es necesario
  const checkNewPage = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
    }
  };

  // ENCABEZADO
  doc.setFillColor(123, 92, 255);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Reporte General del Dashboard', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const currentDate = new Date().toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  doc.text(`Fecha de generación: ${currentDate}`, pageWidth / 2, 30, { align: 'center' });

  yPosition = 50;

  // RESUMEN EJECUTIVO
  doc.setTextColor(123, 92, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('📊 Resumen Ejecutivo', 15, yPosition);
  yPosition += 10;

  // Tarjetas de métricas
  doc.setFillColor(240, 240, 255);
  doc.roundedRect(15, yPosition, 55, 25, 3, 3, 'F');
  doc.roundedRect(75, yPosition, 55, 25, 3, 3, 'F');
  doc.roundedRect(135, yPosition, 55, 25, 3, 3, 'F');

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  doc.text('Total Servicios', 42.5, yPosition + 8, { align: 'center' });
  doc.text('Total Reservas', 102.5, yPosition + 8, { align: 'center' });
  doc.text('Ingresos Totales', 162.5, yPosition + 8, { align: 'center' });

  doc.setTextColor(123, 92, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(data.totalServicios.toString(), 42.5, yPosition + 18, { align: 'center' });
  doc.text(data.totalReservas.toString(), 102.5, yPosition + 18, { align: 'center' });
  doc.text(`$${data.ingresosTotales}`, 162.5, yPosition + 18, { align: 'center' });

  yPosition += 35;
  checkNewPage(80);

  // SERVICIOS POPULARES
  doc.setTextColor(123, 92, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('🏆 Servicios Más Populares', 15, yPosition);
  yPosition += 5;

  // Tabla de servicios populares
  autoTable(doc, {
    startY: yPosition,
    head: [['Servicio', 'Precio', 'Ventas', 'Ingresos']],
    body: data.serviciosPopulares.slice(0, 5).map(item => [
      item.servicio.nombreServicio,
      `$${item.servicio.precio}`,
      item.cantidadVendida.toString(),
      `$${item.ingresosGenerados}`
    ]),
    theme: 'grid',
    headStyles: { 
      fillColor: [123, 92, 255],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    styles: {
      fontSize: 9,
      cellPadding: 4
    },
    alternateRowStyles: { fillColor: [245, 245, 250] }
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;
  checkNewPage(100);

  // GRÁFICO DE SERVICIOS POPULARES
  if (data.serviciosPopulares.length > 0) {
    const chartData = {
      labels: data.serviciosPopulares.slice(0, 5).map(s => s.servicio.nombreServicio),
      datasets: [{
        label: 'Ingresos',
        data: data.serviciosPopulares.slice(0, 5).map(s => parseFloat(s.ingresosGenerados)),
        backgroundColor: [
          'rgba(123, 92, 255, 0.8)',
          'rgba(76, 175, 80, 0.8)',
          'rgba(255, 152, 0, 0.8)',
          'rgba(33, 150, 243, 0.8)',
          'rgba(233, 30, 99, 0.8)'
        ],
        borderColor: [
          'rgb(123, 92, 255)',
          'rgb(76, 175, 80)',
          'rgb(255, 152, 0)',
          'rgb(33, 150, 243)',
          'rgb(233, 30, 99)'
        ],
        borderWidth: 2
      }]
    };

    const chartImage = await createChartImage('bar', chartData, {
      plugins: {
        title: {
          display: true,
          text: 'Ingresos por Servicio',
          font: { size: 14, weight: 'bold' }
        },
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value: any) {
              return '$' + value;
            }
          }
        }
      }
    });

    doc.addImage(chartImage, 'PNG', 15, yPosition, 180, 90);
    yPosition += 100;
  }

  checkNewPage(80);

  // TOP PROVEEDORES
  doc.setTextColor(123, 92, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('👥 Top Proveedores', 15, yPosition);
  yPosition += 5;

  autoTable(doc, {
    startY: yPosition,
    head: [['Proveedor', 'Servicios', 'Ingresos']],
    body: data.topProveedores.slice(0, 5).map(item => [
      `${item.proveedor.user.firstName} ${item.proveedor.user.lastName}`,
      item.totalServicios.toString(),
      `$${item.ingresosTotales}`
    ]),
    theme: 'grid',
    headStyles: { 
      fillColor: [76, 175, 80],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    styles: {
      fontSize: 9,
      cellPadding: 4
    },
    alternateRowStyles: { fillColor: [245, 250, 245] }
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;
  checkNewPage(80);

  // CLIENTES ACTIVOS
  doc.setTextColor(123, 92, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('👤 Clientes Más Activos', 15, yPosition);
  yPosition += 5;

  autoTable(doc, {
    startY: yPosition,
    head: [['Cliente', 'Reservas', 'Gasto Total']],
    body: data.clientesActivos.slice(0, 5).map(item => [
      `${item.cliente.user.firstName} ${item.cliente.user.lastName}`,
      item.totalReservas.toString(),
      `$${item.gastoTotal}`
    ]),
    theme: 'grid',
    headStyles: { 
      fillColor: [33, 150, 243],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    styles: {
      fontSize: 9,
      cellPadding: 4
    },
    alternateRowStyles: { fillColor: [240, 248, 255] }
  });

  // PIE DE PÁGINA
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Guardar el PDF
  doc.save(`Reporte_Dashboard_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Generar PDF de Servicios Populares
export async function generateServiciosPopularesPDF(servicios: any[]) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // Encabezado
  doc.setFillColor(123, 92, 255);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('🏆 Servicios Más Populares', pageWidth / 2, 25, { align: 'center' });

  // Tabla
  autoTable(doc, {
    startY: 50,
    head: [['#', 'Servicio', 'Precio', 'Ventas', 'Ingresos']],
    body: servicios.map((item, idx) => [
      (idx + 1).toString(),
      item.servicio.nombreServicio,
      `$${item.servicio.precio}`,
      item.cantidadVendida.toString(),
      `$${item.ingresosGenerados}`
    ]),
    theme: 'grid',
    headStyles: { fillColor: [123, 92, 255], fontSize: 11, fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 5 },
    alternateRowStyles: { fillColor: [245, 245, 250] }
  });

  // Gráfico
  if (servicios.length > 0) {
    const yPos = (doc as any).lastAutoTable.finalY + 15;
    
    const chartData = {
      labels: servicios.slice(0, 8).map(s => s.servicio.nombreServicio),
      datasets: [{
        label: 'Ventas',
        data: servicios.slice(0, 8).map(s => s.cantidadVendida),
        backgroundColor: 'rgba(123, 92, 255, 0.7)',
        borderColor: 'rgb(123, 92, 255)',
        borderWidth: 2
      }]
    };

    const chartImage = await createChartImage('bar', chartData, {
      plugins: {
        title: { display: true, text: 'Ventas por Servicio', font: { size: 14 } },
        legend: { display: false }
      },
      scales: { y: { beginAtZero: true } }
    });

    doc.addImage(chartImage, 'PNG', 15, yPos, 180, 90);
  }

  doc.save(`Servicios_Populares_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Generar PDF de Top Proveedores
export async function generateTopProveedoresPDF(proveedores: any[]) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  doc.setFillColor(76, 175, 80);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('👥 Top Proveedores', pageWidth / 2, 25, { align: 'center' });

  autoTable(doc, {
    startY: 50,
    head: [['#', 'Proveedor', 'Servicios', 'Ingresos', 'Rating']],
    body: proveedores.map((item, idx) => [
      (idx + 1).toString(),
      `${item.proveedor.user.firstName} ${item.proveedor.user.lastName}`,
      item.totalServicios.toString(),
      `$${item.ingresosTotales}`,
      `${item.promedioCalificacion.toFixed(1)} ⭐`
    ]),
    theme: 'grid',
    headStyles: { fillColor: [76, 175, 80], fontSize: 11, fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 5 },
    alternateRowStyles: { fillColor: [240, 250, 240] }
  });

  if (proveedores.length > 0) {
    const yPos = (doc as any).lastAutoTable.finalY + 15;
    
    const chartData = {
      labels: proveedores.slice(0, 6).map(p => 
        `${p.proveedor.user.firstName} ${p.proveedor.user.lastName}`
      ),
      datasets: [{
        label: 'Ingresos',
        data: proveedores.slice(0, 6).map(p => parseFloat(p.ingresosTotales)),
        backgroundColor: [
          'rgba(76, 175, 80, 0.8)',
          'rgba(33, 150, 243, 0.8)',
          'rgba(255, 152, 0, 0.8)',
          'rgba(156, 39, 176, 0.8)',
          'rgba(244, 67, 54, 0.8)',
          'rgba(0, 188, 212, 0.8)'
        ]
      }]
    };

    const chartImage = await createChartImage('pie', chartData, {
      plugins: {
        title: { display: true, text: 'Distribución de Ingresos', font: { size: 14 } },
        legend: { position: 'right', labels: { boxWidth: 15, font: { size: 9 } } }
      }
    });

    doc.addImage(chartImage, 'PNG', 15, yPos, 180, 90);
  }

  doc.save(`Top_Proveedores_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Generar PDF de Clientes Activos
export async function generateClientesActivosPDF(clientes: any[]) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  doc.setFillColor(33, 150, 243);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('👤 Clientes Más Activos', pageWidth / 2, 25, { align: 'center' });

  autoTable(doc, {
    startY: 50,
    head: [['#', 'Cliente', 'Username', 'Reservas', 'Gasto Total']],
    body: clientes.map((item, idx) => [
      (idx + 1).toString(),
      `${item.cliente.user.firstName} ${item.cliente.user.lastName}`,
      `@${item.cliente.user.username}`,
      item.totalReservas.toString(),
      `$${item.gastoTotal}`
    ]),
    theme: 'grid',
    headStyles: { fillColor: [33, 150, 243], fontSize: 11, fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 5 },
    alternateRowStyles: { fillColor: [240, 248, 255] }
  });

  if (clientes.length > 0) {
    const yPos = (doc as any).lastAutoTable.finalY + 15;
    
    const chartData = {
      labels: clientes.slice(0, 8).map(c => 
        `${c.cliente.user.firstName} ${c.cliente.user.lastName}`
      ),
      datasets: [{
        label: 'Reservas',
        data: clientes.slice(0, 8).map(c => c.totalReservas),
        backgroundColor: 'rgba(33, 150, 243, 0.7)',
        borderColor: 'rgb(33, 150, 243)',
        borderWidth: 2
      }]
    };

    const chartImage = await createChartImage('bar', chartData, {
      plugins: {
        title: { display: true, text: 'Reservas por Cliente', font: { size: 14 } },
        legend: { display: false }
      },
      scales: { 
        y: { beginAtZero: true, ticks: { stepSize: 1 } },
        x: { ticks: { maxRotation: 45, minRotation: 45, font: { size: 8 } } }
      }
    });

    doc.addImage(chartImage, 'PNG', 15, yPos, 180, 90);
  }

  doc.save(`Clientes_Activos_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Generar PDF de Reporte de Ventas
export async function generateReporteVentasPDF(reporte: any) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  doc.setFillColor(255, 152, 0);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('📊 Reporte de Ventas', pageWidth / 2, 25, { align: 'center' });

  let yPos = 50;

  // Resumen de métricas
  doc.setFillColor(240, 240, 255);
  doc.roundedRect(15, yPos, 55, 25, 3, 3, 'F');
  doc.roundedRect(75, yPos, 55, 25, 3, 3, 'F');
  doc.roundedRect(135, yPos, 55, 25, 3, 3, 'F');

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  doc.text('Período', 42.5, yPos + 8, { align: 'center' });
  doc.text('Total Ventas', 102.5, yPos + 8, { align: 'center' });
  doc.text('Cant. Reservas', 162.5, yPos + 8, { align: 'center' });

  doc.setTextColor(255, 152, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(reporte.periodo, 42.5, yPos + 18, { align: 'center' });
  doc.text(`$${reporte.totalVentas}`, 102.5, yPos + 18, { align: 'center' });
  doc.text(reporte.cantidadReservas.toString(), 162.5, yPos + 18, { align: 'center' });

  yPos += 35;

  // Tabla de servicios más vendidos
  doc.setTextColor(255, 152, 0);
  doc.setFontSize(14);
  doc.text('🏆 Servicios Más Vendidos', 15, yPos);
  yPos += 5;

  autoTable(doc, {
    startY: yPos,
    head: [['Servicio', 'Precio', 'Cant. Vendida', 'Ingresos']],
    body: reporte.serviciosMasVendidos.map((item: any) => [
      item.servicio.nombreServicio,
      `$${item.servicio.precio}`,
      item.cantidadVendida.toString(),
      `$${item.ingresosGenerados}`
    ]),
    theme: 'grid',
    headStyles: { fillColor: [255, 152, 0], fontSize: 11, fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 5 },
    alternateRowStyles: { fillColor: [255, 248, 240] }
  });

  // Gráfico
  if (reporte.serviciosMasVendidos.length > 0) {
    yPos = (doc as any).lastAutoTable.finalY + 15;
    
    const chartData = {
      labels: reporte.serviciosMasVendidos.slice(0, 8).map((s: any) => s.servicio.nombreServicio),
      datasets: [{
        label: 'Ingresos Generados',
        data: reporte.serviciosMasVendidos.slice(0, 8).map((s: any) => parseFloat(s.ingresosGenerados)),
        backgroundColor: 'rgba(255, 152, 0, 0.7)',
        borderColor: 'rgb(255, 152, 0)',
        borderWidth: 2
      }]
    };

    const chartImage = await createChartImage('bar', chartData, {
      plugins: {
        title: { display: true, text: 'Ingresos por Servicio', font: { size: 14 } },
        legend: { display: false }
      },
      scales: { 
        y: { 
          beginAtZero: true,
          ticks: {
            callback: function(value: any) {
              return '$' + value;
            }
          }
        }
      }
    });

    doc.addImage(chartImage, 'PNG', 15, yPos, 180, 90);
  }

  doc.save(`Reporte_Ventas_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Generar PDF de Reporte de Satisfacción
export async function generateReporteSatisfaccionPDF(satisfaccion: any[]) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  doc.setFillColor(255, 193, 7);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('⭐ Reporte de Satisfacción', pageWidth / 2, 25, { align: 'center' });

  let yPos = 50;

  // Tabla de satisfacción por servicio
  autoTable(doc, {
    startY: yPos,
    head: [['Servicio', 'Promedio', 'Total Calificaciones', 'Distribución']],
    body: satisfaccion.map((item: any) => [
      item.servicio.nombreServicio,
      `${item.promedioCalificacion.toFixed(1)} ⭐`,
      item.totalCalificaciones.toString(),
      item.distribucionCalificaciones.map((d: any) => 
        `${d.puntuacion}⭐: ${d.cantidad}`
      ).join(', ')
    ]),
    theme: 'grid',
    headStyles: { fillColor: [255, 193, 7], fontSize: 11, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 5 },
    alternateRowStyles: { fillColor: [255, 252, 240] },
    columnStyles: {
      3: { cellWidth: 60 }
    }
  });

  // Gráfico
  if (satisfaccion.length > 0) {
    yPos = (doc as any).lastAutoTable.finalY + 15;
    
    const chartData = {
      labels: satisfaccion.slice(0, 8).map((s: any) => s.servicio.nombreServicio),
      datasets: [{
        label: 'Calificación Promedio',
        data: satisfaccion.slice(0, 8).map((s: any) => s.promedioCalificacion),
        backgroundColor: 'rgba(255, 193, 7, 0.7)',
        borderColor: 'rgb(255, 193, 7)',
        borderWidth: 2
      }]
    };

    const chartImage = await createChartImage('bar', chartData, {
      plugins: {
        title: { display: true, text: 'Calificaciones por Servicio', font: { size: 14 } },
        legend: { display: false }
      },
      scales: { 
        y: { 
          beginAtZero: true,
          max: 5,
          ticks: { stepSize: 0.5 }
        }
      }
    });

    doc.addImage(chartImage, 'PNG', 15, yPos, 180, 90);
  }

  doc.save(`Reporte_Satisfaccion_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Generar PDF de Reporte de Proveedores
export async function generateReporteProveedoresPDF(proveedores: any[]) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  doc.setFillColor(156, 39, 176);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('👥 Reporte de Proveedores', pageWidth / 2, 25, { align: 'center' });

  autoTable(doc, {
    startY: 50,
    head: [['Proveedor', 'Email', 'Total Servicios', 'Activos', 'Rating', 'Ingresos']],
    body: proveedores.map((item: any) => [
      `${item.proveedor.user.firstName} ${item.proveedor.user.lastName}`,
      item.proveedor.user.email,
      item.totalServicios.toString(),
      item.serviciosActivos.toString(),
      `${item.promedioCalificacion.toFixed(1)} ⭐`,
      `$${item.ingresosTotales}`
    ]),
    theme: 'grid',
    headStyles: { fillColor: [156, 39, 176], fontSize: 10, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 4 },
    alternateRowStyles: { fillColor: [248, 245, 250] }
  });

  if (proveedores.length > 0) {
    const yPos = (doc as any).lastAutoTable.finalY + 15;
    
    const chartData = {
      labels: proveedores.slice(0, 6).map((p: any) => 
        `${p.proveedor.user.firstName} ${p.proveedor.user.lastName}`
      ),
      datasets: [{
        label: 'Ingresos',
        data: proveedores.slice(0, 6).map((p: any) => parseFloat(p.ingresosTotales)),
        backgroundColor: [
          'rgba(156, 39, 176, 0.8)',
          'rgba(103, 58, 183, 0.8)',
          'rgba(63, 81, 181, 0.8)',
          'rgba(33, 150, 243, 0.8)',
          'rgba(0, 188, 212, 0.8)',
          'rgba(0, 150, 136, 0.8)'
        ]
      }]
    };

    const chartImage = await createChartImage('pie', chartData, {
      plugins: {
        title: { display: true, text: 'Distribución de Ingresos por Proveedor', font: { size: 14 } },
        legend: { position: 'right', labels: { boxWidth: 15, font: { size: 8 } } }
      }
    });

    doc.addImage(chartImage, 'PNG', 15, yPos, 180, 90);
  }

  doc.save(`Reporte_Proveedores_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Generar PDF de Reporte de Clientes
export async function generateReporteClientesPDF(clientes: any[]) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  doc.setFillColor(0, 150, 136);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('👤 Reporte de Clientes', pageWidth / 2, 25, { align: 'center' });

  autoTable(doc, {
    startY: 50,
    head: [['Cliente', 'Email', 'Username', 'Reservas', 'Gasto Total', 'Promedio/Reserva']],
    body: clientes.map((item: any) => [
      `${item.cliente.user.firstName} ${item.cliente.user.lastName}`,
      item.cliente.user.email,
      `@${item.cliente.user.username}`,
      item.totalReservas.toString(),
      `$${item.gastoTotal}`,
      `$${item.promedioPorReserva}`
    ]),
    theme: 'grid',
    headStyles: { fillColor: [0, 150, 136], fontSize: 10, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 4 },
    alternateRowStyles: { fillColor: [240, 248, 245] }
  });

  if (clientes.length > 0) {
    const yPos = (doc as any).lastAutoTable.finalY + 15;
    
    const chartData = {
      labels: clientes.slice(0, 8).map((c: any) => 
        `${c.cliente.user.firstName} ${c.cliente.user.lastName}`
      ),
      datasets: [
        {
          label: 'Gasto Total',
          data: clientes.slice(0, 8).map((c: any) => parseFloat(c.gastoTotal)),
          backgroundColor: 'rgba(0, 150, 136, 0.7)',
          borderColor: 'rgb(0, 150, 136)',
          borderWidth: 2,
          yAxisID: 'y'
        },
        {
          label: 'Reservas',
          data: clientes.slice(0, 8).map((c: any) => c.totalReservas),
          backgroundColor: 'rgba(76, 175, 80, 0.7)',
          borderColor: 'rgb(76, 175, 80)',
          borderWidth: 2,
          yAxisID: 'y1'
        }
      ]
    };

    const chartImage = await createChartImage('bar', chartData, {
      plugins: {
        title: { display: true, text: 'Gasto Total y Reservas por Cliente', font: { size: 14 } },
        legend: { display: true, position: 'top' }
      },
      scales: { 
        y: { 
          beginAtZero: true,
          position: 'left',
          title: { display: true, text: 'Gasto ($)' }
        },
        y1: {
          beginAtZero: true,
          position: 'right',
          title: { display: true, text: 'Reservas' },
          grid: { drawOnChartArea: false }
        },
        x: { ticks: { maxRotation: 45, minRotation: 45, font: { size: 8 } } }
      }
    });

    doc.addImage(chartImage, 'PNG', 15, yPos, 180, 90);
  }

  doc.save(`Reporte_Clientes_${new Date().toISOString().split('T')[0]}.pdf`);
}
