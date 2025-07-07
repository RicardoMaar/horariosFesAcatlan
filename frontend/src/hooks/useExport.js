import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import useHorariosStore from '../store/useHorariosStore';

export function useExport() {
  const materiasSeleccionadas = useHorariosStore(state => state.materiasSeleccionadas);
  const carreraSeleccionada = useHorariosStore(state => state.carreraSeleccionada);

  // Función para encontrar el elemento del calendario
  const findCalendarElement = () => {
    // Buscar específicamente el grid del calendario de escritorio
    const calendarGrid = document.querySelector('.grid.grid-cols-\\[5rem\\,repeat\\(6\\,1fr\\)\\]');
    if (calendarGrid) {
      console.log('Calendario encontrado - grid desktop');
      return calendarGrid.parentElement; // Obtener el contenedor completo
    }

    // Fallback: buscar cualquier grid
    const anyGrid = document.querySelector('.grid');
    if (anyGrid && anyGrid.textContent.includes('Lunes')) {
      console.log('Calendario encontrado - fallback grid');
      return anyGrid.parentElement;
    }

    return null;
  };

  const createDesktopClone = (originalElement) => {
    // Crear un contenedor temporal para la captura
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    container.style.width = '1200px';
    container.style.height = 'auto';
    container.style.backgroundColor = '#ffffff';
    container.style.padding = '20px';
    container.style.fontFamily = 'system-ui, -apple-system, sans-serif';

    // Crear estructura del calendario para escritorio
    const calendarHTML = `
      <div style="width: 100%; min-width: 600px;">
        <!-- Header con título -->
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="font-size: 24px; font-weight: bold; color: #1f2937; margin: 0;">
            Horario FES Acatlán
          </h1>
          <p style="font-size: 14px; color: #6b7280; margin: 5px 0 0 0;">
            ${carreraSeleccionada || 'Horario'} - ${new Date().toLocaleDateString('es-MX')}
          </p>
        </div>

        <!-- Header con días -->
        <div style="display: grid; grid-template-columns: 80px repeat(6, 1fr); gap: 1px; background-color: #e5e7eb; margin-bottom: 1px;">
          <div style="background-color: #f9fafb; padding: 8px;"></div>
          <div style="background-color: #f9fafb; padding: 8px; text-align: center; font-weight: 500; font-size: 14px;">Lunes</div>
          <div style="background-color: #f9fafb; padding: 8px; text-align: center; font-weight: 500; font-size: 14px;">Martes</div>
          <div style="background-color: #f9fafb; padding: 8px; text-align: center; font-weight: 500; font-size: 14px;">Miércoles</div>
          <div style="background-color: #f9fafb; padding: 8px; text-align: center; font-weight: 500; font-size: 14px;">Jueves</div>
          <div style="background-color: #f9fafb; padding: 8px; text-align: center; font-weight: 500; font-size: 14px;">Viernes</div>
          <div style="background-color: #f9fafb; padding: 8px; text-align: center; font-weight: 500; font-size: 14px;">Sábado</div>
        </div>

        <!-- Grid del calendario -->
        <div style="position: relative;">
          <div style="display: grid; grid-template-columns: 80px repeat(6, 1fr); gap: 1px; background-color: #e5e7eb;">
            <!-- Columna de horas -->
            <div>
              ${generateHoursColumn()}
            </div>
            <!-- Columnas de días -->
            ${generateDaysColumns()}
          </div>
        </div>
      </div>
    `;

    container.innerHTML = calendarHTML;
    return container;
  };

  const generateHoursColumn = () => {
    const hours = [];
    for (let h = 7; h < 23; h++) {
      hours.push(`${h.toString().padStart(2, '0')}:00`);
      hours.push(`${h.toString().padStart(2, '0')}:30`);
    }

    return hours.map((hora, index) => `
      <div style="
        background-color: #f9fafb; 
        height: 18.2px; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        font-size: 12px; 
        color: #6b7280;
        border-top: 1px solid ${index % 2 === 0 ? '#e5e7eb' : '#f3f4f6'};
      ">
        ${index % 2 === 0 ? hora : ''}
      </div>
    `).join('');
  };

  const generateDaysColumns = () => {
    const DIAS = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA'];
    const diasMapeados = {
      'LU': 'Lunes',
      'MA': 'Martes', 
      'MI': 'Miércoles',
      'JU': 'Jueves',
      'VI': 'Viernes',
      'SA': 'Sábado'
    };

    return DIAS.map(dia => {
      const nombreDia = diasMapeados[dia];
      const hoursSlots = [];
      
      // Generar slots de horas
      for (let h = 7; h < 23; h++) {
        hoursSlots.push(`${h.toString().padStart(2, '0')}:00`);
        hoursSlots.push(`${h.toString().padStart(2, '0')}:30`);
      }

      // Obtener materias para este día
      const materiasDelDia = materiasSeleccionadas.filter(materia =>
        materia.horarios.some(horario => horario.dia === dia)
      );

      const slotsHTML = hoursSlots.map((_, index) => `
        <div style="
          border-top: 1px solid ${index % 2 === 0 ? '#e5e7eb' : '#f3f4f6'};
          background-color: #ffffff;
          height: 18.2px;
        "></div>
      `).join('');

      const materiasHTML = materiasDelDia.map(materia => {
        const horarioDelDia = materia.horarios.find(h => h.dia === dia);
        if (!horarioDelDia) return '';

        const [horaInicio, minInicio] = horarioDelDia.inicio.split(':').map(Number);
        const [horaFin, minFin] = horarioDelDia.fin.split(':').map(Number);
        
        const minutosInicio = (horaInicio - 7) * 60 + minInicio;
        const minutosFin = (horaFin - 7) * 60 + minFin;
        
        const top = (minutosInicio / 30) * 18.2;
        const height = ((minutosFin - minutosInicio) / 30) * 18.2 - 2;

        // Obtener color de la materia
        const coloresAsignados = useHorariosStore.getState().coloresAsignados;
        const color = coloresAsignados[materia.id] || '#3b82f6';

        return `
          <div style="
            position: absolute;
            top: ${top}px;
            height: ${height}px;
            left: 2px;
            right: 2px;
            background-color: ${color};
            border-radius: 4px;
            padding: 4px;
            color: white;
            font-size: 11px;
            overflow: hidden;
            z-index: 10;
          ">
            <div style="font-weight: 600; line-height: 1.2; margin-bottom: 1px;">
              ${materia.nombre}
            </div>
            <div style="opacity: 0.9; line-height: 1.2;">
              ${materia.grupo}
            </div>
            ${height > 50 ? `
              <div style="opacity: 0.8; font-size: 10px; line-height: 1.2; margin-top: 1px;">
                ${materia.profesor || ''}
              </div>
            ` : ''}
          </div>
        `;
      }).join('');

      return `
        <div style="position: relative; background-color: #ffffff;">
          ${slotsHTML}
          ${materiasHTML}
        </div>
      `;
    }).join('');
  };

  const exportToPNG = async () => {
    try {
      console.log('Iniciando exportación PNG...');
      
      if (!materiasSeleccionadas || materiasSeleccionadas.length === 0) {
        throw new Error('No hay materias seleccionadas para exportar');
      }

      // Crear clon optimizado para captura
      const clonedElement = createDesktopClone();
      document.body.appendChild(clonedElement);

      try {
        const canvas = await html2canvas(clonedElement, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true,
          width: 1200,
          height: clonedElement.scrollHeight,
          windowWidth: 1200,
          windowHeight: 800
        });

        console.log('Canvas creado:', canvas.width, 'x', canvas.height);

        // Convertir a blob y descargar
        canvas.toBlob((blob) => {
          if (!blob) {
            throw new Error('Error al crear la imagen');
          }
          
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `horario_${carreraSeleccionada || 'schedule'}_${new Date().toISOString().split('T')[0]}.png`;
          link.href = url;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 'image/png');

      } finally {
        document.body.removeChild(clonedElement);
      }

    } catch (error) {
      console.error('Error en exportToPNG:', error);
      throw error;
    }
  };

  const exportToPDF = async () => {
    try {
      console.log('Iniciando exportación PDF...');
      
      if (!materiasSeleccionadas || materiasSeleccionadas.length === 0) {
        throw new Error('No hay materias seleccionadas para exportar');
      }

      // Crear clon optimizado para captura
      const clonedElement = createDesktopClone();
      document.body.appendChild(clonedElement);

      try {
        const canvas = await html2canvas(clonedElement, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true,
          width: 1200,
          height: clonedElement.scrollHeight,
          windowWidth: 1200,
          windowHeight: 800
        });

        console.log('Canvas creado para PDF:', canvas.width, 'x', canvas.height);

        // Crear PDF
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        // Calcular dimensiones para que quepa bien en la página
        const aspectRatio = canvas.width / canvas.height;
        let imgWidth = pdfWidth - 20; // 10mm de margen a cada lado
        let imgHeight = imgWidth / aspectRatio;

        // Si la altura es muy grande, ajustar por altura
        if (imgHeight > pdfHeight - 30) {
          imgHeight = pdfHeight - 30; // 15mm de margen arriba y abajo
          imgWidth = imgHeight * aspectRatio;
        }

        const imgX = (pdfWidth - imgWidth) / 2;
        const imgY = (pdfHeight - imgHeight) / 2;

        pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth, imgHeight);
        pdf.save(`horario_${carreraSeleccionada || 'schedule'}_${new Date().toISOString().split('T')[0]}.pdf`);

      } finally {
        document.body.removeChild(clonedElement);
      }

    } catch (error) {
      console.error('Error en exportToPDF:', error);
      throw error;
    }
  };

  const exportToExcel = async () => {
    if (!materiasSeleccionadas || materiasSeleccionadas.length === 0) {
      throw new Error('No hay materias seleccionadas para exportar');
    }

    // Crear datos para Excel
    const excelData = materiasSeleccionadas.map(materia => ({
      'Nombre de la Materia': materia.nombre,
      'Clave': materia.clave,
      'Grupo': materia.grupo,
      'Semestre': materia.semestre,
      'Profesor': materia.profesor,
      'Horario': materia.horarios?.map(h => `${h.dia} ${h.inicio}-${h.fin}`).join(', ') || 'No especificado',
      'Créditos': materia.creditos || 'N/A'
    }));

    // Crear workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Ajustar ancho de columnas
    const colWidths = [
      { wch: 30 }, // Nombre de la Materia
      { wch: 15 }, // Clave
      { wch: 10 }, // Grupo
      { wch: 10 }, // Semestre
      { wch: 25 }, // Profesor
      { wch: 30 }, // Horario
      { wch: 10 }  // Créditos
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Horario');
    XLSX.writeFile(wb, `horario_${carreraSeleccionada || 'schedule'}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToGoogleCalendar = () => {
    try {
      console.log('Iniciando exportación a Calendar...');

      if (!materiasSeleccionadas || materiasSeleccionadas.length === 0) {
        throw new Error('No hay materias seleccionadas para exportar');
      }

      // Crear eventos ICS para Google Calendar
      let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//FES Acatlán//Horarios//ES',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH'
      ];

      materiasSeleccionadas.forEach(materia => {
        if (materia.horarios && materia.horarios.length > 0) {
          materia.horarios.forEach(horario => {
            const eventId = `${materia.clave}-${horario.dia}-${Date.now()}`;
            
            // Fecha de inicio del semestre
            const now = new Date();
            const startDate = new Date(now.getFullYear(), 1, 1); // 1 de febrero
            
            icsContent.push(
              'BEGIN:VEVENT',
              `UID:${eventId}@fesacatlan.horarios`,
              `DTSTART:${formatDateForICS(startDate, horario.inicio, horario.dia)}`,
              `DTEND:${formatDateForICS(startDate, horario.fin, horario.dia)}`,
              `SUMMARY:${materia.nombre} - Grupo ${materia.grupo}`,
              `DESCRIPTION:Profesor: ${materia.profesor || 'No especificado'}\\nClave: ${materia.clave}\\nSemestre: ${materia.semestre || 'N/A'}`,
              `RRULE:FREQ=WEEKLY;BYDAY=${getDayCode(horario.dia)};COUNT=16`,
              'END:VEVENT'
            );
          });
        }
      });

      icsContent.push('END:VCALENDAR');

      // Crear y descargar archivo ICS
      const blob = new Blob([icsContent.join('\r\n')], { 
        type: 'text/calendar;charset=utf-8' 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `horario_${carreraSeleccionada || 'schedule'}_${new Date().toISOString().split('T')[0]}.ics`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error en exportToGoogleCalendar:', error);
      throw error;
    }
  };

  // Funciones auxiliares
  const formatDateForICS = (startDate, time, dayName) => {
    const [hours, minutes] = time.split(':').map(Number);
    const targetDate = getNextWeekday(startDate, dayName);
    targetDate.setHours(hours, minutes, 0, 0);
    
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    const hour = String(targetDate.getHours()).padStart(2, '0');
    const minute = String(targetDate.getMinutes()).padStart(2, '0');
    
    return `${year}${month}${day}T${hour}${minute}00`;
  };

  const getNextWeekday = (startDate, dayName) => {
    const days = {
      'LU': 1, 'MA': 2, 'MI': 3, 'JU': 4, 'VI': 5, 'SA': 6
    };
    
    const targetDay = days[dayName];
    const currentDay = startDate.getDay();
    const daysToAdd = ((targetDay - currentDay) + 7) % 7;
    
    const result = new Date(startDate);
    result.setDate(startDate.getDate() + daysToAdd);
    return result;
  };

  const getDayCode = (dia) => {
    const dias = {
      'LU': 'MO', 'MA': 'TU', 'MI': 'WE', 'JU': 'TH', 'VI': 'FR', 'SA': 'SA'
    };
    return dias[dia] || 'MO';
  };

  return {
    exportToPNG,
    exportToPDF,
    exportToExcel,
    exportToGoogleCalendar
  };
}