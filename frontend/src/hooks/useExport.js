import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import useHorariosStore from '../store/useHorariosStore';

export function useExport() {
  const materiasSeleccionadas = useHorariosStore(state => state.materiasSeleccionadas);
  const carreraSeleccionada = useHorariosStore(state => state.carreraSeleccionada);

  // Función para detectar traslapes entre materias
  const detectarTraslapes = () => {
    const traslapes = [];
    
    for (let i = 0; i < materiasSeleccionadas.length; i++) {
      for (let j = i + 1; j < materiasSeleccionadas.length; j++) {
        const materia1 = materiasSeleccionadas[i];
        const materia2 = materiasSeleccionadas[j];
        
        // Verificar si hay traslape entre los horarios de estas dos materias
        if (hayTraslapeEntreHorarios(materia1.horarios, materia2.horarios)) {
          traslapes.push({
            materia1: materia1.nombre,
            materia2: materia2.nombre,
            grupo1: materia1.grupo,
            grupo2: materia2.grupo
          });
        }
      }
    }
    
    return traslapes;
  };

  // Función auxiliar para verificar traslape entre horarios
  const hayTraslapeEntreHorarios = (horarios1, horarios2) => {
    if (!horarios1 || !horarios2) return false;
    
    for (const h1 of horarios1) {
      for (const h2 of horarios2) {
        if (h1.dia === h2.dia) {
          // Convertir horas a minutos para comparar
          const inicio1 = horaAMinutos(h1.inicio);
          const fin1 = horaAMinutos(h1.fin);
          const inicio2 = horaAMinutos(h2.inicio);
          const fin2 = horaAMinutos(h2.fin);
          
          // Verificar traslape: dos intervalos se traslapan si uno empieza antes de que termine el otro
          if (inicio1 < fin2 && inicio2 < fin1) {
            return true;
          }
        }
      }
    }
    
    return false;
  };

  // Función auxiliar para convertir hora a minutos
  const horaAMinutos = (hora) => {
    const [horas, minutos] = hora.split(':').map(Number);
    return horas * 60 + minutos;
  };

  // Función para validar antes de exportar
  const validarAntesDeExportar = () => {
    if (!materiasSeleccionadas || materiasSeleccionadas.length === 0) {
      throw new Error('No hay materias seleccionadas para exportar');
    }

    const traslapes = detectarTraslapes();
    if (traslapes.length > 0) {
      const mensajeTraslapes = traslapes.map(t => 
        `• ${t.materia1} (${t.grupo1}) con ${t.materia2} (${t.grupo2})`
      ).join('\n');
      
      throw new Error(`No se puede exportar debido a traslapes de horarios:\n\n${mensajeTraslapes}\n\nPor favor, ajusta tu selección de materias antes de exportar.`);
    }
  };

  const createDesktopClone = () => {
    // Calcular altura total necesaria
    const hoursCount = (23 - 7) * 2; // 16 horas * 2 slots por hora = 32 slots
    const totalCalendarHeight = hoursCount * 18.2; // 32 * 18.2px = 582.4px
    const headerHeight = 100; // header + días
    const totalHeight = headerHeight + totalCalendarHeight + 40; // +40 para padding

    // Crear un contenedor temporal para la captura
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    container.style.width = '1200px';
    container.style.height = `${totalHeight}px`;
    container.style.backgroundColor = '#ffffff';
    container.style.padding = '20px';
    container.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    container.style.boxSizing = 'border-box';

    // Crear estructura del calendario para escritorio
    const calendarHTML = `
      <div style="width: 100%; min-width: 600px; height: auto;">
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
        <div style="display: grid; grid-template-columns: 120px repeat(6, 1fr); gap: 1px; background-color: #e5e7eb; margin-bottom: 1px;">
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
          <div style="display: grid; grid-template-columns: 120px repeat(6, 1fr); gap: 1px; background-color: #e5e7eb;">
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
    // Generar horas de 7:00 a 22:30 (cada hora completa)
    for (let h = 7; h <= 22; h++) {
      hours.push(`${h.toString().padStart(2, '0')}:00`);
    }

    return hours.map((hora, index) => `
      <div style="
        background-color: #f9fafb; 
        height: 36.4px; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        font-size: 12px; 
        color: #6b7280;
        border-top: 1px solid #e5e7eb;
        border-right: 1px solid #e5e7eb;
        padding: 0 8px;
        min-width: 120px;
        box-sizing: border-box;
      ">
        ${hora}
      </div>
    `).join('');
  };

  const generateDaysColumns = () => {
    const DIAS = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA'];
    const coloresAsignados = useHorariosStore.getState().coloresAsignados;

    return DIAS.map(dia => {
      const hoursSlots = [];
      
      // Generar slots de horas (cada hora completa)
      for (let h = 7; h <= 22; h++) {
        hoursSlots.push(`${h.toString().padStart(2, '0')}:00`);
      }

      // Obtener materias para este día
      const materiasDelDia = materiasSeleccionadas.filter(materia =>
        materia.horarios && materia.horarios.some(horario => horario.dia === dia)
      );

      const slotsHTML = hoursSlots.map((_, index) => `
        <div style="
          border-top: 1px solid #e5e7eb;
          border-right: 1px solid #e5e7eb;
          background-color: #ffffff;
          height: 36.4px;
        "></div>
      `).join('');

      const materiasHTML = materiasDelDia.map((materia, materiaIndex) => {
        const horarioDelDia = materia.horarios.find(h => h.dia === dia);
        if (!horarioDelDia) return '';

        // Parsear horas
        const [horaInicio, minInicio] = horarioDelDia.inicio.split(':').map(Number);
        const [horaFin, minFin] = horarioDelDia.fin.split(':').map(Number);
        
        // Calcular posición en minutos desde las 7:00
        const minutosInicio = (horaInicio - 7) * 60 + minInicio;
        const minutosFin = (horaFin - 7) * 60 + minFin;
        
        // Convertir a posición en pixels (cada hora = 36.4px)
        const top = (minutosInicio / 60) * 36.4;
        const height = ((minutosFin - minutosInicio) / 60) * 36.4 - 2; // -2px para separación

        // Obtener color de la materia
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
            padding: 6px;
            color: white;
            font-size: 11px;
            overflow: hidden;
            z-index: 10;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: center;
          ">
            <div style="font-weight: 600; line-height: 1.2; margin-bottom: 2px; text-align: center;">
              ${materia.nombre}
            </div>
            <div style="opacity: 0.9; line-height: 1.2; text-align: center; font-size: 10px;">
              ${materia.grupo}
            </div>
            ${height > 60 ? `
              <div style="opacity: 0.8; font-size: 9px; line-height: 1.2; margin-top: 2px; text-align: center;">
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
      
      validarAntesDeExportar();

      // Crear clon optimizado para captura
      const clonedElement = createDesktopClone();
      document.body.appendChild(clonedElement);

      try {
        // Esperar un momento para que el DOM se renderice
        await new Promise(resolve => setTimeout(resolve, 200));

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
      
      validarAntesDeExportar();

      // Crear clon optimizado para captura
      const clonedElement = createDesktopClone();
      document.body.appendChild(clonedElement);

      try {
        // Esperar un momento para que el DOM se renderice
        await new Promise(resolve => setTimeout(resolve, 200));

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
    try {
      validarAntesDeExportar();

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
    } catch (error) {
      console.error('Error en exportToExcel:', error);
      throw error;
    }
  };

  const exportToGoogleCalendar = () => {
    try {
      console.log('Iniciando exportación a Calendar...');

      validarAntesDeExportar();

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