import { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { useExport } from '../hooks/useExport';
import toast from 'react-hot-toast';

function ExportMenu() {
  const [open, setOpen] = useState(false);
  const { exportToPNG, exportToPDF, exportToExcel } = useExport();

  const handleExport = async (format) => {
    try {
      setOpen(false);
      
      const loadingToast = toast.loading(`Exportando a ${format}...`);
      
      switch (format) {
        case 'PNG':
          await exportToPNG();
          break;
        case 'PDF':
          await exportToPDF();
          break;
        case 'Excel':
          await exportToExcel();
          break;
      }
      
      toast.dismiss(loadingToast);
      toast.success(`Horario exportado como ${format}`);
    } catch (error) {
      toast.error(`Error al exportar: ${error.message}`);
    }
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Exportar
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content className="bg-white rounded-lg shadow-lg border border-gray-200 p-1 w-48 animate-slide-up">
          <div className="py-1">
            <button
              onClick={() => handleExport('PNG')}
              className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 flex items-center gap-3"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Imagen PNG
            </button>
            
            <button
              onClick={() => handleExport('PDF')}
              className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 flex items-center gap-3"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Documento PDF
            </button>
            
            <button
              onClick={() => handleExport('Excel')}
              className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 flex items-center gap-3"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              Hoja de cálculo
            </button>
          </div>
          
          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export default ExportMenu;