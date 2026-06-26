const taskForm = document.getElementById('taskForm');
const taskList = document.getElementById('taskList');
const searchInput = document.getElementById('searchInput');
const priorityFilter = document.getElementById('priorityFilter');
const statusFilter = document.getElementById('statusFilter');
const sortSelect = document.getElementById('sortSelect');
const themeToggle = document.getElementById('themeToggle');
const toast = document.getElementById('toast');
const formTitle = document.getElementById('formTitle');
const cancelEdit = document.getElementById('cancelEdit');
const submitBtn = taskForm.querySelector('button[type="submit"]');
const totalTasksEl = document.getElementById('totalTasks');
const completedTasksEl = document.getElementById('completedTasks');
const pendingTasksEl = document.getElementById('pendingTasks');

let tasks = JSON.parse(localStorage.getItem('taskflowTasks')) || [];
let editingId = null;

function getStoredTheme() {
  return localStorage.getItem('taskflowTheme') || 'light';
}

function applyTheme(theme) {
  document.body.classList.toggle('dark', theme === 'dark');
  const icon = themeToggle.querySelector('i');
  icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toast.classList.remove('show'), 2200);
}

function saveTasks() {
  localStorage.setItem('taskflowTasks', JSON.stringify(tasks));
}

function resetForm() {
  taskForm.reset();
  editingId = null;
  formTitle.textContent = 'Add New Task';
  submitBtn.textContent = 'Add Task';
  cancelEdit.classList.add('hidden');
}

function renderStats() {
  totalTasksEl.textContent = tasks.length;
  completedTasksEl.textContent = tasks.filter((task) => task.completed).length;
  pendingTasksEl.textContent = tasks.filter((task) => !task.completed).length;
}

function getFilteredTasks() {
  const searchText = searchInput.value.toLowerCase();
  const priorityValue = priorityFilter.value;
  const statusValue = statusFilter.value;

  const filtered = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchText) || task.description.toLowerCase().includes(searchText);
    const matchesPriority = priorityValue ? task.priority === priorityValue : true;
    const matchesStatus = statusValue ? (statusValue === 'completed' ? task.completed : !task.completed) : true;

    return matchesSearch && matchesPriority && matchesStatus;
  });

  const sortValue = sortSelect.value;
  if (sortValue === 'priority') {
    const priorityOrder = { High: 0, Medium: 1, Low: 2 };
    filtered.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  } else {
    filtered.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }

  return filtered;
}

function renderTasks() {
  const filteredTasks = getFilteredTasks();
  renderStats();

  if (!filteredTasks.length) {
    taskList.innerHTML = `
      <div class="empty-state">
        <h4>No tasks found</h4>
        <p>Try a different search or add a new task.</p>
      </div>
    `;
    return;
  }

  taskList.innerHTML = filteredTasks
    .map((task) => {
      const priorityClass = `priority-${task.priority}`;
      const completedClass = task.completed ? 'completed' : '';
      return `
        <article class="task-card ${completedClass}">
          <div class="task-main">
            <div class="task-title-row">
              <h4 class="task-title ${completedClass}">${task.title}</h4>
              <span class="priority-badge ${priorityClass}">${task.priority}</span>
            </div>
            <p class="task-description">${task.description || 'No description added.'}</p>
            <p class="task-meta"><i class="fa-solid fa-calendar-days"></i> ${task.dueDate}</p>
            <p class="task-meta"><i class="fa-solid fa-circle-info"></i> ${task.completed ? 'Completed' : 'Pending'}</p>
          </div>
          <div class="task-actions">
            <button class="icon-btn toggle" data-action="toggle" data-id="${task.id}" aria-label="Toggle task">
              <i class="fa-solid ${task.completed ? 'fa-rotate-left' : 'fa-check'}"></i>
            </button>
            <button class="icon-btn" data-action="edit" data-id="${task.id}" aria-label="Edit task">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="icon-btn delete" data-action="delete" data-id="${task.id}" aria-label="Delete task">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </article>
      `;
    })
    .join('');
}

function handleTaskAction(event) {
  const button = event.target.closest('button');
  if (!button) return;

  const { action, id } = button.dataset;
  if (action === 'toggle') {
    const task = tasks.find((item) => item.id === id);
    if (task) {
      task.completed = !task.completed;
      saveTasks();
      renderTasks();
      showToast(task.completed ? 'Task marked complete' : 'Task moved to pending');
    }
  }

  if (action === 'edit') {
    const task = tasks.find((item) => item.id === id);
    if (task) {
      editingId = task.id;
      document.getElementById('title').value = task.title;
      document.getElementById('description').value = task.description;
      document.getElementById('dueDate').value = task.dueDate;
      document.getElementById('priority').value = task.priority;
      formTitle.textContent = 'Edit Task';
      submitBtn.textContent = 'Update Task';
      cancelEdit.classList.remove('hidden');
      document.getElementById('title').focus();
    }
  }

  if (action === 'delete') {
    const task = tasks.find((item) => item.id === id);
    if (task && window.confirm(`Delete "${task.title}"?`)) {
      tasks = tasks.filter((item) => item.id !== id);
      saveTasks();
      renderTasks();
      showToast('Task deleted');
      if (editingId === id) resetForm();
    }
  }
}

taskForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const newTask = {
    id: editingId || `${Date.now()}`,
    title: document.getElementById('title').value.trim(),
    description: document.getElementById('description').value.trim(),
    dueDate: document.getElementById('dueDate').value,
    priority: document.getElementById('priority').value,
    completed: false,
  };

  if (!newTask.title || !newTask.dueDate) return;

  if (editingId) {
    tasks = tasks.map((task) => (task.id === editingId ? { ...task, ...newTask, completed: task.completed } : task));
    showToast('Task updated');
  } else {
    tasks.unshift(newTask);
    showToast('Task added');
  }

  saveTasks();
  renderTasks();
  resetForm();
});

cancelEdit.addEventListener('click', resetForm);
searchInput.addEventListener('input', renderTasks);
priorityFilter.addEventListener('change', renderTasks);
statusFilter.addEventListener('change', renderTasks);
sortSelect.addEventListener('change', renderTasks);
taskList.addEventListener('click', handleTaskAction);

themeToggle.addEventListener('click', () => {
  const nextTheme = document.body.classList.contains('dark') ? 'light' : 'dark';
  applyTheme(nextTheme);
  localStorage.setItem('taskflowTheme', nextTheme);
});

applyTheme(getStoredTheme());
renderTasks();
showToast('Welcome to TaskFlow');
