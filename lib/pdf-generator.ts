import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { Contract } from '@/types';
import fs from 'fs';
import path from 'path';

export async function generateContractPDF(contract: Contract): Promise<Buffer> {
  // Cargar el template del PDF
  const templatePath = path.join(process.cwd(), 'public', 'template-contrato.pdf');
  const templateBytes = fs.readFileSync(templatePath);
  
  // Cargar el documento
  const pdfDoc = await PDFDocument.load(templateBytes);
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  
  // Cargar fuentes
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Dimensiones de la página
  const { width, height } = firstPage.getSize();
  
  // Función auxiliar para escribir texto
  const drawText = (text: string, x: number, y: number, size: number = 10, color = rgb(0, 0, 0), fontToUse = font) => {
    firstPage.drawText(text, {
      x,
      y: height - y, // Invertir coordenada Y
      size,
      font: fontToUse,
      color,
    });
  };
  
  // NOTA: Las coordenadas son aproximadas. Deberás ajustarlas según el template real.
  // Estas son posiciones de ejemplo basadas en el PDF que compartiste.
  
  // Reemplazar datos del LOCADOR (línea 1 del PDF)
  drawText(contract.locador_nombre, 60, 95, 9);
  drawText(contract.locador_dni, 230, 95, 9);
  drawText(contract.locador_domicilio, 320, 95, 9);
  
  // Reemplazar datos del LOCATARIO (línea 2 del PDF)
  drawText(contract.locatario_nombre, 60, 110, 9);
  drawText(contract.locatario_dni, 230, 110, 9);
  drawText(contract.locatario_domicilio, 320, 110, 9);
  
  // Dirección del inmueble (PRIMERA cláusula)
  const direccionCompleta = `${contract.inmueble_direccion}, Barrio ${contract.inmueble_barrio}, Lote ${contract.inmueble_lote}, ${contract.inmueble_partido}, ${contract.inmueble_provincia}`;
  drawText(direccionCompleta, 60, 240, 9);
  
  // Plazo y fechas (TERCERA cláusula)
  drawText(contract.plazo_noches.toString(), 400, 450, 9, rgb(0, 0, 0), boldFont);
  drawText(contract.fecha_inicio, 180, 465, 9);
  drawText(contract.hora_inicio, 290, 465, 9);
  drawText(contract.fecha_fin, 180, 480, 9);
  drawText(contract.hora_fin, 290, 480, 9);
  
  // Precio (CUARTA cláusula)
  const precioTexto = `${contract.precio_moneda} ${contract.precio_total.toLocaleString('es-AR')}`;
  drawText(precioTexto, 60, 580, 9, rgb(0, 0, 0), boldFont);
  
  // Máximo de personas (SEGUNDA cláusula)
  drawText(contract.max_personas.toString(), 450, 350, 9, rgb(0, 0, 0), boldFont);
  
  // Depósito (DÉCIMA PRIMERA cláusula - última página)
  const lastPage = pages[pages.length - 1];
  const depositoTexto = `${contract.precio_moneda} ${contract.deposito_garantia.toLocaleString('es-AR')}`;
  lastPage.drawText(depositoTexto, {
    x: 60,
    y: 100,
    size: 9,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  // Fecha del contrato (al final)
  const fechaContrato = new Date().toLocaleDateString('es-AR');
  lastPage.drawText(fechaContrato, {
    x: 300,
    y: 220,
    size: 9,
    font,
    color: rgb(0, 0, 0),
  });
  
  // Serializar y retornar
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

export async function addSignaturesToPDF(
  pdfBuffer: Buffer,
  locadorSignatureUrl?: string,
  locatarioSignatureUrl?: string
): Promise<Buffer> {
  // Cargar el PDF
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();
  const lastPage = pages[pages.length - 1];
  
  // Si hay firma del locador, agregarla
  if (locadorSignatureUrl) {
    try {
      // Descargar la imagen de la firma
      const response = await fetch(locadorSignatureUrl);
      const imageBytes = await response.arrayBuffer();
      
      // Determinar el tipo de imagen
      const image = locadorSignatureUrl.includes('.png')
        ? await pdfDoc.embedPng(imageBytes)
        : await pdfDoc.embedJpg(imageBytes);
      
      // Dimensiones de la firma
      const signatureWidth = 150;
      const signatureHeight = 60;
      
      // Agregar firma del locador (izquierda)
      lastPage.drawImage(image, {
        x: 100,
        y: 140,
        width: signatureWidth,
        height: signatureHeight,
      });
    } catch (error) {
      console.error('Error agregando firma del locador:', error);
    }
  }
  
  // Si hay firma del locatario, agregarla
  if (locatarioSignatureUrl) {
    try {
      const response = await fetch(locatarioSignatureUrl);
      const imageBytes = await response.arrayBuffer();
      
      const image = locatarioSignatureUrl.includes('.png')
        ? await pdfDoc.embedPng(imageBytes)
        : await pdfDoc.embedJpg(imageBytes);
      
      const signatureWidth = 150;
      const signatureHeight = 60;
      
      // Agregar firma del locatario (derecha)
      lastPage.drawImage(image, {
        x: 350,
        y: 140,
        width: signatureWidth,
        height: signatureHeight,
      });
    } catch (error) {
      console.error('Error agregando firma del locatario:', error);
    }
  }
  
  // Serializar y retornar
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

// Función para convertir DataURL (de canvas) a Buffer
export function dataURLtoBuffer(dataURL: string): Buffer {
  const base64Data = dataURL.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
}
