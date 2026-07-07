import { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { useExport } from '../hooks/useExport';
import toast from 'react-hot-toast';

function ExportMenu({ exportableRef }) {
  const [open, setOpen] = useState(false);

  const { exportToPNG, exportToPDF, exportToExcel, exportToGoogleCalendar } = useExport();

  const handleExport = async (format) => {

    if ((format === 'PNG' || format === 'PDF') && !exportableRef.current) {
      toast.error("El componente del calendario aún no está listo. Inténtalo de nuevo.");
      return;
    }

    let loadingToast;

    try {
      setOpen(false);

      loadingToast = toast.loading(`Exportando a ${format}...`);

      switch (format) {
        case 'PNG':
          await exportToPNG(exportableRef.current);
          break;
        case 'PDF':
          await exportToPDF(exportableRef.current);
          break;
        case 'Excel':
          await exportToExcel(); 
          break;
        case 'Calendar':
          await exportToGoogleCalendar(); 
          break;
      }

      toast.dismiss(loadingToast);
      toast.success(`Horario exportado como ${format}`);
    } catch (error) {
      if (loadingToast) {
        toast.dismiss(loadingToast);
      }
      toast.error(`Error al exportar: ${error.message}`);
    }
  };


  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold focus:outline-none"
          style={{ padding: '8px 15px', borderRadius: '10px', background: 'var(--primary)', color: '#fff', boxShadow: '0 3px 10px var(--primary-glow)' }}
        >
          Exportar
          <span className="text-[10px] opacity-80">▼</span>
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          sideOffset={8}
          align="end"
          collisionPadding={12}
          className="z-[60] p-1 w-48"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 16px 40px rgba(0,0,0,.16)' }}
        >
          <div className="py-1">
            <button
              onClick={() => handleExport('PNG')}
              className="w-full px-4 py-2 text-[13px] text-left rounded-lg flex items-center gap-3 transition-colors hover:bg-[var(--surface2)]" style={{ color: 'var(--text)' }}
            >
              <svg className="w-4 h-4" style={{ color: 'var(--muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Imagen PNG
            </button>
            
            <button
              onClick={() => handleExport('PDF')}
              className="w-full px-4 py-2 text-[13px] text-left rounded-lg flex items-center gap-3 transition-colors hover:bg-[var(--surface2)]" style={{ color: 'var(--text)' }}
            >
              <svg className="w-4 h-4" style={{ color: 'var(--muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Documento PDF
            </button>
            
            <button
              onClick={() => handleExport('Excel')}
              className="w-full px-4 py-2 text-[13px] text-left rounded-lg flex items-center gap-3 transition-colors hover:bg-[var(--surface2)]" style={{ color: 'var(--text)' }}
            >
              <svg className="w-4 h-4" style={{ color: 'var(--muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              Hoja de cálculo
            </button>

            <button
              onClick={() => handleExport('Calendar')}
              className="w-full px-4 py-2 text-[13px] text-left rounded-lg flex items-center gap-3 transition-colors hover:bg-[var(--surface2)]" style={{ color: 'var(--text)' }}
            >
              <svg className="w-4 h-4" style={{ color: 'var(--muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Calendar
            </button>
          </div>
          
          <Popover.Arrow style={{ fill: 'var(--surface)' }} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export default ExportMenu;
