// calendar.js
export const calendar = {
  entries: {},
  currentDate: new Date(),

  init() {
    this.render();
  },

  render() {
    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = "";
    
    // Update header with current month and year.
    const currentMonthHeader = document.getElementById('currentMonth');
    if (currentMonthHeader) {
      currentMonthHeader.textContent = new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric"
      }).format(this.currentDate);
    }
    
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const lastDay = new Date(year, month + 1, 0);
    const numDays = lastDay.getDate();
    
    // Helper to get the previous day's date string in "YYYY-MM-DD" format.
    const getPrevDateStr = (year, month, day) => {
      const prevDate = new Date(year, month, day - 1);
      const pYear = prevDate.getFullYear();
      const pMonth = prevDate.getMonth() + 1;
      const pDay = prevDate.getDate();
      return `${pYear}-${String(pMonth).padStart(2, '0')}-${String(pDay).padStart(2, '0')}`;
    };
    
    for (let day = 1; day <= numDays; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayDiv = document.createElement('div');
      dayDiv.classList.add('calendar-day');
      dayDiv.textContent = day;
      
      // If the day has its own shift entry, mark it as worked.
      if (this.entries[dateStr]) {
        dayDiv.classList.add('worked');
      } else {
        // Otherwise, check if the previous day's shift is overnight.
        const prevDateStr = getPrevDateStr(year, month, day);
        if (this.entries[prevDateStr]) {
          const entry = this.entries[prevDateStr];
          // We assume that if the end time is less than the start time (e.g. "05:00" < "19:00"),
          // then the shift goes overnight.
          if (entry.endTime < entry.startTime) {
            dayDiv.classList.add('overnight');
          }
        }
      }
      
      // Add click listener to open the modal for manual shift entry.
      dayDiv.addEventListener('click', () => {
        this.openModal(dateStr);
      });
      
      calendarGrid.appendChild(dayDiv);
    }
  },

  /**
   * Parses a time string (e.g., "19:30") for a given date string (YYYY-MM-DD) and returns a Date object.
   * @param {string} dateStr 
   * @param {string} timeStr 
   * @returns {Date}
   */
  parseTime(dateStr, timeStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [h, m] = timeStr.split(':').map(Number);
    return new Date(year, month - 1, day, h, m);
  },

  /**
   * Opens the modal for adding or editing a shift on the given date.
   * @param {string} dateStr - Date in format YYYY-MM-DD
   */
  openModal(dateStr) {
    const modal = document.getElementById('timeEntryModal');
    modal.style.display = 'block';
    modal.dataset.date = dateStr;
    const modalDateSpan = document.getElementById('modalDate');
    modalDateSpan.textContent = dateStr;
  },

  /**
   * Closes the time entry modal.
   */
  closeModal() {
    const modal = document.getElementById('timeEntryModal');
    modal.style.display = 'none';
  },

  /**
   * Saves the shift data entered in the modal to the calendar entries.
   */
  saveEntry() {
    const modal = document.getElementById('timeEntryModal');
    const dateStr = modal.dataset.date;
    const startTime = document.getElementById('modalStartTime').value;
    const endTime = document.getElementById('modalEndTime').value;
    const dayBooster = document.getElementById('modalDayBoosterPercent').value;
    this.entries[dateStr] = { startTime, endTime, dayBooster: dayBooster ? parseFloat(dayBooster) : 0 };
    this.render();
    this.closeModal();
  },

  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.render();
  },

  prevMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.render();
  }
};
