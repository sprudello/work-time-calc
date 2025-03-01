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
    
    // Helper to get the previous day's date string.
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
      
      // Mark day as worked if there's an entry.
      if (this.entries[dateStr]) {
        dayDiv.classList.add('worked');
      } else {
        // Otherwise, check if previous day's shift is overnight.
        const prevDateStr = getPrevDateStr(year, month, day);
        if (this.entries[prevDateStr]) {
          const entry = this.entries[prevDateStr];
          // Assume that if endTime is less than startTime then it's overnight.
          if (entry.endTime < entry.startTime) {
            dayDiv.classList.add('overnight');
          }
        }
      }
      
      // Add click listener to open modal.
      dayDiv.addEventListener('click', () => {
        this.openModal(dateStr);
      });
      
      calendarGrid.appendChild(dayDiv);
    }
  },

  parseTime(dateStr, timeStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [h, m] = timeStr.split(':').map(Number);
    return new Date(year, month - 1, day, h, m);
  },

  openModal(dateStr) {
    const modal = document.getElementById('timeEntryModal');
    modal.style.display = 'block';
    modal.dataset.date = dateStr;
    document.getElementById('modalDate').textContent = dateStr;
  },

  closeModal() {
    const modal = document.getElementById('timeEntryModal');
    modal.style.display = 'none';
  },

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

  // New function to delete a shift entry.
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
