/**
 * Reduce una foto del celular antes de subirla: el lado mayor queda en `ladoMaximo` px
 * y se guarda como JPEG. Una foto de 4–8 MB pasa a unos cientos de KB, que es lo que
 * importa en campo con datos móviles. Respeta la orientación EXIF.
 *
 * Si el navegador no puede procesarla, devuelve el archivo original (el servidor
 * igual valida tipo y tamaño).
 */
export async function comprimirImagen(archivo: File, ladoMaximo = 1600, calidad = 0.82): Promise<File> {
  if (!/^image\/(jpeg|png)$/.test(archivo.type)) return archivo;

  try {
    const bitmap = await createImageBitmap(archivo, { imageOrientation: 'from-image' });
    const escala = Math.min(1, ladoMaximo / Math.max(bitmap.width, bitmap.height));
    const ancho = Math.round(bitmap.width * escala);
    const alto = Math.round(bitmap.height * escala);

    const canvas = document.createElement('canvas');
    canvas.width = ancho;
    canvas.height = alto;
    const ctx = canvas.getContext('2d');
    if (!ctx) return archivo;
    // Fondo blanco: un PNG con transparencia no queda negro al pasar a JPEG
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, ancho, alto);
    ctx.drawImage(bitmap, 0, 0, ancho, alto);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolver) => canvas.toBlob(resolver, 'image/jpeg', calidad));
    if (!blob || blob.size >= archivo.size) return archivo;

    const nombre = archivo.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], nombre, { type: 'image/jpeg', lastModified: Date.now() });
  } catch {
    return archivo;
  }
}
