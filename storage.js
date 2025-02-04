// storage.js - Handles saving to and loading from localStorage

/**
 * Saves wage, global boosters, and calendar entries to localStorage.
 */
export function saveData() {
  const hourlyWageEl = document.getElementById('hourlyWage');
  const boostersContainer = document.getElementById('boostersContainer');
  const boosterElements = Array.from(boostersContainer.getElementsByClassName('booster'));

  const boosters = boosterElements.map(booster => ({
    percent: booster.querySelector('.booster-percent').value,
    days: Array.from(booster.querySelectorAll('.day:checked')).map(c => c.value),
    startTime: booster.querySelector('.start-time').value,
    endTime: booster.querySelector('.end-time').value
  }));

  const data = {
    hourlyWage: hourlyWageEl.value,
    boosters,
    timeEntries: window.calendar ? window.calendar.entries : {}
  };

  localStorage.setItem('shiftData', JSON.stringify(data));
}

/**
 * Loads saved data from localStorage and updates the UI.
 */
export function loadData() {
  const savedData = localStorage.getItem('shiftData');
  if (!savedData) return;

  try {
    const data = JSON.parse(savedData);
    document.getElementById('hourlyWage').value = data.hourlyWage || 15;

    const boostersContainer = document.getElementById('boostersContainer');
    boostersContainer.innerHTML = '';
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
      boostersContainer.appendChild(clone);
    });

    if (window.calendar) {
      window.calendar.entries = data.timeEntries || {};
      window.calendar.render();
    }
  } catch (e) {
    console.error('Error loading saved data:', e);
  }
}
