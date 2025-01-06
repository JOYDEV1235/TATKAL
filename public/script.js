const API_URL = "/api";

document.addEventListener("DOMContentLoaded", () => {
  // Set minimum date to today
  const dateInput = document.getElementById("date");
  const today = new Date().toISOString().split("T")[0];
  dateInput.min = today;

  // Initialize form
  const form = document.querySelector("form");
  form.addEventListener("submit", handleSubmit);

  // Initialize dynamic passenger rows
  initializePassengerRows();

  // Load existing bookings
  loadBookings();
});

function initializePassengerRows() {
  const tbody = document.querySelector("tbody");
  const addPassengerBtn = document.createElement("button");
  addPassengerBtn.textContent = "Add Passenger";
  addPassengerBtn.className = "search-button";
  addPassengerBtn.style.marginBottom = "20px";
  
  // Insert button before the table
  const table = document.querySelector("table");
  table.parentNode.insertBefore(addPassengerBtn, table);

  // Clear existing static rows
  tbody.innerHTML = '';
  
  // Add initial passenger row
  addPassengerRow(tbody, 1);

  addPassengerBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const nextIndex = tbody.children.length + 1;
    if (nextIndex <= 6) { // Maximum 6 passengers
      addPassengerRow(tbody, nextIndex);
    } else {
      showNotification("Maximum 6 passengers allowed", "error");
    }
  });
}

function addPassengerRow(tbody, index) {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${index}</td>
    <td><input type="text" name="name${index}" required /></td>
    <td><input type="number" name="age${index}" required min="1" max="120" /></td>
    <td>
      <select name="sex${index}" required>
        <option value="">Select</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
      </select>
    </td>
    <td>
      <select name="berth${index}" required>
        <option value="">Select</option>
        <option value="upper">Upper</option>
        <option value="middle">Middle</option>
        <option value="lower">Lower</option>
        <option value="side-upper">Side Upper</option>
        <option value="side-lower">Side Lower</option>
      </select>
    </td>
    <td>
      <select name="food${index}" required>
        <option value="no-food">No Food</option>
        <option value="veg">Veg</option>
        <option value="non-veg">Non Veg</option>
      </select>
    </td>
    <td>
      <select name="nationality${index}" required>
        <option value="indian">Indian</option>
        <option value="non-indian">Non-Indian</option>
      </select>
    </td>
    <td><input type="text" name="passport${index}" /></td>
    <td><input type="checkbox" name="child${index}" /></td>
    <td><input type="checkbox" name="senior${index}" /></td>
    <td><input type="checkbox" name="bed${index}" /></td>
    <td>
      <button type="button" class="remove-passenger" style="background: #f44336; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
        Remove
      </button>
    </td>
  `;

  // Add remove functionality
  const removeBtn = row.querySelector(".remove-passenger");
  removeBtn.addEventListener("click", () => {
    if (tbody.children.length > 1) {
      row.remove();
      // Reindex remaining rows
      Array.from(tbody.children).forEach((row, idx) => {
        row.firstElementChild.textContent = idx + 1;
      });
    } else {
      showNotification("At least one passenger is required", "error");
    }
  });

  tbody.appendChild(row);
}

async function handleSubmit(e) {
    e.preventDefault();
  
    try {
      const formData = new FormData(e.target);
      const passengers = [];
  
      // Collect passenger data
      const rows = document.querySelectorAll("tbody tr");
      rows.forEach((row, index) => {
        const passengerIndex = index + 1;
        if (row.querySelector(`[name="name${passengerIndex}"]`).value) {
          const passenger = {
            name: formData.get(`name${passengerIndex}`),
            age: parseInt(formData.get(`age${passengerIndex}`)),
            sex: formData.get(`sex${passengerIndex}`),
            berth: formData.get(`berth${passengerIndex}`),
            food: formData.get(`food${passengerIndex}`),
            nationality: formData.get(`nationality${passengerIndex}`),
            passportNo: formData.get(`passport${passengerIndex}`),
            isChild: formData.get(`child${passengerIndex}`) === 'on',
            isSenior: formData.get(`senior${passengerIndex}`) === 'on',
            needsBed: formData.get(`bed${passengerIndex}`) === 'on'
          };
          passengers.push(passenger);
        }
      });
  
      // Add passengers array to formData
      formData.set('passengers', JSON.stringify(passengers));
      // Make the API call
      const response = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        body: formData // Send formData directly - don't stringify or set Content-Type
      });
  
      const result = await response.json();
  
      if (result.success) {
        showNotification("Booking submitted successfully!", "success");
        e.target.reset();
        loadBookings();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      showNotification(error.message, "error");
    }
  }

function showNotification(message, type) {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

async function loadBookings() {
    try {
      const response = await fetch(`${API_URL}/bookings`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
  
      const bookings = result.bookings;
      const bookingsList = document.createElement("div");
      bookingsList.className = "bookings-list";
  
      bookings.forEach((booking) => {
        const bookingCard = createBookingCard(booking);
        bookingsList.appendChild(bookingCard);
      });
  
      const existingList = document.querySelector(".bookings-list");
      if (existingList) {
        existingList.replaceWith(bookingsList);
      } else {
        document.querySelector(".container").appendChild(bookingsList);
      }
    } catch (error) {
      showNotification("Error loading bookings: " + error.message, "error");
    }
  }

function createBookingCard(booking) {
  const card = document.createElement("div");
  card.className = "booking-card";

  const status = document.createElement("div");
  status.className = `status ${booking.status}`;
  status.textContent = booking.status.toUpperCase();

  const details = document.createElement("div");
  details.className = "booking-details";
  details.innerHTML = `
    <h3>${booking.from} → ${booking.to}</h3>
    <p>Date: ${new Date(booking.journeyDate).toLocaleDateString()}</p>
    <p>Train: ${booking.trainNo}</p>
    <p>Class: ${booking.class}</p>
    <p>Passengers: ${booking.passengers.length}</p>
  `;

  card.appendChild(status);
  card.appendChild(details);

  return card;
}