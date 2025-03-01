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
    
    // Helper function to compute previous day's date string.
    const getPrevDateStr = (year, month, day) => {
      const prevDate = new Date(year, month, day - 1);
      const pYear = prevDate.getFullYear();
      const pMonth = prevDate.getMonth() + 1;
      const pDay = prevDate.getDate();
      return `${pYear}-${String(pMonth).padStart(2, '0')}-${String(pDay).padStart(2, '0')}`;
    };
    
    for (let day = 1; day <= numDays; day++) {
      const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayDiv = document.createElement('div');
      dayDiv.classList.add('calendar-day');
      dayDiv.textContent = day;
      
      // If there's a shift entry for the day, mark it as "worked".
      if (this.entries[dateStr]) {
        dayDiv.classList.add('worked');
      } else {
        // Check if the previous day's shift goes overnight.
        const prevDateStr = getPrevDateStr(year, month, day);
        if (this.entries[prevDateStr]) {
          const entry = this.entries[prevDateStr];
          // Assume that if the end time is less than the start time (e.g., "05:00" < "19:00")
          // then the shift goes overnight.
          if (entry.endTime < entry.startTime) {
            dayDiv.classList.add('overnight');
          }
        }
      }
      
      // Allow clicking on a day to open the modal for manual entry/edit.
      dayDiv.addEventListener('click', () => {
        this.openModal(dateStr);
      });
      
      calendarGrid.appendChild(dayDiv);
    }
  },

  /**
   * Parses a time string (e.g., "19:30") for a given date string (YYYY-MM-DD)
   * and returns a Date object.
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
   * Opens the modal for a given date. If an entry exists, pre-populates the fields.
   * @param {string} dateStr - Date in "YYYY-MM-DD" format.
   */
  openModal(dateStr) {
    const modal = document.getElementById('timeEntryModal');
    modal.style.display = 'block';
    modal.dataset.date = dateStr;
    document.getElementById('modalDate').textContent = dateStr;
    
    // Pre-populate fields if an entry exists; otherwise use defaults.
    if (this.entries[dateStr]) {
      const entry = this.entries[dateStr];
      document.getElementById('modalStartTime').value = entry.startTime;
      document.getElementById('modalEndTime').value = entry.endTime;
      document.getElementById('modalDayBoosterPercent').value = entry.dayBooster || 0;
    } else {
      document.getElementById('modalStartTime').value = "19:00";
      document.getElementById('modalEndTime').value = "05:00";
      document.getElementById('modalDayBoosterPercent').value = 0;
    }
  },

  /**
   * Closes the time entry modal.
   */
  closeModal() {
    const modal = document.getElementById('timeEntryModal');
    modal.style.display = 'none';
  },

  /**
   * Saves the shift data from the modal to the calendar.
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

  /**
   * Deletes the shift entry for the current modal date.
   */
  deleteEntry() {
    const modal = document.getElementById('timeEntryModal');
    const dateStr = modal.dataset.date;
    if (this.entries[dateStr]) {
      delete this.entries[dateStr];
    }
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
