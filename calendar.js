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

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Company Special Events
const companyEvents = {
    "2025-03-15": "Company Annual Meeting",
    "2025-04-01": "New Product Launch",
    "2025-05-10": "Employee Appreciation Day"
};

const renderCalendar = () => {
    let firstDayofMonth = new Date(currYear, currMonth, 1).getDay(), //getting first day of month
    lastDateofMonth = new Date(currYear, currMonth + 1, 0).getDate(), // Last date of Month
    lastDayofMonth = new Date(currYear, currMonth, lastDateofMonth).getDay(), // Last day of month
    lastDateofLastMonth = new Date(currYear, currMonth, 0).getDate(); // Last date of Previous Month
    let liTag = "";

    for(let i = firstDayofMonth; i > 0; i--){
        liTag += `<li class="inactive">${lastDateofLastMonth -i + 1}</li>`;
    }

    for(let i = 1; i <= lastDateofMonth; i++){
        let isToday = i === date.getDate() && currMonth === new Date().getMonth() && currYear === new Date().getFullYear() ? "active" : "";
        liTag += `<li class="${isToday}">${i}</li>`;
    }

    for(let i = lastDayofMonth; i < 6; i++ ){
        liTag += `<li class="inactive">${i - lastDayofMonth + 1}</li>`;

    }

    currentDate.innerText = `${months[currMonth]} ${currYear}`;
    daysTags.innerHTML = liTag;
}

renderCalendar();

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
        let listItem = document.createElement("li");
        listItem.innerHTML = `<strong>${date}</strong>: ${allEvents[date]}`;
        eventContainer.appendChild(listItem);
    });
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
    })
})