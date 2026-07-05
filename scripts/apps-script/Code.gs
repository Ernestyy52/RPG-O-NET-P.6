// Google Apps Script backend สำหรับเกม O-NET English Tower
// วิธีติดตั้ง: ดู scripts/apps-script/README.md

const SHEET_PLAYERS = 'Players'
const SHEET_LEADERBOARD = 'Leaderboard'

function doGet(e) {
  const action = e.parameter.action
  if (action === 'load') return loadPlayer(e.parameter.name)
  if (action === 'leaderboard') return getLeaderboard()
  return jsonResponse({ error: 'unknown action' })
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents)
  if (body.action === 'save') return savePlayer(body.data)
  return jsonResponse({ error: 'unknown action' })
}

function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  let sheet = ss.getSheetByName(name)
  if (!sheet) {
    sheet = ss.insertSheet(name)
    if (name === SHEET_PLAYERS) {
      sheet.appendRow(['name', 'level', 'exp', 'gold', 'currentFloor', 'maxHp', 'hp', 'atk', 'inventory', 'updatedAt'])
    }
    if (name === SHEET_LEADERBOARD) {
      sheet.appendRow(['name', 'floor', 'level', 'updatedAt'])
    }
  }
  return sheet
}

function savePlayer(data) {
  const sheet = getSheet(SHEET_PLAYERS)
  const values = sheet.getDataRange().getValues()
  let rowIndex = -1
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === data.name) { rowIndex = i + 1; break }
  }
  const row = [
    data.name, data.level, data.exp, data.gold, data.currentFloor,
    data.maxHp, data.hp, data.atk, JSON.stringify(data.inventory || []),
    new Date().toISOString(),
  ]
  if (rowIndex === -1) sheet.appendRow(row)
  else sheet.getRange(rowIndex, 1, 1, row.length).setValues([row])

  updateLeaderboard(data.name, data.currentFloor, data.level)
  return jsonResponse({ ok: true })
}

function loadPlayer(name) {
  const sheet = getSheet(SHEET_PLAYERS)
  const values = sheet.getDataRange().getValues()
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === name) {
      const [n, level, exp, gold, currentFloor, maxHp, hp, atk, inventory] = values[i]
      return jsonResponse({
        name: n, level, exp, gold, currentFloor, maxHp, hp, atk,
        inventory: JSON.parse(inventory || '[]'),
      })
    }
  }
  return jsonResponse(null)
}

function updateLeaderboard(name, floor, level) {
  const sheet = getSheet(SHEET_LEADERBOARD)
  const values = sheet.getDataRange().getValues()
  let rowIndex = -1
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === name) { rowIndex = i + 1; break }
  }
  const row = [name, floor, level, new Date().toISOString()]
  if (rowIndex === -1) sheet.appendRow(row)
  else sheet.getRange(rowIndex, 1, 1, row.length).setValues([row])
}

function getLeaderboard() {
  const sheet = getSheet(SHEET_LEADERBOARD)
  const values = sheet.getDataRange().getValues()
  const rows = values.slice(1)
    .map((r) => ({ name: r[0], floor: r[1], level: r[2] }))
    .sort((a, b) => b.floor - a.floor)
    .slice(0, 20)
  return jsonResponse(rows)
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}
