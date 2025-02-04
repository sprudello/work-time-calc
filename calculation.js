// calculation.js - Contains wage calculations and CSV export functions

/**
 * Calculates the number of overlapping hours between a work shift and a booster’s active time.
 * @param {Date} workStart 
 * @param {Date} workEnd 
 * @param {object} booster 
 * @returns {number} Overlap hours
 */
export function calculateOverlap(workStart, workEnd, booster) {
  let totalHours = 0;
  let currentDay = new Date(workStart);

  while (currentDay < workEnd) {
    const dayOfWeek = currentDay.getDay();
    if (booster.days.includes(dayOfWeek)) {
      const [startH, startM] = booster.startTime.split(':');
      const [endH, endM] = booster.endTime.split(':');

      let dayStart = new Date(currentDay);
      dayStart.setHours(parseInt(startH), parseInt(startM));
      let dayEnd = new Date(currentDay);
      dayEnd.setHours(parseInt(endH), parseInt(endM));
      if (dayEnd <= dayStart) {
        dayEnd.setDate(dayEnd.getDate() + 1);
      }

      const overlapStart = new Date(Math.max(workStart, dayStart));
      const overlapEnd = new Date(Math.min(workEnd, dayEnd));
      if (overlapStart < overlapEnd) {
        totalHours += (overlapEnd - overlapStart) / (1000 * 60 * 60);
      }
    }
    currentDay.setDate(currentDay.getDate() + 1);
    currentDay.setHours(0, 0, 0, 0);
  }
  return totalHours;
}

/**
 * Helper function to calculate wage for a single shift.
 * @param {number} baseWage 
 * @param {Array} boosters 
 * @param {Date} shiftStart 
 * @param {Date} shiftEnd 
 * @returns {number} Total wage for the shift
 */
function calculateShiftWage(baseWage, boosters, shiftStart, shiftEnd) {
  const totalDuration = (shiftEnd - shiftStart) / (1000 * 60 * 60);
  let total = baseWage * totalDuration;
  let boosterAmount = 0;
  boosters.forEach(booster => {
    const overlapHours = calculateOverlap(shiftStart, shiftEnd, booster);
    if (overlapHours > 0) {
      boosterAmount += baseWage * (booster.percent / 100) * overlapHours;
    }
  });
  return total + boosterAmount;
}

/**
 * Calculates the total wage from all work entries.
 */
export function calculateWage() {
  const hourlyWage = parseFloat(document.getElementById('hourlyWage').value);
  const boosterElements = Array.from(document.getElementsByClassName('booster'));
  const boosters = boosterElements.map(booster => ({
    percent: parseFloat(booster.querySelector('.booster-percent').value),
    days: Array.from(booster.querySelectorAll('.day:checked')).map(c => parseInt(c.value)),
    startTime: booster.querySelector('.start-time').value,
    endTime: booster.querySelector('.end-time').value,
  }));

  const timeEntries = Object.entries(window.calendar.entries).map(([dateString, times]) => {
    const [startH, startM] = times.startTime.split(':');
    const [endH, endM] = times.endTime.split(':');
    const [year, month, day] = dateString.split('-').map(Number);
    const start = new Date(year, month - 1, day, parseInt(startH), parseInt(startM));
    let end = new Date(year, month - 1, day, parseInt(endH), parseInt(endM));
    if (end <= start) {
      end.setDate(end.getDate() + 1);
    }
    return { start, end };
  });

  let totalWage = 0;
  let totalHours = 0;
  let boostDetails = [];

  timeEntries.forEach(entry => {
    const duration = (entry.end - entry.start) / (1000 * 60 * 60);
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
    totalWage += hourlyWage * duration + hourlyWage * boostMultiplier;
  });

  const results = document.getElementById('results');
  results.innerHTML = `
    <p>Total Hours: ${totalHours.toFixed(2)}</p>
    <p>Base Wage: €${(hourlyWage * totalHours).toFixed(2)}</p>
    <p>Boosted Amount: €${(totalWage - hourlyWage * totalHours).toFixed(2)}</p>
    <h4>Total Wage: €${totalWage.toFixed(2)}</h4>
    ${ boostDetails.length ? `<p>Boosts Applied: ${boostDetails.map(d => `${d.percent}% on ${d.hours}h`).join(', ')}</p>` : '' }
  `;
}

/**
 * Calculates the wage for work entries in the current month.
 */
export function calculateWageForCurrentMonth() {
  const hourlyWage = parseFloat(document.getElementById('hourlyWage').value);
  const boosterElements = Array.from(document.getElementsByClassName('booster'));
  const boosters = boosterElements.map(booster => ({
    percent: parseFloat(booster.querySelector('.booster-percent').value),
    days: Array.from(booster.querySelectorAll('.day:checked')).map(c => parseInt(c.value)),
    startTime: booster.querySelector('.start-time').value,
    endTime: booster.querySelector('.end-time').value,
  }));

  const currentYear = window.calendar.currentDate.getFullYear();
  const currentMonth = window.calendar.currentDate.getMonth();

  let totalHours = 0;
  let totalWage = 0;
  let boostDetails = [];

  for (const [dateString, times] of Object.entries(window.calendar.entries)) {
    const [yearStr, monthStr, dayStr] = dateString.split('-');
    const entryYear = parseInt(yearStr, 10);
    const entryMonth = parseInt(monthStr, 10) - 1;
    if (entryYear === currentYear && entryMonth === currentMonth) {
      const [startH, startM] = times.startTime.split(':');
      const [endH, endM] = times.endTime.split(':');
      const start = new Date(entryYear, entryMonth, parseInt(dayStr), parseInt(startH), parseInt(startM));
      let end = new Date(entryYear, entryMonth, parseInt(dayStr), parseInt(endH), parseInt(endM));
      if (end <= start) {
        end.setDate(end.getDate() + 1);
      }
      const duration = (end - start) / (1000 * 60 * 60);
      totalHours += duration;
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
      totalWage += hourlyWage * duration + hourlyWage * boostMultiplier;
    }
  }

  const results = document.getElementById('results');
  results.innerHTML = `
    <p><strong>Current Month (${currentMonth + 1}/${currentYear})</strong></p>
    <p>Total Hours: ${totalHours.toFixed(2)}</p>
    <p>Base Wage: €${(hourlyWage * totalHours).toFixed(2)}</p>
    <p>Boosted Amount: €${(totalWage - hourlyWage * totalHours).toFixed(2)}</p>
    <h4>Total Wage: €${totalWage.toFixed(2)}</h4>
    ${ boostDetails.length ? `<p>Boosts Applied: ${boostDetails.map(d => `${d.percent}% on ${d.hours}h (entry ${d.date})`).join(', ')}</p>` : '' }
  `;
}

/**
 * Exports the current month's work entries as a CSV file.
 */
export function exportCSV() {
  const year = window.calendar.currentDate.getFullYear();
  const month = window.calendar.currentDate.getMonth();
  const baseWage = parseFloat(document.getElementById('hourlyWage').value);
  const boosterElements = Array.from(document.getElementsByClassName('booster'));
  const boosters = boosterElements.map(booster => ({
    percent: parseFloat(booster.querySelector('.booster-percent').value),
    days: Array.from(booster.querySelectorAll('.day:checked')).map(c => parseInt(c.value)),
    startTime: booster.querySelector('.start-time').value,
    endTime: booster.querySelector('.end-time').value,
  }));

  const rows = [["Date", "Start Time", "End Time", "Duration (h)", "Wage (€)"]];
  let totalHours = 0;
  let totalWages = 0;

  for (const [dateKey, times] of Object.entries(window.calendar.entries)) {
    const [entryYear, entryMonth, entryDay] = dateKey.split('-').map(Number);
    if (entryYear === year && (entryMonth - 1) === month) {
      const start = window.calendar.parseTime(dateKey, times.startTime);
      let end = window.calendar.parseTime(dateKey, times.endTime);
      if (end <= start) {
        end.setDate(end.getDate() + 1);
      }
      const duration = (end - start) / (1000 * 60 * 60);
      const shiftWage = calculateShiftWage(baseWage, boosters, start, end);
      totalHours += duration;
      totalWages += shiftWage;
      rows.push([
        dateKey,
        times.startTime,
        times.endTime,
        duration.toFixed(2),
        shiftWage.toFixed(2)
      ]);
    }
  }

  rows.push([]);
  rows.push(["TOTAL", "", "", totalHours.toFixed(2), totalWages.toFixed(2)]);

  const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `shifts_${month+1}_${year}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
