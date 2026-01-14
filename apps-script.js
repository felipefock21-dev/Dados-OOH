/**
 * Google Apps Script para gerenciar dados OOH via POST requests
 * Suporta: CREATE (append), UPDATE (update row), DELETE (clear row)
 */

const SHEET_ID = '1H3qFr2if6MdNN4ZZnrMidTq9kNpOdb6OY8ICAS9Gsj4';
const SHEET_NAME = 'Visão geral';

/**
 * POST - Adicionar, atualizar ou deletar
 */
function doPost(e) {
  try {
    Logger.log('=== doPost START ===');
    
    let data = {};
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
      Logger.log('Dados recebidos:', JSON.stringify(data));
    }
    
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      throw new Error(`Sheet "${SHEET_NAME}" não encontrada`);
    }
    
    // Pegar headers
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    Logger.log('Headers encontrados:', headers.length);
    
    // Determinar ação
    const action = data.action || 'create'; // 'create', 'update', 'delete'
    Logger.log('Action:', action);
    
    if (action === 'create') {
      // Criar nova linha
      const novaLinha = headers.map(header => data[header] || '');
      sheet.appendRow(novaLinha);
      Logger.log('Nova linha adicionada');
      
      return HtmlService.createHtmlOutput(JSON.stringify({
        sucesso: true,
        mensagem: 'Registro criado com sucesso'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    else if (action === 'update') {
      // Atualizar linha existente
      const rowIndex = data.rowIndex;
      Logger.log('Atualizando linha:', rowIndex);
      
      if (!rowIndex || rowIndex < 2) {
        throw new Error('rowIndex inválido');
      }
      
      const novaLinha = headers.map(header => data[header] || '');
      const colunaFinal = headers.length;
      
      sheet.getRange(rowIndex, 1, 1, colunaFinal).setValues([novaLinha]);
      Logger.log('Linha atualizada');
      
      return HtmlService.createHtmlOutput(JSON.stringify({
        sucesso: true,
        mensagem: 'Registro atualizado com sucesso'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    else if (action === 'delete') {
      // Deletar linha (remover a linha inteira da planilha)
      const rowIndex = data.rowIndex;
      Logger.log('Deletando linha:', rowIndex);
      Logger.log('Detalhes - Cliente:', data.cliente, 'Campanha:', data.campanha);
      
      if (!rowIndex || rowIndex < 2) {
        throw new Error('rowIndex inválido: ' + rowIndex);
      }
      
      // Verificar se a linha existe
      const ultimaLinha = sheet.getLastRow();
      if (rowIndex > ultimaLinha) {
        throw new Error('Linha ' + rowIndex + ' não existe (última linha: ' + ultimaLinha + ')');
      }
      
      // Obter valores da linha antes de deletar (para debug)
      const valoresAntes = sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];
      Logger.log('Valores da linha a deletar:', valoresAntes);
      
      // Deletar a linha inteira (não apenas limpar conteúdo)
      sheet.deleteRow(rowIndex);
      Logger.log('Linha deletada com sucesso');
      
      return HtmlService.createHtmlOutput(JSON.stringify({
        sucesso: true,
        mensagem: 'Registro deletado com sucesso'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    else {
      throw new Error('Action inválida: ' + action);
    }
    
  } catch (error) {
    Logger.log('Erro:', error.toString());
    return HtmlService.createHtmlOutput(JSON.stringify({
      sucesso: false,
      erro: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * GET - Health check
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    
    return HtmlService.createHtmlOutput(JSON.stringify({
      status: 'OK',
      timestamp: new Date(),
      sheetName: SHEET_NAME,
      lastRow: sheet.getLastRow()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return HtmlService.createHtmlOutput(JSON.stringify({
      status: 'ERROR',
      erro: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
