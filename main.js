// main.js - Entry point for the Wage Calculator application
import { calendar } from './calendar.js';
import { initUI } from './ui.js';
import { loadData } from './storage.js';
import * as calc from './calculation.js';

// Attach calculation functions to the global scope so inline event handlers work.
window.calculateWage = calc.calculateWage;
window.calculateWageForCurrentMonth = calc.calculateWageForCurrentMonth;
window.exportCSV = calc.exportCSV;

document.addEventListener('DOMContentLoaded', () => {
  // Initialize the calendar view.
  calendar.init();
  // Load saved data.
  loadData();
  // Initialize UI event listeners (including CSV import).
  initUI();
});
