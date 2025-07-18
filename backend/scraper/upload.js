// ./backend/scraper/upload.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function uploadFile() {
  const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Las variables de entorno SUPABASE_PROJECT_URL y SUPABASE_SERVICE_KEY son requeridas.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const filePath = path.join(__dirname, 'materias', 'todas_carreras.json');
  const bucketName = 'materias'; // <-- CAMBIA ESTO por el nombre de tu bucket
  const fileNameInBucket = 'todas_carreras.json';

  try {
    const fileContent = fs.readFileSync(filePath);
    console.log(`Subiendo archivo: ${fileNameInBucket} al bucket: ${bucketName}...`);
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileNameInBucket, fileContent, {
        cacheControl: '3600',
        upsert: true, // Esto sobrescribe el archivo si ya existe
        contentType: 'application/json',
      });

    if (error) {
      throw error;
    }

    console.log('¡Archivo subido exitosamente!', data);
  } catch (error) {
    console.error('Error al subir el archivo:', error.message);
    process.exit(1);
  }
}

uploadFile();