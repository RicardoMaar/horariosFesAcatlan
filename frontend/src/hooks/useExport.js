import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import useHorariosStore from '../store/useHorariosStore';

export function useExport() {
  const materiasSeleccionadas = useHorariosStore(state => state.materiasSeleccionadas);
  const carreraSeleccionada = useHorariosStore(state => state.carreraSeleccionada);

  const exportToPNG = async () => {
    // Buscar el elemento del calendario
    const calendarioElement = document.querySelector('.calendar-grid')?.parentElement?.parentElement;
    
    if (!calendarioElement) {
      throw new Error('No se encontró el calendario');
    }

    // Crear clon temporal para captura
    const clone = calendarioElement.cloneNode(true);
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.width = '1200px';
    document.body.appendChild(clone);

    try {
      const canvas = await html2canvas(clone, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true
      });

      // Convertir a blob y descargar
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `horario_${carreraSeleccionada}_${new Date().toISOString().split('T')[0]}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      });
    } finally {
      document.body.removeChild(clone);
    }
  };

  const exportToPDF = async () => {
    const calendarioElement = document.querySelector('.calendar-grid')?.parentElement?.parentElement;
    
    if (!calendarioElement) {
      throw new Error('No se encontró el calendario');
    }

    // Crear clon temporal
    const clone = calendarioElement.cloneNode(true);
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.width = '1200px';
    document.body.appendChild(clone);

    try {
      const canvas = await html2canvas(clone, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true
      });

      // Crear PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      // Agregar título
      pdf.setFontSize(16);
      pdf.text('Horario FES Acatlán', pdfWidth / 2, 5, { align: 'center' });
      
      // Agregar fecha
      pdf.setFontSize(10);
      pdf.text(new Date().toLocaleDateString('es-MX'), pdfWidth - 10, 5, { align: 'right' });

      pdf.save(`horario_${carreraSeleccionada}_${new Date().toISOString().split('T')[0]}.pdf`);
    } finally {
      document.body.removeChild(clone);
    }
  };

  const exportToExcel = () => {
    // Crear datos para Excel
    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    const horasDelDia = [];
    
    // Generar horas de 7:00 a 22:00
    for (let h = 7; h < 22; h++) {
      horasDelDia.push(`${h.toString().padStart(2, '0')}:00`);
      horasDelDia.push(`${h.toString().padStart(2, '0')}:30`);
    }

    // Crear matriz de horario
    const horarioMatrix = [['Hora', ...diasSemana]];
    
    horasDelDia.forEach(hora => {
      const fila = [hora];
      diasSemana.forEach(dia => {
        fila.push(''); // Celda vacía por defecto
      });
      horarioMatrix.push(fila);
    });

    // Llenar con materias seleccionadas
    materiasSeleccionadas.forEach(materia => {
      materia.horarios.forEach(horario => {
        const diaIndex = ['LU', 'MA', 'MI', 'JU', 'VI'].indexOf(horario.dia) + 1;
        if (diaIndex > 0) {
          const horaInicio = horario.inicio;
          const horaFin = horario.fin;
          
          // Encontrar índices de filas
          const filaInicio = horasDelDia.indexOf(horaInicio) + 1;
          const filaFin = horasDelDia.indexOf(horaFin) + 1;
          
          if (filaInicio > 0) {
            // Poner información en la primera celda
            horarioMatrix[filaInicio][diaIndex] = `${materia.nombre}\n${materia.grupo}\n${materia.profesor}\n${materia.salon}`;
            
            // Marcar celdas ocupadas
            for (let i = filaInicio + 1; i < filaFin && i < horarioMatrix.length; i++) {
              horarioMatrix[i][diaIndex] = '↑';
            }
          }
        }
      });
    });

    // Crear libro de Excel
    const ws = XLSX.utils.aoa_to_sheet(horarioMatrix);
    
    // Ajustar anchos de columna
    ws['!cols'] = [
      { wch: 10 }, // Hora
      { wch: 30 }, // Lunes
      { wch: 30 }, // Martes
      { wch: 30 }, // Miércoles
      { wch: 30 }, // Jueves
      { wch: 30 }, // Viernes
    ];

    // Crear libro y agregar hoja
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Horario');

    // Agregar hoja con detalles de materias
    const detallesData = [['Materia', 'Grupo', 'Profesor', 'Salón', 'Horario']];
    materiasSeleccionadas.forEach(materia => {
      const horarios = materia.horarios.map(h => `${h.dia_nombre} ${h.inicio}-${h.fin}`).join(', ');
      detallesData.push([
        materia.nombre,
        materia.grupo,
        materia.profesor,
        materia.salon,
        horarios
      ]);
    });
    
    const wsDetalles = XLSX.utils.aoa_to_sheet(detallesData);
    XLSX.utils.book_append_sheet(wb, wsDetalles, 'Detalles');

    // Descargar archivo
    XLSX.writeFile(wb, `horario_${carreraSeleccionada}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return {
    exportToPNG,
    exportToPDF,
    exportToExcel
  };
}