// ui.js - Handles UI event wiring (auto-save, dark mode, booster management, CSV import, etc.)
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

  // CSV Import: Attach listener for the hidden CSV file input.
  const csvFileInput = document.getElementById('csvFileInput');
  if (csvFileInput) {
    csvFileInput.addEventListener('change', handleCSVImport);
  }

  // Attach listener for the visible Import CSV button.
  const importCsvButton = document.getElementById('importCsvButton');
  if (importCsvButton) {
    importCsvButton.addEventListener('click', () => {
      document.getElementById('csvFileInput').click();
    });
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

/* CSV Import Functions */

/**
 * Called when a CSV file is selected. Clears current work data and imports the CSV.
 * @param {Event} event 
 */
function handleCSVImport(event) {
  // Clear existing work entries.
  clearAllData();
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const csvText = e.target.result;
    importCSV(csvText);
  };
  reader.readAsText(file);
}

/**
 * Imports CSV text (expects at least Date, Start Time, End Time columns).
 * Updates calendar entries, re-renders the calendar, and saves the data.
 * @param {string} csvText 
 */
function importCSV(csvText) {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  // Remove header row if present.
  if (lines[0] && lines[0].toLowerCase().includes('date')) {
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
  const csvFileInput = document.getElementById('csvFileInput');
  if (csvFileInput) {
    csvFileInput.value = "";
  }
}
