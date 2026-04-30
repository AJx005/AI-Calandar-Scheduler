document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const taskNameInput = document.getElementById('taskName');
    const taskDurationSelect = document.getElementById('taskDuration');
    const taskPrioritySelect = document.getElementById('taskPriority');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const optimizeBtn = document.getElementById('optimizeBtn');
    const calendarItems = document.getElementById('calendarItems');
    const scheduleStatus = document.getElementById('scheduleStatus');

    // State
    let tasks = [];
    let isOptimized = false;

    // Constants
    const PIXELS_PER_MINUTE = 80 / 60; // 80px per hour
    const START_HOUR = 9; // 9:00 AM

    // Add sample tasks for demonstration if needed, or let user add them.
    // We'll let the user add them, but provide a function to generate a sample if they click optimize with no tasks.
    
    // Event Listeners
    addTaskBtn.addEventListener('click', handleAddTask);
    taskNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAddTask();
    });
    optimizeBtn.addEventListener('click', handleOptimize);

    function handleAddTask() {
        const name = taskNameInput.value.trim();
        if (!name) {
            alert('Please enter a task name.');
            return;
        }

        const duration = parseInt(taskDurationSelect.value);
        const priority = taskPrioritySelect.value;

        const newTask = {
            id: Date.now().toString(),
            name,
            duration,
            priority,
            createdAt: new Date()
        };

        tasks.push(newTask);
        
        // Reset input
        taskNameInput.value = '';
        taskNameInput.focus();

        renderTaskList();
        
        // Reset optimization status if new task added
        if (isOptimized) {
            scheduleStatus.textContent = 'Changes made - Re-optimize?';
            scheduleStatus.classList.remove('active');
            isOptimized = false;
        }
    }

    function renderTaskList() {
        if (tasks.length === 0) {
            taskList.innerHTML = '<li class="empty-state">No tasks added yet.</li>';
            return;
        }

        taskList.innerHTML = '';
        tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item';
            
            const durationText = task.duration >= 60 
                ? `${task.duration / 60} ${task.duration === 60 ? 'hr' : 'hrs'}` 
                : `${task.duration} min`;

            li.innerHTML = `
                <div class="task-info">
                    <span class="task-title">${escapeHTML(task.name)}</span>
                    <span class="task-meta">
                        <span class="task-priority priority-${task.priority}"></span>
                        ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} • ${durationText}
                    </span>
                </div>
                <button class="delete-btn" data-id="${task.id}" style="background:none; border:none; color:var(--text-secondary); cursor:pointer;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
            `;
            
            taskList.appendChild(li);
        });

        // Add delete listeners
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                tasks = tasks.filter(t => t.id !== id);
                renderTaskList();
            });
        });
    }

    function handleOptimize() {
        if (tasks.length === 0) {
            // Add some sample tasks if empty to show the demo
            tasks = [
                { id: '1', name: 'Strategic Planning', duration: 90, priority: 'high' },
                { id: '2', name: 'Email Catchup', duration: 30, priority: 'low' },
                { id: '3', name: 'Team Sync', duration: 60, priority: 'medium' },
                { id: '4', name: 'Deep Work: Project X', duration: 120, priority: 'high' },
                { id: '5', name: 'Client Feedback Review', duration: 60, priority: 'medium' }
            ];
            renderTaskList();
        }

        // Simulate AI thinking
        optimizeBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Optimizing...';
        optimizeBtn.disabled = true;

        setTimeout(() => {
            generateSchedule();
            
            // Reset button
            optimizeBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg> Optimize Schedule';
            optimizeBtn.disabled = false;
            
            scheduleStatus.textContent = 'AI Optimized ✓';
            scheduleStatus.classList.add('active');
            isOptimized = true;
        }, 800);
    }

    function generateSchedule() {
        // AI Logic Simulation:
        // 1. Sort by Priority (High > Medium > Low)
        // 2. Secondary sort: Longer tasks first within same priority for deep work early in the day
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        
        const sortedTasks = [...tasks].sort((a, b) => {
            if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
                return priorityWeight[b.priority] - priorityWeight[a.priority];
            }
            return b.duration - a.duration;
        });

        calendarItems.innerHTML = '';
        
        let currentMinutes = 0; // Minutes from START_HOUR
        const MAX_MINUTES = 8 * 60; // 8 hours working day (9 to 5)

        sortedTasks.forEach((task, index) => {
            if (currentMinutes >= MAX_MINUTES) return; // Day is full

            // Add a small 5 min break between tasks if it's not the first task
            if (index > 0) {
                currentMinutes += 5; 
            }

            // Cap duration if it exceeds the day
            let actualDuration = task.duration;
            if (currentMinutes + actualDuration > MAX_MINUTES) {
                actualDuration = MAX_MINUTES - currentMinutes;
            }

            renderTaskOnCalendar(task, currentMinutes, actualDuration, index);
            
            currentMinutes += actualDuration;
        });
    }

    function renderTaskOnCalendar(task, startMinutes, duration, index) {
        const top = startMinutes * PIXELS_PER_MINUTE;
        const height = duration * PIXELS_PER_MINUTE;

        const startTime = formatTime(START_HOUR * 60 + startMinutes);
        const endTime = formatTime(START_HOUR * 60 + startMinutes + duration);

        const taskDiv = document.createElement('div');
        taskDiv.className = `scheduled-task p-${task.priority}`;
        taskDiv.style.top = `${top}px`;
        taskDiv.style.height = `${height - 2}px`; // -2 for slight gap
        taskDiv.style.animationDelay = `${index * 0.1}s`;

        taskDiv.innerHTML = `
            <div class="s-task-title">${escapeHTML(task.name)}</div>
            <div class="s-task-time">${startTime} - ${endTime}</div>
            <div class="s-task-ai-tag">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                Auto-placed
            </div>
        `;

        calendarItems.appendChild(taskDiv);
    }

    // Utility functions
    function formatTime(totalMinutes) {
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayH = h > 12 ? h - 12 : (h === 0 ? 12 : h);
        const displayM = m.toString().padStart(2, '0');
        return `${displayH}:${displayM} ${ampm}`;
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }
});
