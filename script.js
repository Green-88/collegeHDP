const loginPage = document.getElementById("loginPage");
const studentSection = document.getElementById("studentSection");
const staffSection = document.getElementById("staffSection");
const notificationArea = document.getElementById("notificationArea");

let tickets = [];
let loggedInUser = { role: "", email: "" };
let currentFile = null;

// Load tickets from localStorage
function loadTickets() {
  const savedTickets = localStorage.getItem("tickets");
  tickets = savedTickets ? JSON.parse(savedTickets) : [];
  updateStats();
}

// Save tickets to localStorage
function saveTickets() {
  localStorage.setItem("tickets", JSON.stringify(tickets));
  if (loggedInUser.role) {
    localStorage.setItem('lastRole', loggedInUser.role);
  }
  updateStats();
}

// Update statistics
function updateStats() {
  const total = tickets.length;
  const pending = tickets.filter(t => t.status === "Pending").length;
  const solved = tickets.filter(t => t.status === "Solved").length;
  
  const totalElement = document.getElementById("totalTickets");
  const pendingElement = document.getElementById("pendingTickets");
  const solvedElement = document.getElementById("solvedTickets");
  
  if (totalElement) totalElement.textContent = total;
  if (pendingElement) pendingElement.textContent = pending;
  if (solvedElement) solvedElement.textContent = solved;
}

// User credentials (CHANGE THESE IN PRODUCTION!)
const users = {
  student: { username: "user123", password: "changeMe123!" },
  staff: { username: "admin456", password: "securePass789!" }
};

// Validation functions
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `alert ${type}`;
  notification.textContent = message;
  notification.style.position = 'fixed';
  notification.style.top = '20px';
  notification.style.right = '20px';
  notification.style.zIndex = '1000';
  notification.style.padding = '15px';
  notification.style.borderRadius = '6px';
  notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
  
  if (type === 'success') {
    notification.style.background = '#d4edda';
    notification.style.color = '#155724';
    notification.style.border = '1px solid #c3e6cb';
  } else if (type === 'error') {
    notification.style.background = '#f8d7da';
    notification.style.color = '#721c24';
    notification.style.border = '1px solid #f5c6cb';
  } else if (type === 'warning') {
    notification.style.background = '#fff3cd';
    notification.style.color = '#856404';
    notification.style.border = '1px solid #ffeaa7';
  }
  
  notificationArea.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// File handling functions
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileIcon(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const icons = {
    pdf: '📕',
    jpg: '🖼️',
    jpeg: '🖼️',
    png: '🖼️',
    gif: '🖼️',
    doc: '📄',
    docx: '📄',
    txt: '📝',
    xls: '📊',
    xlsx: '📊',
    zip: '🗜️',
    rar: '🗜️'
  };
  return icons[ext] || '📎';
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function previewFile(file) {
  const preview = document.getElementById('filePreview');
  preview.innerHTML = '';
  
  const fileItem = document.createElement('div');
  fileItem.className = 'file-item';
  
  const fileInfo = document.createElement('div');
  fileInfo.className = 'file-info';
  
  const fileIcon = document.createElement('span');
  fileIcon.className = 'file-icon';
  fileIcon.textContent = getFileIcon(file.name);
  
  const fileName = document.createElement('span');
  fileName.className = 'file-name';
  fileName.textContent = file.name;
  
  const fileSize = document.createElement('span');
  fileSize.className = 'file-size';
  fileSize.textContent = formatFileSize(file.size);
  
  const removeBtn = document.createElement('button');
  removeBtn.className = 'remove-file';
  removeBtn.textContent = 'Remove';
  removeBtn.onclick = () => {
    currentFile = null;
    preview.innerHTML = '';
    document.getElementById('fileAttachment').value = '';
  };
  
  fileInfo.appendChild(fileIcon);
  fileInfo.appendChild(fileName);
  fileInfo.appendChild(fileSize);
  
  fileItem.appendChild(fileInfo);
  fileItem.appendChild(removeBtn);
  preview.appendChild(fileItem);
}

function handleFileSelect(file) {
  // Validate file size (5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    showNotification('File size exceeds 5MB limit!', 'error');
    return;
  }
  
  // Validate file type
  const allowedTypes = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'txt'];
  const fileExt = file.name.split('.').pop().toLowerCase();
  if (!allowedTypes.includes(fileExt)) {
    showNotification('File type not allowed! Supported: PDF, JPG, PNG, DOC, TXT', 'error');
    return;
  }
  
  currentFile = file;
  previewFile(file);
}

// Check for duplicate tickets
function isDuplicateTicket(name, email, issue) {
  const recentTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
  return tickets.some(ticket => 
    ticket.name === name && 
    ticket.email === email && 
    ticket.issue === issue && 
    (Date.now() - ticket.id) < recentTime
  );
}

// Export tickets as JSON
function exportTickets() {
  if (loggedInUser.role !== 'staff') {
    showNotification('Only staff can export tickets!', 'error');
    return;
  }
  
  const dataStr = JSON.stringify(tickets, null, 2);
  const dataBlob = new Blob([dataStr], {type: 'application/json'});
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `helpdesk_tickets_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showNotification('Tickets exported successfully!', 'success');
}

// Character counter for issue field
const stuIssueElement = document.getElementById('stuIssue');
if (stuIssueElement) {
  stuIssueElement.addEventListener('input', function() {
    const maxLength = 500;
    const currentLength = this.value.length;
    const remaining = maxLength - currentLength;
    const charCountElement = document.getElementById('charCount');
    if (charCountElement) {
      charCountElement.textContent = `Characters remaining: ${remaining}`;
      
      if (remaining < 50) {
        charCountElement.style.color = '#e74c3c';
      } else if (remaining < 100) {
        charCountElement.style.color = '#f39c12';
      } else {
        charCountElement.style.color = '#7f8c8d';
      }
    }
  });
}

// File upload event listeners
document.addEventListener('DOMContentLoaded', function() {
  const fileInput = document.getElementById('fileAttachment');
  const browseBtn = document.getElementById('browseFileBtn');
  const dropZone = document.getElementById('fileDropZone');
  
  if (browseBtn && fileInput) {
    browseBtn.addEventListener('click', () => fileInput.click());
  }
  
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
      }
    });
  }
  
  if (dropZone) {
    // Drag and drop events
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });
    
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over');
    });
    
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      
      if (e.dataTransfer.files.length > 0) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    });
    
    dropZone.addEventListener('click', () => {
      fileInput.click();
    });
  }
});

// Login button
document.getElementById("loginBtn").addEventListener("click", () => {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (username === users.student.username && password === users.student.password) {
    loginPage.style.display = "none";
    studentSection.style.display = "block";
    staffSection.style.display = "none";
    loggedInUser.role = "student";
    loggedInUser.email = username;
    localStorage.setItem('lastRole', 'student');
    showNotification('Student login successful!', 'success');
  } else if (username === users.staff.username && password === users.staff.password) {
    loginPage.style.display = "none";
    studentSection.style.display = "none";
    staffSection.style.display = "block";
    loggedInUser.role = "staff";
    loggedInUser.email = username;
    localStorage.setItem('lastRole', 'staff');
    renderTickets();
    showNotification('Staff login successful!', 'success');
  } else {
    showNotification('Invalid credentials!', 'error');
  }
});

// Student ticket submission
const studentForm = document.getElementById("studentForm");
if (studentForm) {
  studentForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("stuName").value.trim();
    const email = document.getElementById("stuEmail").value.trim();
    const category = document.getElementById("stuCategory").value;
    const priority = document.getElementById("stuPriority").value;
    const issue = document.getElementById("stuIssue").value.trim();

    // Validation
    if (!name || !email || !category || !issue) {
      showNotification('Please fill all required fields!', 'error');
      return;
    }

    if (!isValidEmail(email)) {
      showNotification('Please enter a valid email address!', 'error');
      return;
    }

    if (issue.length > 500) {
      showNotification('Issue too long! Maximum 500 characters.', 'error');
      return;
    }

    // Check for duplicates
    if (isDuplicateTicket(name, email, issue)) {
      if (!confirm('You submitted a similar ticket recently. Are you sure you want to submit another?')) {
        return;
      }
    }

    // Prepare attachment data
    let attachmentData = null;
    if (currentFile) {
      try {
        // In a real application, you would upload to a server
        // For demo, we'll store as base64 (limited by localStorage size)
        if (currentFile.size > 2 * 1024 * 1024) { // 2MB limit for localStorage
          showNotification('File too large for demo storage. In production, files would be uploaded to a server.', 'warning');
        } else {
          attachmentData = {
            name: currentFile.name,
            type: currentFile.type,
            size: currentFile.size,
            data: await readFileAsBase64(currentFile)
          };
        }
      } catch (error) {
        showNotification('Error reading file. Please try again.', 'error');
        return;
      }
    }

    const ticket = {
      id: Date.now(),
      name,
      email,
      category,
      priority,
      issue,
      solution: "",
      status: "Pending",
      date: new Date().toISOString(),
      assignedTo: "",
      attachment: attachmentData
    };

    // Insert new ticket at the beginning (top)
    tickets.unshift(ticket);
    saveTickets();
    
    // Reset form
    e.target.reset();
    currentFile = null;
    document.getElementById('filePreview').innerHTML = '';
    document.getElementById('fileAttachment').value = '';
    
    const charCountElement = document.getElementById('charCount');
    if (charCountElement) {
      charCountElement.textContent = 'Characters remaining: 500';
      charCountElement.style.color = '#7f8c8d';
    }

    showNotification('Ticket submitted successfully!' + (attachmentData ? ' (File attached)' : ''), 'success');
  });
}

// View tickets on login page
document.getElementById("viewTicketsBtn").addEventListener("click", () => {
  const name = document.getElementById("viewName").value.trim();
  const email = document.getElementById("viewEmail").value.trim();
  const container = document.getElementById("viewTicketsList");
  const loading = document.getElementById("viewLoading");
  
  container.innerHTML = "";
  if (loading) loading.style.display = "block";

  if (!name || !email) {
    if (loading) loading.style.display = "none";
    showNotification('Please enter both Name and Email!', 'error');
    return;
  }

  if (!isValidEmail(email)) {
    if (loading) loading.style.display = "none";
    showNotification('Please enter a valid email address!', 'error');
    return;
  }

  setTimeout(() => {
    if (loading) loading.style.display = "none";
    container.innerHTML = "<h3>Your Tickets</h3>";

    const userTickets = tickets.filter(t => t.name === name && t.email === email);

    if (userTickets.length === 0) {
      container.innerHTML += "<p>No tickets found.</p>";
      return;
    }

    // Show newest tickets first
    userTickets.forEach(ticket => {
      const div = document.createElement("div");
      div.classList.add("ticket");
      
      const date = new Date(ticket.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      let attachmentHtml = '';
      if (ticket.attachment) {
        attachmentHtml = `
          <div style="margin-top: 10px;">
            <span class="attachment-badge">📎 Attachment</span>
            <div style="margin-top: 5px;">
              <a href="#" class="attachment-link" onclick="downloadAttachment(${ticket.id}, event)">
                Download ${ticket.attachment.name} (${formatFileSize(ticket.attachment.size)})
              </a>
            </div>
          </div>
        `;
      }
      
      div.innerHTML = `
        <strong>ID:</strong> ${ticket.id}<br>
        <strong>${ticket.name}</strong> (${ticket.email})
        <span class="status ${ticket.status.toLowerCase()}">${ticket.status}</span>
        <span class="priority priority-${ticket.priority.toLowerCase()}">${ticket.priority}</span><br>
        <em>${ticket.category}</em><br>
        <div class="ticket-date">Submitted: ${date}</div>
        <p>${ticket.issue}</p>
        ${ticket.solution ? `<div class="solution"><strong>Solution:</strong> ${ticket.solution}</div>` : ""}
        ${attachmentHtml}
      `;
      container.appendChild(div);
    });
  }, 500);
});

// Download attachment function
function downloadAttachment(ticketId, event) {
  if (event) event.preventDefault();
  
  const ticket = tickets.find(t => t.id === ticketId);
  if (!ticket || !ticket.attachment) {
    showNotification('Attachment not found!', 'error');
    return;
  }
  
  try {
    // Create a download link
    const link = document.createElement('a');
    link.href = ticket.attachment.data;
    link.download = ticket.attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification(`Downloading ${ticket.attachment.name}`, 'success');
  } catch (error) {
    showNotification('Error downloading file', 'error');
  }
}

// Clear view tickets
document.getElementById("clearViewBtn").addEventListener("click", () => {
  document.getElementById("viewName").value = "";
  document.getElementById("viewEmail").value = "";
  document.getElementById("viewTicketsList").innerHTML = "";
});

// Export tickets button
document.getElementById("exportTicketsBtn").addEventListener("click", exportTickets);

// Filter and search functionality
let currentFilters = {
  search: '',
  status: '',
  category: ''
};

const searchTicketsElement = document.getElementById("searchTickets");
if (searchTicketsElement) {
  searchTicketsElement.addEventListener("input", (e) => {
    currentFilters.search = e.target.value.toLowerCase();
    renderTickets();
  });
}

const filterStatusElement = document.getElementById("filterStatus");
if (filterStatusElement) {
  filterStatusElement.addEventListener("change", (e) => {
    currentFilters.status = e.target.value;
    renderTickets();
  });
}

const filterCategoryElement = document.getElementById("filterCategory");
if (filterCategoryElement) {
  filterCategoryElement.addEventListener("change", (e) => {
    currentFilters.category = e.target.value;
    renderTickets();
  });
}

const clearFiltersElement = document.getElementById("clearFilters");
if (clearFiltersElement) {
  clearFiltersElement.addEventListener("click", () => {
    document.getElementById("searchTickets").value = '';
    document.getElementById("filterStatus").value = '';
    document.getElementById("filterCategory").value = '';
    currentFilters = { search: '', status: '', category: '' };
    renderTickets();
    showNotification('Filters cleared', 'success');
  });
}

// Render tickets for staff panel with filters
function renderTickets() {
  loadTickets();

  if (loggedInUser.role === "staff") {
    const staffTickets = document.getElementById("staffTickets");
    if (!staffTickets) return;
    
    staffTickets.innerHTML = "<h2>All Tickets</h2>";

    // Apply filters
    let filteredTickets = tickets.filter(ticket => {
      const matchesSearch = !currentFilters.search || 
        ticket.name.toLowerCase().includes(currentFilters.search) ||
        ticket.email.toLowerCase().includes(currentFilters.search) ||
        ticket.issue.toLowerCase().includes(currentFilters.search);
      
      const matchesStatus = !currentFilters.status || ticket.status === currentFilters.status;
      const matchesCategory = !currentFilters.category || ticket.category === currentFilters.category;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });

    if (filteredTickets.length === 0) {
      staffTickets.innerHTML += "<p>No tickets found matching your criteria.</p>";
      return;
    }

    // Show newest tickets first
    filteredTickets.forEach(ticket => {
      const div = document.createElement("div");
      div.classList.add("ticket");
      
      const date = new Date(ticket.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      let attachmentHtml = '';
      if (ticket.attachment) {
        attachmentHtml = `
          <div style="margin: 10px 0;">
            <span class="attachment-badge">📎 ${ticket.attachment.name} (${formatFileSize(ticket.attachment.size)})</span>
            <a href="#" class="attachment-link" onclick="downloadAttachment(${ticket.id}, event)" style="margin-left: 10px;">
              Download
            </a>
          </div>
        `;
      } else {
        attachmentHtml = '<div class="no-attachment">No attachment</div>';
      }
      
      div.innerHTML = `
        <strong>ID:</strong> ${ticket.id}<br>
        <strong>${ticket.name}</strong> (${ticket.email})
        <span class="status ${ticket.status.toLowerCase()}">${ticket.status}</span>
        <span class="priority priority-${ticket.priority.toLowerCase()}">${ticket.priority}</span><br>
        <em>${ticket.category}</em><br>
        <div class="ticket-date">Submitted: ${date}</div>
        <p>${ticket.issue}</p>
        ${attachmentHtml}
        <textarea rows="3" placeholder="Write solution here..." id="solution-${ticket.id}">${ticket.solution}</textarea>
        <div class="ticket-actions">
          <button class="saveReply">Save Reply</button>
          <button class="deleteTicket" style="background:#e74c3c;">Delete</button>
          <button class="assignToMe" style="background:#9b59b6;">Assign to Me</button>
        </div>
      `;

      const btn = div.querySelector(".saveReply");
      const delBtn = div.querySelector(".deleteTicket");
      const assignBtn = div.querySelector(".assignToMe");
      const txt = div.querySelector(`#solution-${ticket.id}`);

      btn.addEventListener("click", () => {
        ticket.solution = txt.value;
        ticket.status = txt.value.trim() ? "Solved" : "Pending";
        saveTickets();
        showNotification('Solution saved!', 'success');
        renderTickets();
      });

      delBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to delete this ticket? This action cannot be undone.")) {
          tickets = tickets.filter(t => t.id !== ticket.id);
          saveTickets();
          showNotification('Ticket deleted successfully', 'success');
          renderTickets();
        }
      });

      assignBtn.addEventListener("click", () => {
        ticket.assignedTo = loggedInUser.email;
        saveTickets();
        showNotification(`Ticket assigned to you`, 'success');
        renderTickets();
      });

      staffTickets.appendChild(div);
    });
  }
}

// Logout
function logout() {
  loginPage.style.display = "block";
  studentSection.style.display = "none";
  staffSection.style.display = "none";
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
  loggedInUser = { role: "", email: "" };
  localStorage.removeItem('lastRole');
  showNotification('Logged out successfully', 'success');
}

// Initialize page
function initializePage() {
  loadTickets();
  
  // Reset to login page on every load
  loginPage.style.display = "block";
  studentSection.style.display = "none";
  staffSection.style.display = "none";
  
  // Clear any stored login state
  loggedInUser = { role: "", email: "" };
}

// Call initialize on page load
window.addEventListener('load', initializePage);

// Initial load
loadTickets();