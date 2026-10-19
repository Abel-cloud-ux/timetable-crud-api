// The page is served by the same server, so a relative address works
const API_URL = "/api/timetable";

const form = document.getElementById("timetable-form");
const tableBody = document.getElementById("table-body");
const message = document.getElementById("message");
const saveBtn = document.getElementById("save-btn");
const cancelBtn = document.getElementById("cancel-btn");
const recordId = document.getElementById("record-id");

const FIELDS = ["course_code", "course_name", "lecturer", "day_of_week",
                "start_time", "end_time", "venue", "goal"];

// Show a short message to the user
function showMessage(text, isError) {
  message.textContent = text;
  message.style.color = isError ? "#b00020" : "#2e7d32";
}

// Load all records from the API and show them in the table
async function loadRecords() {
  try {
    const response = await fetch(API_URL);
    const records = await response.json();
    tableBody.textContent = "";

    if (records.length === 0) {
      const row = tableBody.insertRow();
      const cell = row.insertCell();
      cell.colSpan = 10;
      cell.textContent = "No records yet.";
      return;
    }

    records.forEach(record => {
      const row = tableBody.insertRow();
      row.insertCell().textContent = record.id;
      FIELDS.forEach(field => {
        row.insertCell().textContent = record[field] || "";
      });

      // Edit and Delete buttons
      const actionsCell = row.insertCell();

      const editBtn = document.createElement("button");
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", () => startEdit(record));

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.className = "delete";
      deleteBtn.addEventListener("click", () => deleteRecord(record.id));

      actionsCell.append(editBtn, " ", deleteBtn);
    });
  } catch (error) {
    showMessage("Could not load records: " + error.message, true);
  }
}

// Collect the form values into an object
function getFormData() {
  const data = {};
  FIELDS.forEach(field => {
    data[field] = document.getElementById(field).value.trim();
  });
  return data;
}

// Create (POST) or update (PUT) when the form is submitted
form.addEventListener("submit", async function (event) {
  event.preventDefault();
  const data = getFormData();

  if (data.course_code === "") {
    showMessage("Course code is required.", true);
    return;
  }

  const isEditing = recordId.value !== "";
  const url = isEditing ? API_URL + "/" + recordId.value : API_URL;
  const method = isEditing ? "PUT" : "POST";

  try {
    const response = await fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await response.json();

    if (!response.ok) {
      showMessage(result.error || "Something went wrong.", true);
      return;
    }

    showMessage(isEditing ? "Record updated." : "Record added.", false);
    resetForm();
    loadRecords();
  } catch (error) {
    showMessage("Request failed: " + error.message, true);
  }
});

// Put a record's values into the form for editing
function startEdit(record) {
  recordId.value = record.id;
  FIELDS.forEach(field => {
    document.getElementById(field).value = record[field] || "";
  });
  saveBtn.textContent = "Save Changes";
  cancelBtn.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Delete a record after confirming
async function deleteRecord(id) {
  if (!confirm("Delete this record?")) return;
  try {
    const response = await fetch(API_URL + "/" + id, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) {
      showMessage(result.error || "Could not delete.", true);
      return;
    }
    showMessage("Record deleted.", false);
    loadRecords();
  } catch (error) {
    showMessage("Request failed: " + error.message, true);
  }
}

// Clear the form and go back to "add" mode
function resetForm() {
  form.reset();
  recordId.value = "";
  saveBtn.textContent = "Add Record";
  cancelBtn.hidden = true;
}

cancelBtn.addEventListener("click", resetForm);

// Load the records when the page opens
loadRecords();