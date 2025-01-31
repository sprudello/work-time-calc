// Wait until DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    calendar.init();
    loadData();
    
    // Autosave whenever user changes wage or boosters
    document.getElementById('hourlyWage').addEventListener('input', saveData);
    document.getElementById('boostersContainer').addEventListener('input', saveData);
    
    // Periodic saving (every 5 seconds)
    setInterval(saveData, 5000);
});

// =======================
// Storage / Save / Load
// =======================
function saveData() {
    const data = {
        hourlyWage: document.getElementById('hourlyWage').value,
        boosters: Array.from(document.getElementsByClassName('booster')).map(booster => ({
            percent: booster.querySelector('.booster-percent').value,
            days: Array.from(booster.querySelectorAll('.day:checked')).map(c => c.value),
            startTime: booster.querySelector('.start-time').value,
            endTime: booster.querySelector('.end-time').value
        })),
        timeEntries: calendar.entries
    };
    
    localStorage.setItem('shiftData', JSON.stringify(data));
}

function loadData() {
    const savedData = localStorage.getItem('shiftData');
    if (!savedData) return;
    
    try {
        const data = JSON.parse(savedData);
        document.getElementById('hourlyWage').value = data.hourlyWage || 15;

        // Load boosters
        document.getElementById('boostersContainer').innerHTML = '';
        const boosterTemplate = document.getElementById('boosterTemplate');
        (data.boosters || []).forEach(boosterData => {
            const clone = boosterTemplate.content.cloneNode(true);
            const booster = clone.querySelector('.booster');
            booster.querySelector('.booster-percent').value = boosterData.percent;
            boosterData.days.forEach(day => {
                booster.querySelectorAll('.day').forEach(checkbox => {
                    if (checkbox.value === day) checkbox.checked = true;
                });
            });
            booster.querySelector('.start-time').value = boosterData.startTime;
            booster.querySelector('.end-time').value = boosterData.endTime;
            document.getElementById('boostersContainer').appendChild(clone);
        });

        // Load calendar entries
        calendar.entries = data.timeEntries || {};
        calendar.render();
    } catch (e) {
        console.error('Error loading saved data:', e);
    }
}

function addBooster() {
    const template = document.getElementById('boosterTemplate');
    const clone = template.content.cloneNode(true);
    document.getElementById('boostersContainer').appendChild(clone);
    saveData();
}

function clearAllData() {
    // Show a confirmation dialog
    const confirmed = confirm('Are you sure you want to delete all saved work data?');
    if (!confirmed) {
        return; // Exit if user cancels
    }
    
    // Clear localStorage data but keep wage/boosters
    const currentData = JSON.parse(localStorage.getItem('shiftData')) || {};
    const newData = {
        hourlyWage: currentData.hourlyWage || 15,  // preserve wage
        boosters: currentData.boosters || [],      // preserve boosters
        timeEntries: {}                            // clear time entries
    };
    localStorage.setItem('shiftData', JSON.stringify(newData));
    
    // Clear in-memory & on-screen data
    calendar.entries = {};
    calendar.render();
    document.getElementById('results').innerHTML = '';
    
    // Reload boosters to ensure UI sync
    loadData();
}
// =======================
// Calendar object
// =======================
const calendar = {
    selectedDate: null,
    currentDate: new Date(),
    entries: {},

    init() {
        this.render();
    },

    // Local date formatting to avoid time zone issues:
    formatDate(date) {
        const year  = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day   = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    // Helper: zero out hours/mins/secs for date comparisons
    stripTime(d) {
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    },

    // Helper: build a Date from "yyyy-mm-dd" plus "HH:MM"
    parseTime(dateString, timeString) {
        const [y, m, d] = dateString.split('-');
        const [hh, mm]  = timeString.split(':');
        return new Date(y, m - 1, d, hh, mm);
    },

    render() {
        const monthNames = ["January","February","March","April","May","June",
                            "July","August","September","October","November","December"];
        
        document.getElementById('currentMonth').textContent =
            `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
        
        const grid = document.getElementById('calendarGrid');
        grid.innerHTML = '';

        // Day headers
        ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(day => {
            const header = document.createElement('div');
            header.textContent = day;
            header.style.fontWeight = 'bold';
            grid.appendChild(header);
        });

        // Calculate dates
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const daysInMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0).getDate();
        const startDay = firstDay.getDay();

        // Empty cells before first day
        for (let i = 0; i < startDay; i++) {
            grid.appendChild(document.createElement('div'));
        }

        // Convert entries object into an array for easier iteration
        const entriesArray = Object.entries(this.entries);

        // Add actual days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;
            
            // Check overlap with any stored shift
            for (const [entryDateString, times] of entriesArray) {
                // Build the shift start/end as Date objects
                const shiftStart = this.parseTime(entryDateString, times.startTime);
                let shiftEnd = this.parseTime(entryDateString, times.endTime);
                
                // If shift crosses midnight, add 1 day to end
                if (shiftEnd <= shiftStart) {
                    shiftEnd.setDate(shiftEnd.getDate() + 1);
                }
                
                // If our calendar day is within that shift, mark it worked
                const stripped = this.stripTime(date);
                if (stripped >= this.stripTime(shiftStart) && stripped <= this.stripTime(shiftEnd)) {
                    dayElement.classList.add('worked');
                    break; // no need to check other entries
                }
            }
            
            // On click, open modal for that day
            dayElement.onclick = () => this.showModal(date);
            grid.appendChild(dayElement);
        }
    },

    showModal(date) {
        this.selectedDate = date;
        const modal = document.getElementById('timeEntryModal');
        document.getElementById('modalDate').textContent = date.toLocaleDateString();
        
        const existingEntry = this.entries[this.formatDate(date)];
        if (existingEntry) {
            document.getElementById('modalStartTime').value = existingEntry.startTime;
            document.getElementById('modalEndTime').value   = existingEntry.endTime;
        } else {
            // default times
            document.getElementById('modalStartTime').value = '19:00';
            document.getElementById('modalEndTime').value   = '05:00';
        }
        
        modal.style.display = 'block';
    },

    saveEntry() {
        if (!this.selectedDate) return;
        
        const dateKey = this.formatDate(this.selectedDate);
        this.entries[dateKey] = {
            startTime: document.getElementById('modalStartTime').value,
            endTime:   document.getElementById('modalEndTime').value
        };
        
        this.closeModal();
        this.render();
        saveData();
        this.selectedDate = null;
    },

    closeModal() {
        document.getElementById('timeEntryModal').style.display = 'none';
    },

    prevMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.render();
    },

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.render();
    }
};

// =======================
// Wage calculation
// =======================
function calculateWage() {
    const hourlyWage = parseFloat(document.getElementById('hourlyWage').value);
    // Gather boosters
    const boosters = Array.from(document.getElementsByClassName('booster')).map(booster => ({
        percent: parseFloat(booster.querySelector('.booster-percent').value),
        days: Array.from(booster.querySelectorAll('.day:checked')).map(c => parseInt(c.value)),
        startTime: booster.querySelector('.start-time').value,
        endTime: booster.querySelector('.end-time').value
    }));

    // Convert stored shifts to Date objects for calculation
    const timeEntries = Object.entries(calendar.entries).map(([dateString, times]) => {
        const [startH, startM] = times.startTime.split(':');
        const [endH, endM]   = times.endTime.split(':');

        const dateParts = dateString.split('-');
        const year  = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]) - 1; // zero-based
        const day   = parseInt(dateParts[2]);

        const start = new Date(year, month, day, parseInt(startH), parseInt(startM));
        let end   = new Date(year, month, day, parseInt(endH), parseInt(endM));

        if (end <= start) {
            // crosses midnight
            end.setDate(end.getDate() + 1);
        }

        return { start, end };
    });

    let totalWage = 0;
    let totalHours = 0;
    let boostDetails = [];

    // For each shift, calculate base hours plus any booster overlaps
    timeEntries.forEach(entry => {
        const duration = (entry.end - entry.start) / 1000 / 60 / 60; // hours
        totalHours += duration;

        let boostMultiplier = 0;
        boosters.forEach(booster => {
            const overlapHours = calculateOverlap(entry.start, entry.end, booster);
            if (overlapHours > 0) {
                boostMultiplier += (booster.percent / 100) * overlapHours;
                boostDetails.push({
                    percent: booster.percent,
                    hours: overlapHours.toFixed(2)
                });
            }
        });

        // total wage = base + boosted portion
        totalWage += hourlyWage * duration + hourlyWage * boostMultiplier;
    });

    const results = document.getElementById('results');
    results.innerHTML = `
        <p>Total Hours: ${totalHours.toFixed(2)}</p>
        <p>Base Wage: €${(hourlyWage * totalHours).toFixed(2)}</p>
        <p>Boosted Amount: €${(totalWage - hourlyWage * totalHours).toFixed(2)}</p>
        <h4>Total Wage: €${totalWage.toFixed(2)}</h4>
        ${
            boostDetails.length
            ? `<p>Boosts Applied: ${boostDetails.map(d => `${d.percent}% on ${d.hours}h`).join(', ')}</p>`
            : ''
        }
    `;

    // Calculate how many hours overlap between a shift and a booster’s day/time
    function calculateOverlap(workStart, workEnd, booster) {
        let totalHours = 0;
        let currentDay = new Date(workStart);

        while (currentDay < workEnd) {
            const dayOfWeek = currentDay.getDay();

            if (booster.days.includes(dayOfWeek)) {
                // For the booster day
                const [startH, startM] = booster.startTime.split(':');
                const [endH, endM]   = booster.endTime.split(':');
                
                let dayStart = new Date(currentDay);
                dayStart.setHours(parseInt(startH), parseInt(startM));

                let dayEnd = new Date(currentDay);
                dayEnd.setHours(parseInt(endH), parseInt(endM));
                if (dayEnd <= dayStart) {
                    // crosses midnight
                    dayEnd.setDate(dayEnd.getDate() + 1);
                }

                const overlapStart = new Date(Math.max(workStart, dayStart));
                const overlapEnd   = new Date(Math.min(workEnd, dayEnd));
                if (overlapStart < overlapEnd) {
                    totalHours += (overlapEnd - overlapStart) / 1000 / 60 / 60;
                }
            }

            // Move currentDay to next day, at 00:00
            currentDay.setDate(currentDay.getDate() + 1);
            currentDay.setHours(0, 0, 0, 0);
        }
        return totalHours;
    }
}

// =======================
// CSV Export (for current month)
// =======================
function exportCSV() {
    // Get current month/year from calendar
    const year = calendar.currentDate.getFullYear();
    const month = calendar.currentDate.getMonth(); // 0-based

    // We'll need the wage & boosters to calculate each entry's wage
    const baseWage = parseFloat(document.getElementById('hourlyWage').value);
    const boosters = Array.from(document.getElementsByClassName('booster')).map(booster => ({
        percent: parseFloat(booster.querySelector('.booster-percent').value),
        days: Array.from(booster.querySelectorAll('.day:checked')).map(c => parseInt(c.value)),
        startTime: booster.querySelector('.start-time').value,
        endTime: booster.querySelector('.end-time').value
    }));

    // Prepare CSV rows with headers
    // We'll add an extra column for "Wage (€)"
    const rows = [["Date", "Start Time", "End Time", "Duration (h)", "Wage (€)"]];

    let totalHours = 0;
    let totalWages = 0;

    // Loop over stored entries
    for (const [dateKey, times] of Object.entries(calendar.entries)) {
        // Parse the dateKey (yyyy-mm-dd)
        const [entryYear, entryMonth, entryDay] = dateKey.split('-').map(Number);

        // Check if it matches the current visible month/year
        // entryMonth is 1-based, so subtract 1 to compare with 'month'
        if (entryYear === year && (entryMonth - 1) === month) {
            // Build actual Date objects for start/end
            const start = calendar.parseTime(dateKey, times.startTime);
            let end = calendar.parseTime(dateKey, times.endTime);

            // Handle crossing midnight
            if (end <= start) {
                end.setDate(end.getDate() + 1);
            }

            // Calculate duration in hours
            const duration = (end - start) / (1000 * 60 * 60);

            // Calculate wage for this entry
            const shiftWage = calculateShiftWage(baseWage, boosters, start, end);

            // Keep track of totals
            totalHours += duration;
            totalWages += shiftWage;

            // Push row to CSV
            rows.push([
                dateKey,                // e.g. 2025-01-15
                times.startTime,        // e.g. 19:30
                times.endTime,          // e.g. 05:00
                duration.toFixed(2),
                shiftWage.toFixed(2)
            ]);
        }
    }

    // Add a blank line, then a "TOTAL" row
    rows.push([]);
    rows.push(["TOTAL", "", "", totalHours.toFixed(2), totalWages.toFixed(2)]);

    // Convert rows to CSV content
    const csvContent =
        "data:text/csv;charset=utf-8,"
        + rows.map(e => e.join(",")).join("\n");

    // Create a link, download the CSV
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    // Example filename: "shifts_1_2025.csv" for January 2025
    link.setAttribute("download", `shifts_${month+1}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Calculate the total wage for a single shift (including boosters)
function calculateShiftWage(baseWage, boosters, shiftStart, shiftEnd) {
    // Duration in hours
    const totalDuration = (shiftEnd - shiftStart) / (1000 * 60 * 60);
    let total = baseWage * totalDuration; // base wage portion

    // Add booster portion
    let boosterAmount = 0;
    boosters.forEach(booster => {
        const overlapHours = calculateOverlap(shiftStart, shiftEnd, booster);
        if (overlapHours > 0) {
            boosterAmount += baseWage * (booster.percent / 100) * overlapHours;
        }
    });

    return total + boosterAmount;
}
function calculateWageForCurrentMonth() {
    const hourlyWage = parseFloat(document.getElementById('hourlyWage').value);
    // Gather boosters
    const boosters = Array.from(document.getElementsByClassName('booster')).map(booster => ({
        percent: parseFloat(booster.querySelector('.booster-percent').value),
        days: Array.from(booster.querySelectorAll('.day:checked')).map(c => parseInt(c.value)),
        startTime: booster.querySelector('.start-time').value,
        endTime: booster.querySelector('.end-time').value
    }));

    // Identify current month/year in the calendar
    const currentYear = calendar.currentDate.getFullYear();
    const currentMonth = calendar.currentDate.getMonth(); // 0-based

    let totalHours = 0;
    let totalWage = 0;
    let boostDetails = [];

    // Iterate over each stored entry
    for (const [dateString, times] of Object.entries(calendar.entries)) {
        // Parse date key (e.g., "2025-01-15")
        const [yearStr, monthStr, dayStr] = dateString.split('-');
        const entryYear = parseInt(yearStr, 10);
        const entryMonth = parseInt(monthStr, 10) - 1; // months are 0-based
        const entryDay = parseInt(dayStr, 10);

        // Only process entries for the currently displayed month/year
        if (entryYear === currentYear && entryMonth === currentMonth) {
            // Build Date objects
            const [startH, startM] = times.startTime.split(':');
            const [endH, endM] = times.endTime.split(':');

            const start = new Date(entryYear, entryMonth, entryDay, parseInt(startH), parseInt(startM));
            let end = new Date(entryYear, entryMonth, entryDay, parseInt(endH), parseInt(endM));

            // If end <= start, crosses midnight
            if (end <= start) {
                end.setDate(end.getDate() + 1);
            }

            // Calculate duration in hours
            const duration = (end - start) / (1000 * 60 * 60);
            totalHours += duration;

            // Calculate booster overlap
            let boostMultiplier = 0;
            boosters.forEach(booster => {
                const overlapHours = calculateOverlap(start, end, booster);
                if (overlapHours > 0) {
                    boostMultiplier += (booster.percent / 100) * overlapHours;
                    boostDetails.push({
                        date: dateString,
                        percent: booster.percent,
                        hours: overlapHours.toFixed(2)
                    });
                }
            });

            // Add base wage + booster portion
            totalWage += hourlyWage * duration + hourlyWage * boostMultiplier;
        }
    }

    // Display results in the same element
    const results = document.getElementById('results');
    results.innerHTML = `
        <p><strong>Current Month (${currentMonth + 1}/${currentYear})</strong></p>
        <p>Total Hours: ${totalHours.toFixed(2)}</p>
        <p>Base Wage: €${(hourlyWage * totalHours).toFixed(2)}</p>
        <p>Boosted Amount: €${(totalWage - hourlyWage * totalHours).toFixed(2)}</p>
        <h4>Total Wage: €${totalWage.toFixed(2)}</h4>
        ${
            boostDetails.length
                ? `<p>Boosts Applied: ${boostDetails
                    .map(d => `${d.percent}% on ${d.hours}h (entry ${d.date})`)
                    .join(', ')}</p>`
                : ''
        }
    `;
}
// Same overlap logic used in the main wage calculation
function calculateOverlap(workStart, workEnd, booster) {
    let totalHours = 0;
    let currentDay = new Date(workStart);

    while (currentDay < workEnd) {
        const dayOfWeek = currentDay.getDay();

        if (booster.days.includes(dayOfWeek)) {
            // For the booster day
            const [startH, startM] = booster.startTime.split(':');
            const [endH, endM]   = booster.endTime.split(':');
            
            let dayStart = new Date(currentDay);
            dayStart.setHours(parseInt(startH), parseInt(startM));

            let dayEnd = new Date(currentDay);
            dayEnd.setHours(parseInt(endH), parseInt(endM));
            if (dayEnd <= dayStart) {
                // crosses midnight
                dayEnd.setDate(dayEnd.getDate() + 1);
            }

            const overlapStart = new Date(Math.max(workStart, dayStart));
            const overlapEnd   = new Date(Math.min(workEnd, dayEnd));
            if (overlapStart < overlapEnd) {
                totalHours += (overlapEnd - overlapStart) / 1000 / 60 / 60;
            }
        }

        // Move currentDay to next day, at 00:00
        currentDay.setDate(currentDay.getDate() + 1);
        currentDay.setHours(0, 0, 0, 0);
    }
    return totalHours;
}

// =======================
// Remove booster handler
// =======================
document.body.addEventListener('click', function(e) {
    if (e.target.matches('button') && e.target.textContent === 'Remove') {
        e.target.parentElement.remove();
        saveData();
    }
});