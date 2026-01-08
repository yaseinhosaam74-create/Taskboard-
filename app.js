// مصفوفة المهام
let tasks = JSON.parse(localStorage.getItem('smartTasks_2026') || '[]');
let alarmAudio = null;

// إعداد السحب والإفلات (SortableJS)
const setupDragAndDrop = () => {
    [document.getElementById('pendingTasks'), document.getElementById('completedTasks')].forEach(el => {
        new Sortable(el, {
            group: 'tasks',
            animation: 150,
            ghostClass: 'opacity-20',
            onEnd: saveTasksState
        });
    });
};

// إضافة مهمة جديدة
async function addNewTask() {
    const title = document.getElementById('taskTitle').value;
    const category = document.getElementById('taskCategory').value;
    const time = document.getElementById('taskTime').value;
    const audioInput = document.getElementById('taskAudio').files[0];

    if (!title || !time || !audioInput) {
        alert("يرجى ملء جميع البيانات واختيار ملف صوتي ⚠️");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const newTask = {
            id: Date.now(),
            title,
            category,
            time: new Date(time).getTime(),
            audio: e.target.result,
            status: 'pending'
        };
        
        tasks.push(newTask);
        saveTasksState();
        renderTasks();
        scheduleAlarm(newTask);
        
        // Reset Inputs
        document.getElementById('taskTitle').value = '';
    };
    reader.readAsDataURL(audioInput);
}

// جدولة المنبه
function scheduleAlarm(task) {
    const now = Date.now();
    const delay = task.time - now;

    if (delay > 0) {
        setTimeout(() => triggerAlarm(task), delay);
    }
}

// تشغيل المنبه
function triggerAlarm(task) {
    const audio = new Audio(task.audio);
    audio.volume = 0;
    audio.play();

    // الصوت التصاعدي (Fade-in)
    let vol = 0;
    const fade = setInterval(() => {
        if (vol < 1) {
            vol += 0.05;
            audio.volume = Math.min(vol, 1);
        } else { clearInterval(fade); }
    }, 2000);

    // إشعار شاشة القفل
    if (Notification.permission === "granted") {
        new Notification("تنبيه المهمة الذكي", {
            body: `حان موعد: ${task.title}`,
            requireInteraction: true,
            vibrate: [200, 100, 200]
        });
    }
}

// حفظ الحالة
function saveTasksState() {
    localStorage.setItem('smartTasks_2026', JSON.stringify(tasks));
}

// عرض المهام
function renderTasks() {
    const pendingContainer = document.getElementById('pendingTasks');
    const completedContainer = document.getElementById('completedTasks');
    
    pendingContainer.innerHTML = '';
    completedContainer.innerHTML = '';

    tasks.forEach(task => {
        const card = `
            <div class="glass p-4 rounded-2xl task-card flex justify-between items-center" data-id="${task.id}">
                <div>
                    <h4 class="font-bold text-sm">${task.title}</h4>
                    <span class="text-[10px] text-slate-500">${task.category} | ${new Date(task.time).toLocaleString('ar-EG')}</span>
                </div>
                <button onclick="deleteTask(${task.id})" class="text-rose-500/50 hover:text-rose-500"><i class="fas fa-trash"></i></button>
            </div>
        `;
        pendingContainer.innerHTML += card;
    });
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasksState();
    renderTasks();
}

// حفظ المفكرة الحرة
function saveNotes() {
    localStorage.setItem('freeNotes_2026', document.getElementById('freeNotes').value);
}

// تهيئة عند التشغيل
window.onload = () => {
    document.getElementById('freeNotes').value = localStorage.getItem('freeNotes_2026') || '';
    renderTasks();
    setupDragAndDrop();
    if (Notification.permission !== "granted") Notification.requestPermission();
    
    // إعادة جدولة المنبهات عند فتح التطبيق
    tasks.forEach(task => {
        if (task.time > Date.now()) scheduleAlarm(task);
    });
};
