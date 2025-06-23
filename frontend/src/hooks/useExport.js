import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import useHorariosStore from '../store/useHorariosStore';

export function useExport() {
  // const materiasSeleccionadas = useHorariosStore(state => state.materiasSeleccionadas);
  const carreraSeleccionada = useHorariosStore(state => state.carreraSeleccionada);

  const exportToPNG = async () => {
    // Buscar el elemento del calendario - ajustado para la nueva estructura
    const calendarioElement = document.querySelector('.overflow-x-auto')?.firstChild;
    
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
    const calendarioElement = document.querySelector('.overflow-x-auto')?.firstChild;
    
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
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight) * 0.9; // 90% para márgenes
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 15;

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


  return {
    exportToPNG,
    exportToPDF,
  };
}