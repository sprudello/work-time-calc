// ui.js - Handles UI event wiring (auto-save, dark mode, booster management, CSV imports, etc.)
import { saveData, loadData } from './storage.js';
import { calendar } from './calendar.js';

export function initUI() {
  // Auto-save on changes to wage or boosters.
  const hourlyWageEl = document.getElementById('hourlyWage');
  const boostersContainer = document.getElementById('boostersContainer');
  hourlyWageEl.addEventListener('input', saveData);
  boostersContainer.addEventListener('input', saveData);

  // Set up periodic auto-save (every 5 seconds).
  setInterval(saveData, 5000);

  // Dark mode toggle.
  const darkModeToggle = document.getElementById('toggleDarkMode');
  darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
  });

  // Delegate "Remove" button clicks for boosters.
  document.body.addEventListener('click', (e) => {
    if (e.target.matches('button') && e.target.textContent === 'Remove') {
      e.target.parentElement.remove();
      saveData();
    }
  });

  // Attach clear-all functionality.
  const clearButton = document.querySelector('button.clear-button');
  if (clearButton) {
    clearButton.addEventListener('click', () => {
      clearAllData();
    });
  }

  // Attach listener for the standard Import CSV button.
  const importCsvButton = document.getElementById('importCsvButton');
  if (importCsvButton) {
    importCsvButton.addEventListener('click', () => {
      document.getElementById('csvFileInput').click();
    });
  }
  
  // Attach listener for the new Add Dienstplan button.
  const addDienstplanButton = document.getElementById('addDienstplanButton');
  if (addDienstplanButton) {
    addDienstplanButton.addEventListener('click', () => {
      document.getElementById('dienstplanCsvInput').click();
    });
  }

  // CSV Import for standard shift entries.
  const csvFileInput = document.getElementById('csvFileInput');
  if (csvFileInput) {
    csvFileInput.addEventListener('change', handleCSVImport);
  }

  // CSV Import for Dienstplan entries.
  const dienstplanCsvInput = document.getElementById('dienstplanCsvInput');
  if (dienstplanCsvInput) {
    dienstplanCsvInput.addEventListener('change', handleDienstplanCSV);
  }
}

export function addBooster() {
  const template = document.getElementById('boosterTemplate');
  const clone = template.content.cloneNode(true);
  document.getElementById('boostersContainer').appendChild(clone);
  saveData();
}
window.addBooster = addBooster;

/**
 * Clears all work time entries (but preserves wage and boosters).
 */
export function clearAllData() {
  if (!confirm('Are you sure you want to delete all saved work data?')) return;
  const currentData = JSON.parse(localStorage.getItem('shiftData')) || {};
  const newData = {
    hourlyWage: currentData.hourlyWage || 15,
    boosters: currentData.boosters || [],
    timeEntries: {}
  };
  localStorage.setItem('shiftData', JSON.stringify(newData));
  calendar.entries = {};
  calendar.render();
  document.getElementById('results').innerHTML = '';
  loadData();
}
window.clearAllData = clearAllData;

/* CSV Import Functions for standard shifts */

/**
 * Called when a CSV file is selected for standard shift import.
 * Expects rows with format: YYYY-MM-DD,startTime,endTime.
 * Clears existing work data and imports the CSV.
 * @param {Event} event 
 */
function handleCSVImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Clear existing work entries.
  clearAllData();

  const reader = new FileReader();
  reader.onload = function(e) {
    const csvText = e.target.result;
    importCSV(csvText);
  };
  reader.readAsText(file);
}

/**
 * Imports CSV text for standard shift entries.
 * Expects rows with format: YYYY-MM-DD,startTime,endTime.
 *
 * Updates calendar entries, re-renders the calendar, and saves the data.
 *
 * @param {string} csvText 
 */
function importCSV(csvText) {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  // Remove header row if present (if it contains a dash, e.g., "2025-03-02")
  if (lines[0] && lines[0].toLowerCase().includes('date') && lines[0].includes('-')) {
    lines.shift();
  }
  lines.forEach(line => {
    const cols = line.split(',');
    if (cols.length < 3) return;
    const date = cols[0].trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    const startTime = cols[1].trim();
    const endTime = cols[2].trim();
    calendar.entries[date] = { startTime, endTime };
  });
  calendar.render();
  saveData();
  document.getElementById('csvFileInput').value = "";
}

/* CSV Import Functions for Dienstplan */

/**
 * Called when a CSV file is selected for adding a Dienstplan.
 * Expects the CSV format:
 * - Row 1: Header like "Monat:,3" (month is in the second column)
 * - Row 2: Day numbers (e.g., "Datum,1,2,3,...") which are ignored
 * - Row 3: Shift data, where column 0 is a label (e.g. "Klegraefe") and
 *          columns 1..n contain shifts in the format "1930 0530" (times without colons)
 * The year is assumed to be the current year.
 * Merges the imported entries into the existing calendar data.
 * @param {Event} event 
 */
function handleDienstplanCSV(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const csvText = e.target.result;
    addDienstplanCSV(csvText);
  };
  reader.readAsText(file);
}

/**
 * Parses and adds Dienstplan CSV data to the calendar.
 * Converts time strings from "1930" to "19:30".
 * @param {string} csvText 
 */
function addDienstplanCSV(csvText) {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  // Expect at least 3 rows: header, day numbers, and data.
  if (lines.length < 3) return;

  // Row 1: e.g., "Monat:,3,,,,..."
  const headerCols = lines[0].split(',');
  if (headerCols.length < 2) return;
  const month = parseInt(headerCols[1].replace(/[^0-9]/g, '').trim(), 10);
  if (isNaN(month)) return;

  const currentYear = new Date().getFullYear();

  // Row 2 is day numbers (ignored) and Row 3 contains shift data.
  const shiftRow = lines[2].split(',');

  // Loop from column 1 onward (column 0 is a label, e.g., "Klegraefe")
  for (let i = 1; i < shiftRow.length; i++) {
    let cell = shiftRow[i].trim();
    if (!cell) continue;

    // Expect cell to be in format like "1930 0530" (space-separated)
    const parts = cell.split(/\s+/);
    if (parts.length < 2) continue;

    let [rawStart, rawEnd] = parts;

    // Function to insert colon into a 4-digit time string (e.g., "1930" -> "19:30")
    const formatTime = (timeStr) => {
      if (/^\d{4}$/.test(timeStr)) {
        return timeStr.slice(0, 2) + ':' + timeStr.slice(2);
      }
      return timeStr;
    };

    const startTime = formatTime(rawStart);
    const endTime = formatTime(rawEnd);

    // The day number is taken from the corresponding column in row 2,
    // but if that row is not reliable, we assume column index i corresponds to day i.
    const day = i; 

    // Construct a date string in the format YYYY-MM-DD
    const dateStr = `${currentYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    // Merge the Dienstplan entry into the calendar (this will overwrite any existing entry for the same date)
    calendar.entries[dateStr] = { startTime, endTime };
  }
  calendar.render();
  saveData();
  document.getElementById('dienstplanCsvInput').value = "";
}
