// 戒了么 - Web 版本
// 数据存储使用 localStorage

const TAGS = ['烟', '酒', '赌', '熬', '糖', '氪', '废', '色', '辣', '盐', '懒', '抖', '购', '戏', '拖'];

// 数据模型
class Habit {
  constructor(id, name, streak = 0, lastChecked = null, checkIns = []) {
    this.id = id;
    this.name = name;
    this.streak = streak;
    this.lastChecked = lastChecked;
    this.checkIns = checkIns;
  }
}

// 数据存储
const Storage = {
  getHabits() {
    const data = localStorage.getItem('habits');
    if (!data) return [];
    return JSON.parse(data).map(h => new Habit(h.id, h.name, h.streak, h.lastChecked, h.checkIns));
  },
  
  saveHabits(habits) {
    localStorage.setItem('habits', JSON.stringify(habits));
  },
  
  getNotificationTime() {
    const hour = localStorage.getItem('notificationHour');
    const minute = localStorage.getItem('notificationMinute');
    return {
      hour: hour !== null ? parseInt(hour) : 9,
      minute: minute !== null ? parseInt(minute) : 0
    };
  },
  
  saveNotificationTime(hour, minute) {
    localStorage.setItem('notificationHour', hour);
    localStorage.setItem('notificationMinute', minute);
  }
};

// 日期工具
const DateUtils = {
  today() {
    return new Date().toISOString().split('T')[0];
  },
  
  yesterday() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }
};

// 状态管理
const state = {
  habits: [],
  pendingHabit: null,
  deleteHabit: null,
  selectedHour: 9,
  selectedMinute: 0
};

// DOM 元素
const elements = {
  habitList: document.getElementById('habitList'),
  habitCount: document.getElementById('habitCount'),
  addBtn: document.getElementById('addBtn'),
  addModal: document.getElementById('addModal'),
  closeAddModal: document.getElementById('closeAddModal'),
  tagsContainer: document.getElementById('tagsContainer'),
  customInput: document.getElementById('customInput'),
  customAddBtn: document.getElementById('customAddBtn'),
  confirmModal: document.getElementById('confirmModal'),
  confirmText: document.getElementById('confirmText'),
  confirmOk: document.getElementById('confirmOk'),
  confirmCancel: document.getElementById('confirmCancel'),
  deleteModal: document.getElementById('deleteModal'),
  deleteText: document.getElementById('deleteText'),
  deleteOk: document.getElementById('deleteOk'),
  deleteCancel: document.getElementById('deleteCancel'),
  notificationBtn: document.getElementById('notificationBtn'),
  notificationTime: document.getElementById('notificationTime'),
  timeModal: document.getElementById('timeModal'),
  hourWheel: document.getElementById('hourWheel'),
  minuteWheel: document.getElementById('minuteWheel'),
  timeSaveBtn: document.getElementById('timeSaveBtn')
};

// 渲染习惯列表
function renderHabits() {
  elements.habitCount.textContent = state.habits.length;
  
  if (state.habits.length === 0) {
    elements.habitList.innerHTML = `
      <div class="empty-state" id="emptyState">
        <div class="empty-state-text">开启第一项戒断</div>
        <div class="empty-state-sub">Let's Get Started</div>
      </div>
    `;
    document.getElementById('emptyState')?.addEventListener('click', () => showModal('add'));
    return;
  }
  
  const today = DateUtils.today();
  
  elements.habitList.innerHTML = `
    <div class="habit-list">
      ${state.habits.map(habit => {
        const isChecked = habit.lastChecked === today;
        return `
          <div class="habit-card ${isChecked ? 'checked' : ''}" data-id="${habit.id}">
            <div class="habit-header">
              <div>
                <div class="habit-name">${habit.name}</div>
                <div class="habit-status">
                  <div class="status-dot ${isChecked ? 'checked' : ''}"></div>
                  <div class="status-text">${isChecked ? 'Checked' : 'Ready'}</div>
                </div>
              </div>
              <div class="habit-streak">
                <div class="streak-count">${habit.streak}</div>
                <div class="streak-label">Days</div>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
  
  // 绑定事件
  document.querySelectorAll('.habit-card').forEach(card => {
    const habitId = card.dataset.id;
    const habit = state.habits.find(h => h.id === habitId);
    const isChecked = habit.lastChecked === today;
    
    card.addEventListener('click', () => {
      if (!isChecked) {
        state.pendingHabit = habit;
        showConfirmModal(habit);
      }
    });
    
    card.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      state.deleteHabit = habit;
      showDeleteModal(habit);
    });
    
    // 长按支持
    let pressTimer;
    card.addEventListener('touchstart', () => {
      pressTimer = setTimeout(() => {
        state.deleteHabit = habit;
        showDeleteModal(habit);
      }, 500);
    });
    card.addEventListener('touchend', () => clearTimeout(pressTimer));
    card.addEventListener('touchmove', () => clearTimeout(pressTimer));
  });
}

// 渲染标签
function renderTags() {
  elements.tagsContainer.innerHTML = TAGS.map(tag => 
    `<button class="tag-btn" data-tag="${tag}">${tag}</button>`
  ).join('');
  
  document.querySelectorAll('.tag-btn').forEach(btn => {
    btn.addEventListener('click', () => addHabit(btn.dataset.tag));
  });
}

// 渲染时间选择器
function renderTimePicker() {
  elements.hourWheel.innerHTML = Array.from({length: 24}, (_, i) => 
    `<div class="time-option ${i === state.selectedHour ? 'selected' : ''}" data-value="${i}">${String(i).padStart(2, '0')}</div>`
  ).join('');
  
  elements.minuteWheel.innerHTML = Array.from({length: 60}, (_, i) => 
    `<div class="time-option ${i === state.selectedMinute ? 'selected' : ''}" data-value="${i}">${String(i).padStart(2, '0')}</div>`
  ).join('');
  
  document.querySelectorAll('#hourWheel .time-option').forEach(opt => {
    opt.addEventListener('click', () => {
      state.selectedHour = parseInt(opt.dataset.value);
      renderTimePicker();
    });
  });
  
  document.querySelectorAll('#minuteWheel .time-option').forEach(opt => {
    opt.addEventListener('click', () => {
      state.selectedMinute = parseInt(opt.dataset.value);
      renderTimePicker();
    });
  });
}

// 显示弹窗
function showModal(type) {
  if (type === 'add') {
    elements.addModal.classList.add('show');
    elements.customInput.value = '';
  } else if (type === 'time') {
    renderTimePicker();
    elements.timeModal.classList.add('show');
  }
}

function hideModal(modal) {
  modal.classList.remove('show');
}

function showConfirmModal(habit) {
  elements.confirmText.innerHTML = `摸着良心说，<br>今天真的戒【${habit.name}】了吗？`;
  elements.confirmModal.classList.add('show');
}

function showDeleteModal(habit) {
  elements.deleteText.textContent = `确定要删除「${habit.name}」吗？`;
  elements.deleteModal.classList.add('show');
}

// 添加习惯
function addHabit(name) {
  const trimmedName = name.trim();
  if (!trimmedName) return;
  if (state.habits.some(h => h.name === trimmedName)) return;
  
  const habit = new Habit(
    Date.now().toString(),
    trimmedName,
    0,
    null,
    []
  );
  
  state.habits.push(habit);
  Storage.saveHabits(state.habits);
  renderHabits();
  hideModal(elements.addModal);
}

// 打卡确认
function confirmCheckIn() {
  if (!state.pendingHabit) return;
  
  const habit = state.pendingHabit;
  const today = DateUtils.today();
  const yesterday = DateUtils.yesterday();
  
  if (habit.lastChecked === today) return;
  
  if (!habit.checkIns.includes(today)) {
    habit.checkIns.push(today);
  }
  
  const newStreak = (habit.lastChecked === yesterday || habit.lastChecked === null) 
    ? habit.streak + 1 
    : 1;
  habit.streak = newStreak;
  habit.lastChecked = today;
  
  Storage.saveHabits(state.habits);
  renderHabits();
  hideModal(elements.confirmModal);
  state.pendingHabit = null;
}

// 删除习惯
function deleteHabit() {
  if (!state.deleteHabit) return;
  
  state.habits = state.habits.filter(h => h.id !== state.deleteHabit.id);
  Storage.saveHabits(state.habits);
  renderHabits();
  hideModal(elements.deleteModal);
  state.deleteHabit = null;
}

// 更新通知时间显示
function updateNotificationDisplay() {
  const {hour, minute} = Storage.getNotificationTime();
  elements.notificationTime.textContent = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  state.selectedHour = hour;
  state.selectedMinute = minute;
}

// 保存通知时间
function saveNotificationTime() {
  Storage.saveNotificationTime(state.selectedHour, state.selectedMinute);
  updateNotificationDisplay();
  
  // 请求通知权限并设置提醒
  if ('Notification' in window && Notification.permission === 'granted') {
    scheduleNotification(state.selectedHour, state.selectedMinute);
  } else if ('Notification' in window && Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        scheduleNotification(state.selectedHour, state.selectedMinute);
      }
    });
  }
  
  hideModal(elements.timeModal);
}

// 设置通知（使用 Service Worker）
function scheduleNotification(hour, minute) {
  // 注册 Service Worker 用于定时通知
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}

// 事件绑定
function bindEvents() {
  // 添加按钮
  elements.addBtn.addEventListener('click', () => showModal('add'));
  
  // 关闭添加弹窗
  elements.closeAddModal.addEventListener('click', () => hideModal(elements.addModal));
  elements.addModal.addEventListener('click', (e) => {
    if (e.target === elements.addModal) hideModal(elements.addModal);
  });
  
  // 自定义添加
  elements.customAddBtn.addEventListener('click', () => addHabit(elements.customInput.value));
  elements.customInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addHabit(elements.customInput.value);
  });
  
  // 确认打卡
  elements.confirmOk.addEventListener('click', confirmCheckIn);
  elements.confirmCancel.addEventListener('click', () => {
    hideModal(elements.confirmModal);
    state.pendingHabit = null;
  });
  elements.confirmModal.addEventListener('click', (e) => {
    if (e.target === elements.confirmModal) {
      hideModal(elements.confirmModal);
      state.pendingHabit = null;
    }
  });
  
  // 删除确认
  elements.deleteOk.addEventListener('click', deleteHabit);
  elements.deleteCancel.addEventListener('click', () => {
    hideModal(elements.deleteModal);
    state.deleteHabit = null;
  });
  elements.deleteModal.addEventListener('click', (e) => {
    if (e.target === elements.deleteModal) {
      hideModal(elements.deleteModal);
      state.deleteHabit = null;
    }
  });
  
  // 通知时间
  elements.notificationBtn.addEventListener('click', () => showModal('time'));
  elements.timeSaveBtn.addEventListener('click', saveNotificationTime);
  elements.timeModal.addEventListener('click', (e) => {
    if (e.target === elements.timeModal) hideModal(elements.timeModal);
  });
}

// 初始化
function init() {
  state.habits = Storage.getHabits();
  updateNotificationDisplay();
  renderTags();
  renderHabits();
  bindEvents();
  
  // 请求通知权限
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

init();
