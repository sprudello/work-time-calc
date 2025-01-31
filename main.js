// Update the DOMContentLoaded listener
document.addEventListener('DOMContentLoaded', () => {
    // Load existing data
    loadData();
    
    // Set up autosave
    document.getElementById('hourlyWage').addEventListener('input', saveData);
    document.getElementById('boostersContainer').addEventListener('input', saveData);
    document.getElementById('timeEntriesContainer').addEventListener('input', saveData);
    
    // Add periodic saving as extra protection
    setInterval(saveData, 5000); // Save every 5 seconds
});


// Storage functions (replace cookie code with this)
function saveData() {
    const data = {
        hourlyWage: document.getElementById('hourlyWage').value,
        boosters: Array.from(document.getElementsByClassName('booster')).map(booster => ({
            percent: booster.querySelector('.booster-percent').value,
            days: Array.from(booster.querySelectorAll('.day:checked')).map(c => c.value),
            startTime: booster.querySelector('.start-time').value,
            endTime: booster.querySelector('.end-time').value
        })),
        timeEntries: Array.from(document.getElementsByClassName('time-entry')).map(entry => ({
            date: entry.querySelector('.entry-date').value,
            startTime: entry.querySelector('.start-time').value,
            endTime: entry.querySelector('.end-time').value
        }))
    };
    
    localStorage.setItem('shiftData', JSON.stringify(data));
}

function loadData() {
    const savedData = localStorage.getItem('shiftData');
    if (!savedData) return;
    
    try {
        const data = JSON.parse(savedData);

        // Clear existing entries
        document.getElementById('boostersContainer').innerHTML = '';
        document.getElementById('timeEntriesContainer').innerHTML = '';

        // Load hourly wage
        document.getElementById('hourlyWage').value = data.hourlyWage || 15;

        // Load boosters
        const boosterTemplate = document.getElementById('boosterTemplate');
        data.boosters.forEach(boosterData => {
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

        // Load time entries
        const timeEntryTemplate = document.getElementById('timeEntryTemplate');
        data.timeEntries.forEach(entryData => {
            const clone = timeEntryTemplate.content.cloneNode(true);
            const entry = clone.querySelector('.time-entry');
            entry.querySelector('.entry-date').value = entryData.date;
            entry.querySelector('.start-time').value = entryData.startTime;
            entry.querySelector('.end-time').value = entryData.endTime;
            document.getElementById('timeEntriesContainer').appendChild(clone);
        });
    } catch (e) {
        console.error('Error loading saved data:', e);
    }
}


// Modified functions to auto-save
function addBooster() {
    const template = document.getElementById('boosterTemplate');
    const clone = template.content.cloneNode(true);
    document.getElementById('boostersContainer').appendChild(clone);
    saveData();
}

function addTimeEntry() {
    const template = document.getElementById('timeEntryTemplate');
    const clone = template.content.cloneNode(true);
    document.getElementById('timeEntriesContainer').appendChild(clone);
    saveData();
}

// Add event listeners for inputs
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('hourlyWage').addEventListener('input', saveData);
    document.getElementById('boostersContainer').addEventListener('input', saveData);
    document.getElementById('timeEntriesContainer').addEventListener('input', saveData);
});

// Modified remove functionality
document.body.addEventListener('click', function(e) {
    if (e.target.matches('button') && e.target.textContent === 'Remove') {
        e.target.parentElement.remove();
        saveData();
    }
});


function calculateWage() {
    try{
    const hourlyWage = parseFloat(document.getElementById('hourlyWage').value);
    const boosters = Array.from(document.getElementsByClassName('booster')).map(booster => ({
        percent: parseFloat(booster.querySelector('.booster-percent').value),
        days: Array.from(booster.querySelectorAll('.day:checked')).map(c => parseInt(c.value)),
        startTime: booster.querySelector('.start-time').value,
        endTime: booster.querySelector('.end-time').value
    }));

    const timeEntries = Array.from(document.getElementsByClassName('time-entry')).map(entry => {
        const date = new Date(entry.querySelector('.entry-date').value);
        const startTime = entry.querySelector('.start-time').value;
        const endTime = entry.querySelector('.end-time').value;

        const start = new Date(date);
        const [startH, startM] = startTime.split(':');
        start.setHours(parseInt(startH), parseInt(startM));

        const end = new Date(date);
        const [endH, endM] = endTime.split(':');
        end.setHours(parseInt(endH), parseInt(endM));
        if (end <= start) end.setDate(end.getDate() + 1);

        return { start, end };
    });

    let totalWage = 0;
    let totalHours = 0;
    let boostDetails = [];

    timeEntries.forEach(entry => {
        const duration = (entry.end - entry.start) / 1000 / 60 / 60;
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
        <p>Base Wage: $${(hourlyWage * totalHours).toFixed(2)}</p>
        <p>Boosted Amount: $${(totalWage - hourlyWage * totalHours).toFixed(2)}</p>
        <h4>Total Wage: $${totalWage.toFixed(2)}</h4>
        <p>Boosts Applied: ${boostDetails.map(d => `${d.percent}% on ${d.hours}h`).join(', ')}</p>
    `;
    } 
    catch (error) {
    console.error('Calculation error:', error);
    document.getElementById('results').innerHTML = `
        <p style="color: red">Error in calculation: ${error.message}</p>
    `;
}
}
function calculateOverlap(workStart, workEnd, booster) {
    let totalHours = 0;
    const currentDay = new Date(workStart);
    
    while (currentDay <= workEnd) {
        const dayOfWeek = currentDay.getDay();
        if (booster.days.includes(dayOfWeek)) {
            const dayStart = new Date(currentDay);
            const dayEnd = new Date(currentDay);
            
            const [startH, startM] = booster.startTime.split(':');
            const [endH, endM] = booster.endTime.split(':');
            
            dayStart.setHours(parseInt(startH), parseInt(startM));
            dayEnd.setHours(parseInt(endH), parseInt(endM));
            
            // Handle overnight boosters
            if (dayEnd < dayStart) dayEnd.setDate(dayEnd.getDate() + 1);

            const overlapStart = new Date(Math.max(workStart, dayStart));
            const overlapEnd = new Date(Math.min(workEnd, dayEnd));

            if (overlapStart < overlapEnd) {
                totalHours += (overlapEnd - overlapStart) / 1000 / 60 / 60;
            }
        }
        // Move to next day
        currentDay.setDate(currentDay.getDate() + 1);
        currentDay.setHours(0, 0, 0, 0);
    }
    return totalHours;
}