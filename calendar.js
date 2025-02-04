// calendar.js - Manages the calendar view and work-time entries

export const calendar = {
  selectedDate: null,
  currentDate: new Date(),
  entries: {},

  /** Initializes the calendar view. */
  init() {
    this.render();
  },

  /**
   * Formats a Date object as yyyy-mm-dd.
   * @param {Date} date 
   * @returns {string}
   */
  formatDate(date) {
    const year  = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day   = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * Returns a new Date object with time set to 00:00.
   * @param {Date} date 
   * @returns {Date}
   */
  stripTime(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  },

  /**
   * Creates a Date object from a date string (yyyy-mm-dd) and a time string (HH:MM).
   * @param {string} dateString 
   * @param {string} timeString 
   * @returns {Date}
   */
  parseTime(dateString, timeString) {
    const [y, m, d] = dateString.split('-');
    const [hh, mm] = timeString.split(':');
    return new Date(y, m - 1, d, hh, mm);
  },

  /**
   * Renders the calendar grid and marks days with work entries.
   */
  render() {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    document.getElementById('currentMonth').textContent =
      `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;

    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';

    // Create weekday header cells.
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
      const header = document.createElement('div');
      header.textContent = day;
      header.style.fontWeight = 'bold';
      grid.appendChild(header);
    });

    const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
    const daysInMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0).getDate();
    const startDay = firstDay.getDay();

    // Insert blank cells before the first day.
    for (let i = 0; i < startDay; i++) {
      grid.appendChild(document.createElement('div'));
    }

    const entriesArray = Object.entries(this.entries);

    // Create day cells.
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
      const dayElement = document.createElement('div');
      dayElement.className = 'calendar-day';
      dayElement.textContent = day;

      // Mark the day as "worked" if any shift overlaps.
      for (const [entryDateString, times] of entriesArray) {
        const shiftStart = this.parseTime(entryDateString, times.startTime);
        let shiftEnd = this.parseTime(entryDateString, times.endTime);
        if (shiftEnd <= shiftStart) {
          shiftEnd.setDate(shiftEnd.getDate() + 1);
        }
        if (
          this.stripTime(date) >= this.stripTime(shiftStart) &&
          this.stripTime(date) <= this.stripTime(shiftEnd)
        ) {
          dayElement.classList.add('worked');
          break;
        }
      }

      // Open modal to add/edit work entry on click.
      dayElement.addEventListener('click', () => this.showModal(date));
      grid.appendChild(dayElement);
    }
  },

  /**
   * Opens the modal for a given date.
   * @param {Date} date 
   */
  showModal(date) {
    this.selectedDate = date;
    const modal = document.getElementById('timeEntryModal');
    document.getElementById('modalDate').textContent = date.toLocaleDateString();

    const existingEntry = this.entries[this.formatDate(date)];
    if (existingEntry) {
      document.getElementById('modalStartTime').value = existingEntry.startTime;
      document.getElementById('modalEndTime').value = existingEntry.endTime;
      document.getElementById('modalDayBoosterPercent').value =
        existingEntry.dayBooster ? existingEntry.dayBooster : 0;
    } else {
      document.getElementById('modalStartTime').value = '19:00';
      document.getElementById('modalEndTime').value = '05:00';
      document.getElementById('modalDayBoosterPercent').value = 0;
    }
    modal.style.display = 'block';
  },

  /**
   * Saves the work entry (including day-specific booster) from the modal.
   */
  saveEntry() {
    if (!this.selectedDate) return;

    const dateKey = this.formatDate(this.selectedDate);
    const dayBooster = parseFloat(document.getElementById('modalDayBoosterPercent').value) || 0;
    this.entries[dateKey] = {
      startTime: document.getElementById('modalStartTime').value,
      endTime: document.getElementById('modalEndTime').value,
      dayBooster: dayBooster > 0 ? dayBooster : null
    };

    this.closeModal();
    this.render();

    import('./storage.js').then(module => {
      module.saveData();
    });
    this.selectedDate = null;
  },

  /**
   * Closes the work entry modal.
   */
  closeModal() {
    document.getElementById('timeEntryModal').style.display = 'none';
  },

  /** Moves the calendar view to the previous month. */
  prevMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.render();
  },

  /** Moves the calendar view to the next month. */
  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.render();
  }
};

// Make the calendar globally available for inline event handlers.
window.calendar = calendar;
