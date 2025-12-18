/**
 * Google Apps Script para gerenciar dados OOH via POST requests
 * Deploy: Deploy > Deploy as web app > Execute as: Me > Allow access
 */

// ID da planilha (copiar do .env GOOGLE_SHEETS_ID)
const SHEET_ID = '1H3qFr2if6MdNN4ZZnrMidTq9kNpOdb6OY8ICAS9Gsj4';
const SHEET_NAME = 'Visão geral';

/**
 * POST /doPost - Adicionar nova linha
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ erro: `Sheet "${SHEET_NAME}" não encontrada` }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Pegar headers da primeira linha
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Mapear dados para a ordem correta
    const novaLinha = headers.map(header => data[header] || '');
    
    // Adicionar linha
    sheet.appendRow(novaLinha);
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        sucesso: true, 
        mensagem: 'Registro criado com sucesso'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ 
        erro: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * GET /doGet - Health check
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ 
      status: 'OK', 
      timestamp: new Date()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
