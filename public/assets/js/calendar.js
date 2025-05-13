const currentDate = document.querySelector(".current-date"),
daysTags = document.querySelector(".days"),
prevNextIcon = document.querySelectorAll(".icons span"),
eventInput = document.getElementById("event-name"),
addEventButton = document.getElementById("add-event"),
eventContainer = document.getElementById("event-container");

//Getting a new date, current year and month
let date = new Date(),
currYear = date.getFullYear(),
currMonth = date.getMonth(),
selectedDate = null;

let selectedDates = null;

// Open event modal
function openEventModal(date) {
    selectedDates = date;
    const inputField = document.getElementById("event-name");
    inputField.value = events[date] || "";
    inputField.placeholder = 'Add event for ${date}';
    document.getElementById("event-modal").style.display = "block";
    
}

// Close event modal
function closeEventModal() {
    document.getElementById("event-modal").style.display = "none";
}

// Save event
function saveEvent() {
    const eventInput = document.getElementById("event-name").value.trim();
    if (eventInput) {
        events[selectedDates] = eventInput;
        localStorage.setItem("events", JSON.stringify(events));
        closeEventModal();
        renderCalendar();
    }
}

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Company Special Events
const companyEvents = {
    " ": " "
};

const events = JSON.parse(localStorage.getItem("events")) || {};

const renderCalendar = () => {
    let firstDayofMonth = new Date(currYear, currMonth, 1).getDay(),
        lastDateofMonth = new Date(currYear, currMonth + 1, 0).getDate(),
        lastDayofMonth = new Date(currYear, currMonth, lastDateofMonth).getDay(),
        lastDateofLastMonth = new Date(currYear, currMonth, 0).getDate();
    
    let liTag = "";

    for (let i = firstDayofMonth; i > 0; i--) {
        liTag += `<li class="inactive">${lastDateofLastMonth - i + 1}</li>`;
    }

    for (let i = 1; i <= lastDateofMonth; i++) {
        let dateKey = `${currYear}-${currMonth + 1}-${i}`;
        let hasEvent = events[dateKey] ? "event" : "";
        let isToday = i === date.getDate() && currMonth === new Date().getMonth() && currYear === new Date().getFullYear() ? "active" : "";
        liTag += `<li class="${isToday} ${hasEvent}" data-date="${dateKey}" onclick="openEventModal('${dateKey}')">${i}</li>`;
    }

    for (let i = lastDayofMonth; i < 6; i++) {
        liTag += `<li class="inactive">${i - lastDayofMonth + 1}</li>`;
    }

    currentDate.innerText = `${months[currMonth]} ${currYear}`;
    daysTags.innerHTML = liTag;
    displayEvents();
};

renderCalendar();
displayEvents();

// Function to select a date
function selectDate(event) {
    selectedDate = event.target.dataset.date;
    if (selectedDate) {
        eventInput.placeholder = `Add event for ${selectedDate}`;
    }
}

// Function to add event
function addEvent() {
    if (selectedDate && eventInput.value.trim() !== "") {
        events[selectedDate] = eventInput.value;
        localStorage.setItem("events", JSON.stringify(events));
        eventInput.value = "";
        renderCalendar();
        displayEvents();
    }
}

// Function to display events
function displayEvents() {
    eventContainer.innerHTML = "";
    let allEvents = { ...companyEvents, ...events };

    Object.keys(allEvents).sort().forEach(date => {
        const isUserEvent = events.hasOwnProperty(date);
        let listItem = document.createElement("li");
        listItem.innerHTML = `
            <strong>${date}</strong>: ${allEvents[date]}
            ${isUserEvent ? `<button onclick="removeEvent('${date}')" style="margin-left:10px; color: black;">Delete</button>` : ''}
        `;
        eventContainer.appendChild(listItem);
    });
}

function removeEvent(dateKey){
    if(events[dateKey] && confirm('Remove event for ${dataKey?}')){
        delete events[dateKey];
        localStorage.setItem("events", JSON.stringify(events));
        renderCalendar();
        displayEvents();
    }
}

function theEvents() {
    const eventInputVal = document.getElementById("event-name").value.trim();
    if(eventInputVal){
        localStorage.setItem("events", JSON.stringify(events));
        closeEventModal();
        renderCalendar();
        displayEvents();
    }
}



// Event Listeners
addEventButton.addEventListener("click", addEvent);
prevNextIcon.forEach(icon =>{
    icon.addEventListener("click", () =>{ // adding click event on both icons
        currMonth = icon.id == "prev" ? currMonth - 1 : currMonth + 1; // For going month to next one and previous month

        if (currMonth < 0 || currMonth > 11){
            date = new Date(currYear, currMonth);
            currYear = date.getFullYear();
            currMonth = date.getMonth();
        } else{
            date = new Date();
        }
        renderCalendar();
        theEvents();
    })
})