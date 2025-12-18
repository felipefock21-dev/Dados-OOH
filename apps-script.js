/**
 * Google Apps Script para gerenciar dados OOH via POST requests
 * Deploy: Deploy > Novo Deploy > Web App > Execute como Me > Qualquer pessoa
 */

// ID da planilha (copiar do .env GOOGLE_SHEETS_ID)
const SHEET_ID = '1H3qFr2if6MdNN4ZZnrMidTq9kNpOdb6OY8ICAS9Gsj4';
const SHEET_NAME = 'Visão geral';

/**
 * POST /doPost - Adicionar nova linha
 */
function doPost(e) {
  try {
    Logger.log('=== doPost START ===');
    Logger.log('Request type:', typeof e.postData);
    Logger.log('Content type:', e.contentLength);
    
    let data;
    try {
      data = JSON.parse(e.postData.contents);
      Logger.log('Parsed data:', JSON.stringify(data));
    } catch (parseErr) {
      Logger.log('JSON parse error:', parseErr);
      return ContentService.createTextOutput(JSON.stringify({ 
        erro: 'Erro ao fazer parse do JSON: ' + parseErr.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
    }
    
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      Logger.log('Sheet not found:', SHEET_NAME);
      return ContentService.createTextOutput(JSON.stringify({ 
        erro: `Sheet "${SHEET_NAME}" não encontrada` 
      }))
      .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Pegar headers da primeira linha
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    Logger.log('Headers:', JSON.stringify(headers));
    
    // Mapear dados para a ordem correta
    const novaLinha = headers.map(header => {
      const valor = data[header];
      Logger.log(`Header "${header}" -> ${valor || ''}`);
      return valor !== undefined ? String(valor) : '';
    });
    
    Logger.log('Nova linha:', JSON.stringify(novaLinha));
    
    // Adicionar linha
    sheet.appendRow(novaLinha);
    Logger.log('Row added successfully');
    
    return ContentService.createTextOutput(JSON.stringify({ 
      sucesso: true, 
      mensagem: 'Registro criado com sucesso'
    }))
    .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('Error:', error.toString());
    Logger.log('Stack:', error.stack);
    return ContentService.createTextOutput(JSON.stringify({ 
      erro: 'Erro ao criar registro: ' + error.toString() 
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * GET /doGet - Health check
 */
function doGet(e) {
  Logger.log('=== doGet START ===');
  return ContentService.createTextOutput(JSON.stringify({ 
    status: 'OK', 
    timestamp: new Date(),
    sheetId: SHEET_ID,
    sheetName: SHEET_NAME
  }))
  .setMimeType(ContentService.MimeType.JSON);
}
