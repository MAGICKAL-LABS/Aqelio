/* =========================================================
   AQELIO
   Phase 1 — Complete App.js
   Tasks • Editing • Recurring Tasks • Categories
   Reminders • Notifications • Calendar • Focus • Stats

   UPDATED:
   - Every week / Every other week / Every 3rd week / Every 4th week
   - Weekly weekday selection
   - Recurring tasks correctly appear on Home
   - Recurring completion tracked by occurrence date
   - Category color picker only when creating category
   - Category delete button integrated into category card
   - Subtle category delete controls
   ========================================================= */


/* =========================================================
   STORAGE
   ========================================================= */

const TASKS_KEY = "aqelio_tasks";
const CATEGORIES_KEY = "aqelio_categories";
const STATS_KEY = "aqelio_stats";
const FIRED_REMINDERS_KEY = "aqelio_fired_reminders";
const PROFILE_KEY = "aqelio_profile";
const THEME_KEY = "aqelio_theme";
const PREMIUM_KEY = "aqelio_premium"; // Local preview flag only; not secure purchase verification.


let tasks = JSON.parse(
    localStorage.getItem(TASKS_KEY) || "[]"
);

let categories = JSON.parse(
    localStorage.getItem(CATEGORIES_KEY) || "[]"
);

let stats = JSON.parse(
    localStorage.getItem(STATS_KEY) ||
    '{"completed":0,"focus":0,"minutes":0}'
);

let firedReminders = JSON.parse(
    localStorage.getItem(FIRED_REMINDERS_KEY) || "[]"
);

let profile = JSON.parse(
    localStorage.getItem(PROFILE_KEY) ||
    '{"name":"","color":"#078b91"}'
);

let darkMode =
    localStorage.getItem(THEME_KEY) === "dark";


/* =========================================================
   DEFAULT CATEGORIES
   ========================================================= */

if (categories.length === 0) {

    categories = [
        {
            id: "school",
            name: "School",
            color: "#4f7cff"
        },
        {
            id: "personal",
            name: "Personal",
            color: "#8a63d2"
        },
        {
            id: "work",
            name: "Work",
            color: "#e18a45"
        }
    ];

    saveCategories();
}


/* =========================================================
   DOM
   ========================================================= */

const screens = {
    home: document.getElementById("home-screen"),
    calendar: document.getElementById("calendar-screen"),
    focus: document.getElementById("focus-screen"),
    stats: document.getElementById("stats-screen")
};


const navHome =
    document.getElementById("nav-home");

const navCalendar =
    document.getElementById("nav-calendar");

const navFocus =
    document.getElementById("nav-focus");

const navStats =
    document.getElementById("nav-stats");


const taskModal =
    document.getElementById("task-modal");

const modalOverlay =
    document.getElementById("modal-overlay");

const profileButton =
    document.getElementById("profile-button");

const profileModal =
    document.getElementById("profile-modal");

const profileOverlay =
    document.getElementById("profile-overlay");

const closeProfileButton =
    document.getElementById("close-profile");

const profileNameInput =
    document.getElementById("profile-name");

const profileColorInput =
    document.getElementById("profile-color");

const profileColorValue =
    document.getElementById("profile-color-value");

const profilePreview =
    document.getElementById("profile-preview");

const profilePreviewName =
    document.getElementById("profile-preview-name");

const darkModeToggle =
    document.getElementById("dark-mode-toggle");

const saveProfileButton =
    document.getElementById("save-profile");


const taskTitle =
    document.getElementById("task-title");

const taskDate =
    document.getElementById("task-date");

const taskTime =
    document.getElementById("task-time");

const taskReminder =
    document.getElementById("task-reminder");

const taskRepeat =
    document.getElementById("task-repeat");


const saveTaskButton =
    document.getElementById("save-task");


const modalTitle =
    document.getElementById("modal-title");

const modalEyebrow =
    document.getElementById("modal-eyebrow");


const categoryList =
    document.getElementById("category-list");

const categoryName =
    document.getElementById("category-name");

const categoryForm =
    document.getElementById("category-form");


const customDuration =
    document.getElementById("custom-duration");


let selectedCategory = null;

let selectedDuration = 25;

let editingTaskId = null;

let selectedCalendarDate =
    formatDate(new Date());

let calendarDate =
    new Date();


/* =========================================================
   DATE HELPERS
   ========================================================= */

function formatDate(date) {

    const year =
        date.getFullYear();

    const month =
        String(date.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(date.getDate())
            .padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function parseDate(dateString) {

    const [year, month, day] =
        dateString.split("-").map(Number);

    return new Date(
        year,
        month - 1,
        day
    );
}


/*
   UTC date math avoids daylight-saving-time
   problems when calculating weekly intervals.
*/

function dateToUTC(dateString) {

    const [year, month, day] =
        dateString.split("-").map(Number);

    return Date.UTC(
        year,
        month - 1,
        day
    );
}


function daysBetween(
    startDate,
    endDate
) {

    return Math.round(
        (
            dateToUTC(endDate) -
            dateToUTC(startDate)
        ) /
        86400000
    );
}


/* =========================================================
   MISSING UI HELPERS (required during startup)
   ========================================================= */

function renderCurrentDate() {
    const dateElement = document.getElementById("current-date");
    if (!dateElement) return;
    dateElement.textContent = new Date().toLocaleDateString(undefined, {
        weekday: "long", month: "long", day: "numeric", year: "numeric"
    });
}

function renderCategories() {
    const container = document.getElementById("category-list");
    if (!container) return;

    container.innerHTML = "";
    if (!categories.length) {
        container.innerHTML = '<p class="form-help">No categories yet. Add one to organize your tasks.</p>';
        selectedCategory = null;
        return;
    }

    if (selectedCategory == null || !categories.some(category => String(category.id) === String(selectedCategory))) {
        selectedCategory = categories[0].id;
    }

    categories.forEach(category => {
        const row = document.createElement("div");
        row.className = "category-item";

        const button = document.createElement("button");
        button.type = "button";
        button.className = "category-button" + (String(category.id) === String(selectedCategory) ? " selected" : "");
        button.setAttribute("aria-pressed", String(String(category.id) === String(selectedCategory)));
        button.innerHTML = `<span class="category-button-main"><span class="category-dot" style="background:${escapeHtml(category.color || "#078b91")}"></span><span>${escapeHtml(category.name)}</span></span><span class="category-selected-mark">${String(category.id) === String(selectedCategory) ? "✓" : ""}</span>`;
        button.addEventListener("click", () => {
            selectedCategory = category.id;
            renderCategories();
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "category-delete";
        deleteButton.setAttribute("aria-label", `Delete ${category.name} category`);
        deleteButton.title = `Delete ${category.name}`;
        deleteButton.textContent = "×";
        deleteButton.addEventListener("click", event => {
            event.preventDefault();
            event.stopPropagation();
            deleteCategory(category.id);
        });

        row.append(button, deleteButton);
        container.appendChild(row);
    });
}

function deleteCategory(categoryId) {
    const category = categories.find(item => String(item.id) === String(categoryId));
    if (!category) return;

    const categoryTasks = tasks.filter(task => String(task.categoryId) === String(categoryId));
    const replacement = categories.find(item => String(item.id) !== String(categoryId));
    const message = categoryTasks.length
        ? `Delete the \"${category.name}\" category? ${categoryTasks.length} task(s) use it and will be moved to ${replacement ? `\"${replacement.name}\"` : "no category"}. This cannot be undone.`
        : `Delete the \"${category.name}\" category? This cannot be undone.`;
    if (!window.confirm(message)) return;

    categories = categories.filter(item => String(item.id) !== String(categoryId));
    tasks.forEach(task => {
        if (String(task.categoryId) === String(categoryId)) {
            task.categoryId = replacement ? replacement.id : null;
        }
    });
    if (String(selectedCategory) === String(categoryId)) {
        selectedCategory = replacement ? replacement.id : null;
    }
    saveCategories();
    saveTasks();
    renderCategories();
    try { renderHome(); } catch (error) { console.error("Could not refresh tasks after deleting category:", error); }
}

function closeCategoryForm() {
    if (categoryForm) categoryForm.classList.add("hidden");
    if (categoryName) categoryName.value = "";
    const colorInput = document.getElementById("new-category-color");
    if (colorInput) colorInput.value = "#078b91";
    const colorPreview = document.getElementById("new-category-color-preview");
    if (colorPreview) colorPreview.style.background = "#078b91";
    const colorValue = document.getElementById("new-category-color-value");
    if (colorValue) colorValue.textContent = "#078B91";
}

function setupCategoryControls() {
    const showButton = document.getElementById("show-category-form");
    const cancelButton = document.getElementById("cancel-category");
    const saveButton = document.getElementById("save-category");

    showButton?.addEventListener("click", () => {
        categoryForm?.classList.remove("hidden");
        categoryName?.focus();
    });
    cancelButton?.addEventListener("click", closeCategoryForm);
    saveButton?.addEventListener("click", () => {
        const name = String(categoryName?.value || "").trim();
        if (!name) {
            categoryName?.focus();
            return;
        }
        if (categories.some(category => category.name.toLowerCase() === name.toLowerCase())) {
            alert("A category with that name already exists.");
            return;
        }
        const colorInput = document.getElementById("new-category-color");
        const color = /^#[0-9a-f]{6}$/i.test(colorInput?.value || "")
            ? colorInput.value
            : "#078b91";
        const category = { id: createId(), name, color };
        categories.push(category);
        selectedCategory = category.id;
        saveCategories();
        closeCategoryForm();
        renderCategories();
    });
}

function setupDurationButtons() {
    document.querySelectorAll(".duration-button[data-duration]").forEach(button => {
        button.addEventListener("click", () => {
            selectedDuration = Number(button.dataset.duration) || 25;
            document.querySelectorAll(".duration-button[data-duration]").forEach(item => item.classList.toggle("selected", item === button));
            if (customDuration) customDuration.value = "";
        });
    });
    customDuration?.addEventListener("input", () => {
        const value = Number(customDuration.value);
        if (value > 0) {
            selectedDuration = value;
            document.querySelectorAll(".duration-button[data-duration]").forEach(item => item.classList.remove("selected"));
        }
    });
}

/* =========================================================
   STORAGE FUNCTIONS
   ========================================================= */

function saveTasks() {

    localStorage.setItem(
        TASKS_KEY,
        JSON.stringify(tasks)
    );
}


function saveCategories() {

    localStorage.setItem(
        CATEGORIES_KEY,
        JSON.stringify(categories)
    );
}


function saveStats() {

    localStorage.setItem(
        STATS_KEY,
        JSON.stringify(stats)
    );
}


function saveFiredReminders() {

    localStorage.setItem(
        FIRED_REMINDERS_KEY,
        JSON.stringify(firedReminders)
    );
}


/* =========================================================
   ID
   ========================================================= */

function createId() {

    return (
        Date.now().toString() +
        Math.random()
            .toString(36)
            .substring(2, 8)
    );
}


/* =========================================================
   SCREEN NAVIGATION
   ========================================================= */

function showScreen(name) {

    Object.values(screens).forEach(
        screen => {

            if (screen) {

                screen.classList.remove(
                    "active"
                );

            }

        }
    );


    [
        navHome,
        navCalendar,
        navFocus,
        navStats
    ].forEach(
        button => {

            if (button) {

                button.classList.remove(
                    "active"
                );

            }

        }
    );


    if (screens[name]) {

        screens[name].classList.add(
            "active"
        );

    }


    if (name === "home") {

        navHome.classList.add("active");

        renderHome();

    }


    if (name === "calendar") {

        navCalendar.classList.add("active");

        renderCalendar();

    }


    if (name === "focus") {

        navFocus.classList.add("active");

    }


    if (name === "stats") {

        navStats.classList.add("active");

        renderStats();

    }

}


navHome?.addEventListener("click", () => showScreen("home"));
navCalendar?.addEventListener("click", () => showScreen("calendar"));
navFocus?.addEventListener("click", () => showScreen("focus"));
navStats?.addEventListener("click", () => showScreen("stats"));


/* =========================================================
   PROFILE + THEME
   ========================================================= */

function saveProfile() {

    localStorage.setItem(
        PROFILE_KEY,
        JSON.stringify(profile)
    );
}


function getProfileInitial() {

    const name =
        String(
            profile.name || ""
        ).trim();

    return name
        ? name.charAt(0).toUpperCase()
        : "A";
}


function applyTheme() {

    document.documentElement.dataset.theme =
        darkMode
            ? "dark"
            : "light";


    if (darkModeToggle) {

        darkModeToggle.setAttribute(
            "aria-checked",
            String(darkMode)
        );

        darkModeToggle.classList.toggle(
            "active",
            darkMode
        );

    }


    localStorage.setItem(
        THEME_KEY,
        darkMode
            ? "dark"
            : "light"
    );
}


function renderProfile() {

    const name =
        String(
            profile.name || ""
        ).trim();

    const color =
        profile.color ||
        "#078b91";

    const initial =
        getProfileInitial();


    const avatar =
        document.getElementById(
            "profile-button"
        );


    if (avatar) {

        avatar.textContent =
            initial;

        avatar.style.setProperty(
            "--profile-color",
            color
        );

    }


    const greeting =
        document.querySelector(
            "#home-screen .home-header h1"
        );


    if (greeting) {

        greeting.textContent =
            name
                ? `Hello, ${name}`
                : "Hello, there";

    }


    if (profilePreview) {

        profilePreview.textContent =
            initial;

        profilePreview.style.setProperty(
            "--profile-color",
            color
        );

    }


    if (profilePreviewName) {

        profilePreviewName.textContent =
            name
                ? `Hello, ${name}`
                : "Hello, there";

    }

}


function updateProfilePreview() {

    const name =
        String(
            profileNameInput?.value || ""
        ).trim();

    const color =
        profileColorInput?.value ||
        "#078b91";

    const initial =
        name
            ? name.charAt(0).toUpperCase()
            : "A";


    if (profilePreview) {

        profilePreview.textContent =
            initial;

        profilePreview.style.setProperty(
            "--profile-color",
            color
        );

    }


    if (profilePreviewName) {

        profilePreviewName.textContent =
            name
                ? `Hello, ${name}`
                : "Hello, there";

    }


    if (profileColorValue) {

        profileColorValue.textContent =
            color;

    }

}


function openProfile() {

    if (!profileModal) {

        return;

    }


    if (profileNameInput) {

        profileNameInput.value =
            profile.name || "";

    }


    if (profileColorInput) {

        profileColorInput.value =
            profile.color ||
            "#078b91";

    }


    updateProfilePreview();

    applyTheme();


    profileModal.classList.add(
        "active"
    );

}


function closeProfile() {

    if (!profileModal) {

        return;

    }


    profileModal.classList.remove(
        "active"
    );

}


if (profileButton) {

    profileButton.addEventListener(
        "click",
        openProfile
    );

}


if (profileOverlay) {

    profileOverlay.addEventListener(
        "click",
        closeProfile
    );

}


if (closeProfileButton) {

    closeProfileButton.addEventListener(
        "click",
        closeProfile
    );

}


if (profileNameInput) {

    profileNameInput.addEventListener(
        "input",
        updateProfilePreview
    );

}


if (profileColorInput) {

    profileColorInput.addEventListener(
        "input",
        updateProfilePreview
    );

}


if (darkModeToggle) {

    darkModeToggle.addEventListener(
        "click",
        () => {

            darkMode =
                !darkMode;

            applyTheme();

        }
    );

}


if (saveProfileButton) {

    saveProfileButton.addEventListener(
        "click",
        () => {

            profile = {

                name:
                    String(
                        profileNameInput?.value ||
                        ""
                    ).trim(),

                color:
                    profileColorInput?.value ||
                    "#078b91"

            };


            darkMode =
                Boolean(
                    darkModeToggle?.classList.contains(
                        "active"
                    )
                );


            saveProfile();

            applyTheme();

            renderProfile();

            closeProfile();

        }
    );

}


/* =========================================================
   MODAL
   ========================================================= */

function openTaskModal(task = null) {
    // Set the modal state first so an unrelated category/UI error cannot
    // prevent the edit dialog from appearing.
    editingTaskId = task ? task.id : null;

    if (modalTitle) modalTitle.textContent = task ? "Edit task" : "Add task";
    if (modalEyebrow) modalEyebrow.textContent = task ? "Update your task" : "Create a new task";
    if (saveTaskButton) saveTaskButton.textContent = task ? "Save Changes" : "Add Task";

    if (taskTitle) taskTitle.value = task?.title || "";
    if (taskDate) taskDate.value = task?.date || selectedCalendarDate || formatDate(new Date());
    if (taskTime) taskTime.value = task?.time || "";
    if (taskReminder) taskReminder.value = task?.reminder || "none";
    if (taskRepeat) taskRepeat.value = task?.repeat || "none";

    selectedCategory = task?.categoryId || null;
    selectedDuration = task?.duration || 25;
    if (customDuration) customDuration.value = selectedDuration;
    document.querySelectorAll(".duration-button[data-duration]").forEach(button => {
        button.classList.toggle("selected", Number(button.dataset.duration) === Number(selectedDuration));
    });

    if (taskModal) taskModal.classList.add("active");

    // These are presentation helpers; the edit modal should still open if one fails.
    try { renderCategories(); } catch (error) { console.error("Could not render task categories:", error); }
    try { setupRepeatUI(); } catch (error) { console.error("Could not set up repeat controls:", error); }
}

function closeTaskModal() {

    if (taskModal) {

        taskModal.classList.remove(
            "active"
        );

    }

    editingTaskId =
        null;

}


if (modalOverlay) {

    modalOverlay.addEventListener(
        "click",
        closeTaskModal
    );

}

const closeTaskModalButton = document.getElementById("close-modal");
if (closeTaskModalButton) {
    closeTaskModalButton.addEventListener("click", closeTaskModal);
}

// Delegated edit handler: works for task cards rendered now or later.
document.addEventListener("click", event => {
    const target = event.target instanceof Element
        ? event.target
        : event.target?.parentElement;
    const editButton = target?.closest(".task-edit");
    if (!editButton) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const card = editButton.closest(".task-card");
    const taskId = card?.dataset.taskId;
    const task = tasks.find(item => String(item.id) === String(taskId));

    if (!task) {
        console.error("Aqelio: could not find the task for this Edit button.", taskId);
        return;
    }

    openTaskModal(task);
}, true);

/* =========================================================
   FIXED ADD TASK BUTTONS
   ========================================================= */

function openAddTask(dateOverride = null) {

    editingTaskId = null;

    if (modalTitle) {
        modalTitle.textContent = "Add a task";
    }

    if (modalEyebrow) {
        modalEyebrow.textContent = "NEW TASK";
    }

    if (saveTaskButton) {
        saveTaskButton.textContent = "Add Task";
    }

    if (taskTitle) {
        taskTitle.value = "";
    }

    if (taskDate) {
        taskDate.value =
            dateOverride ||
            selectedCalendarDate ||
            formatDate(new Date());
    }

    if (taskTime) {
        taskTime.value = "";
    }

    if (taskReminder) {
        taskReminder.value = "none";
    }

    selectedCategory =
        categories[0]?.id || null;

    selectedDuration = 25;
    document.querySelectorAll(".duration-button[data-duration]").forEach(button => {
        button.classList.toggle("selected", Number(button.dataset.duration) === 25);
    });

    if (customDuration) {
        customDuration.value = "";
    }

    const selectedDate =
        taskDate?.value ||
        formatDate(new Date());

    const repeatSelect =
        document.getElementById(
            "task-repeat"
        );

    if (repeatSelect) {
        repeatSelect.value = "none";
    }

    const intervalSelect =
        document.getElementById(
            "repeat-interval"
        );

    if (intervalSelect) {
        intervalSelect.value = "1";
    }

    const daySelect =
        document.getElementById(
            "repeat-day"
        );

    if (daySelect) {
        daySelect.value = String(
            parseDate(
                selectedDate
            ).getDay()
        );
    }

    if (
        typeof updateRepeatControls ===
        "function"
    ) {
        updateRepeatControls();
    }

    if (
        typeof updateDurationButtons ===
        "function"
    ) {
        updateDurationButtons();
    }

    if (
        typeof renderCategories ===
        "function"
    ) {
        renderCategories();
    }

    if (
        typeof closeCategoryForm ===
        "function"
    ) {
        closeCategoryForm();
    }

    if (taskModal) {
        taskModal.classList.add(
            "active"
        );
    }
}


/* =========================================================
   ADD TASK BUTTONS
   ========================================================= */

const addTaskTop =
    document.getElementById(
        "add-task-top"
    );

const addTaskMain =
    document.getElementById(
        "add-task-main"
    );

const addTaskCalendar =
    document.getElementById(
        "add-task-calendar"
    );


if (addTaskTop) {

    addTaskTop.addEventListener(
        "click",
        () => {

            openAddTask(
                formatDate(
                    new Date()
                )
            );

        }
    );

}


if (addTaskMain) {

    addTaskMain.addEventListener(
        "click",
        () => {

            // The center Add button follows the selected calendar date
            // only while Calendar is open. From Home, create today's task.
            const dateForNewTask =
                screens.calendar?.classList.contains("active")
                    ? (selectedCalendarDate || formatDate(new Date()))
                    : formatDate(new Date());

            openAddTask(dateForNewTask);

        }
    );

}


if (addTaskCalendar) {

    addTaskCalendar.addEventListener(
        "click",
        () => {

            openAddTask(
                selectedCalendarDate ||
                formatDate(
                    new Date()
                )
            );

        }
    );

}

/* =========================================================
   CATEGORY COLOR PICKER
   ========================================================= */

function setupCategoryColorPicker() {

    const colorInput =
        document.getElementById(
            "new-category-color"
        );


    const colorPreview =
        document.getElementById(
            "new-category-color-preview"
        );

    const colorValue =
        document.getElementById(
            "new-category-color-value"
        );

    if (colorInput && colorPreview) {
        const update = () => {
            colorPreview.style.background = colorInput.value;
            if (colorValue) {
                colorValue.textContent = colorInput.value.toUpperCase();
            }
        };

        colorInput.addEventListener("input", update);
        colorInput.addEventListener("change", update);
        update();
    }

}


/* =========================================================
   REPEAT SYSTEM
   ========================================================= */

function setupRepeatUI() {

    const repeatSelect =
        document.getElementById(
            "task-repeat"
        );


    const repeatOptions =
        document.getElementById(
            "repeat-options"
        );


    const weeklyOptions =
        document.getElementById(
            "weekly-repeat-options"
        );


    if (!repeatSelect) {

        return;

    }


    const updateRepeatUI =
        () => {

            const value =
                repeatSelect.value;


            if (repeatOptions) {

                repeatOptions.classList.toggle(
                    "active",
                    value !== "none"
                );

            }


            if (weeklyOptions) {

                weeklyOptions.classList.toggle(
                    "active",
                    value === "weekly"
                );

            }

        };


    repeatSelect.removeEventListener(
        "change",
        updateRepeatUI
    );


    repeatSelect.addEventListener(
        "change",
        updateRepeatUI
    );


    updateRepeatUI();

}


/* =========================================================
   RECURRING TASK HELPERS
   ========================================================= */

function getWeekdayNumber(
    dateString
) {

    return parseDate(
        dateString
    ).getDay();

}


function isOccurrenceForDate(
    task,
    dateString
) {

    if (!task || !task.date) {

        return false;

    }


    const repeat =
        task.repeat || "none";


    if (repeat === "none") {

        return (
            task.date ===
            dateString
        );

    }


    const start =
        parseDate(
            task.date
        );


    const current =
        parseDate(
            dateString
        );


    if (
        current <
        start
    ) {

        return false;

    }


    const days =
        daysBetween(
            task.date,
            dateString
        );


    if (repeat === "daily") {

        return true;

    }


    if (repeat === "weekdays") {

        const weekday =
            current.getDay();

        return (
            weekday >= 1 &&
            weekday <= 5
        );

    }


    if (
        repeat === "weekly" ||
        repeat === "biweekly" ||
        repeat === "triweekly" ||
        repeat === "quadweekly"
    ) {

        const interval =
            repeat === "weekly"
                ? 1
                : repeat === "biweekly"
                    ? 2
                    : repeat === "triweekly"
                        ? 3
                        : 4;


        const weeks =
            Math.floor(
                days / 7
            );


        if (
            days % 7 !==
            0
        ) {

            return false;

        }


        return (
            weeks %
                interval ===
            0
        );

    }


    return false;

}


function getTasksForDate(
    dateString
) {

    const result = [];


    tasks.forEach(
        task => {

            if (
                isOccurrenceForDate(
                    task,
                    dateString
                )
            ) {

                result.push(
                    task
                );

            }

        }
    );


    return result;

}


/* =========================================================
   OCCURRENCE COMPLETION
   ========================================================= */

function getCompletionKey(
    taskId,
    dateString
) {

    return (
        `${taskId}__${dateString}`
    );

}


function isTaskCompletedForDate(
    task,
    dateString
) {

    if (
        task.repeat &&
        task.repeat !== "none"
    ) {

        const key =
            getCompletionKey(
                task.id,
                dateString
            );


        return Boolean(
            task.completedOccurrences &&
            task.completedOccurrences.includes(
                key
            )
        );

    }


    return Boolean(
        task.completed
    );

}


function setTaskCompletedForDate(
    task,
    dateString,
    completed
) {

    if (
        task.repeat &&
        task.repeat !== "none"
    ) {

        if (
            !Array.isArray(
                task.completedOccurrences
            )
        ) {

            task.completedOccurrences =
                [];

        }


        const key =
            getCompletionKey(
                task.id,
                dateString
            );


        if (completed) {

            if (
                !task.completedOccurrences.includes(
                    key
                )
            ) {

                task.completedOccurrences.push(
                    key
                );

                stats.completed++;

            }

        } else {

            const index =
                task.completedOccurrences.indexOf(
                    key
                );


            if (index !== -1) {

                task.completedOccurrences.splice(
                    index,
                    1
                );

                stats.completed =
                    Math.max(
                        0,
                        stats.completed - 1
                    );

            }

        }

    } else {

        const previous =
            Boolean(
                task.completed
            );


        task.completed =
            completed;


        if (
            completed &&
            !previous
        ) {

            stats.completed++;

        }


        if (
            !completed &&
            previous
        ) {

            stats.completed =
                Math.max(
                    0,
                    stats.completed - 1
                );

        }

    }


    saveTasks();

    saveStats();

}


/* =========================================================
   SAVE TASK
   ========================================================= */

if (saveTaskButton) {

    saveTaskButton.addEventListener(
        "click",
        () => {

            const title =
                String(
                    taskTitle?.value ||
                    ""
                ).trim();


            if (!title) {

                alert(
                    "Please enter a task title."
                );

                return;

            }


            const date =
                taskDate?.value ||
                formatDate(new Date());


            const time =
                taskTime?.value ||
                "";


            const reminder =
                taskReminder?.value ||
                "none";


            const repeat =
                taskRepeat?.value ||
                "none";


            if (editingTaskId) {

                const task =
                    tasks.find(
                        item =>
                            String(item.id) ===
                            String(editingTaskId)
                    );


                if (task) {

                    task.title =
                        title;

                    task.date =
                        date;

                    task.time =
                        time;

                    task.reminder =
                        reminder;

                    task.repeat =
                        repeat;

                    task.categoryId =
                        selectedCategory;

                    task.duration =
                        Number(
                            customDuration?.value ||
                            selectedDuration ||
                            25
                        );


                    if (
                        repeat ===
                        "weekly"
                    ) {

                        task.weekdays =
                            getSelectedWeekdays();

                    } else {

                        task.weekdays =
                            [];

                    }

                }

            } else {

                const task = {

                    id:
                        createId(),

                    title,

                    date,

                    time,

                    reminder,

                    repeat,

                    categoryId:
                        selectedCategory,

                    duration:
                        Number(
                            customDuration?.value ||
                            selectedDuration ||
                            25
                        ),

                    completed:
                        false,

                    completedOccurrences:
                        [],

                    weekdays:
                        repeat === "weekly"
                            ? getSelectedWeekdays()
                            : []

                };


                tasks.push(
                    task
                );

            }


            saveTasks();


            closeTaskModal();


            renderEverything();


            scheduleAllReminders();

        }
    );

}


/* =========================================================
   WEEKDAY SELECTION
   ========================================================= */

function getSelectedWeekdays() {

    const checkboxes =
        document.querySelectorAll(
            "[data-repeat-weekday]"
        );


    return Array.from(
        checkboxes
    )
        .filter(
            checkbox =>
                checkbox.checked
        )
        .map(
            checkbox =>
                Number(
                    checkbox.dataset.repeatWeekday
                )
        );

}


/* =========================================================
   TASK RENDERING
   ========================================================= */

function getCategory(
    categoryId
) {

    return categories.find(
        category =>
            String(category.id) ===
            String(categoryId)
    );

}


function renderTaskCard(
    task,
    occurrenceDate
) {

    const category =
        getCategory(
            task.categoryId
        );


    const completed =
        isTaskCompletedForDate(
            task,
            occurrenceDate
        );


    const card =
        document.createElement(
            "div"
        );


    card.className =
        "task-card";

    card.dataset.taskId = task.id;


    if (completed) {

        card.classList.add(
            "completed"
        );

    }


    const categoryColor =
        category?.color ||
        "#078b91";


    card.style.setProperty(
        "--task-category-color",
        categoryColor
    );


    const timeLabel =
        task.time
            ? formatTime(task.time)
            : "";


    card.innerHTML = `

        <button
            class="task-check"
            type="button"
            aria-label="${
                completed
                    ? "Mark incomplete"
                    : "Mark complete"
            }"
        >
            ${completed ? "✓" : ""}
        </button>

        <div class="task-main">

            <div class="task-title-row">

                <strong class="task-title">
                    ${escapeHtml(task.title)}
                </strong>

                ${
                    task.repeat &&
                    task.repeat !== "none"
                        ? `
                            <span class="repeat-badge">
                                ↻
                            </span>
                          `
                        : ""
                }

            </div>

            <div class="task-meta">

                ${
                    timeLabel
                        ? `<span>${escapeHtml(timeLabel)}</span>`
                        : ""
                }

                ${
                    category
                        ? `
                            <span
                                class="task-category"
                                style="
                                    --category-color:
                                        ${category.color}
                                "
                            >
                                ${escapeHtml(category.name)}
                            </span>
                          `
                        : ""
                }

            </div>

        </div>

        <div class="task-actions">

            <button
                class="task-edit"
                type="button"
                aria-label="Edit task"
            >
                ✎
            </button>

            <button
                class="task-delete"
                type="button"
                aria-label="Delete task"
            >
                ×
            </button>

        </div>

    `;


    const checkButton =
        card.querySelector(
            ".task-check"
        );


    checkButton.addEventListener(
        "click",
        event => {

            event.stopPropagation();


            setTaskCompletedForDate(
                task,
                occurrenceDate,
                !completed
            );


            renderEverything();

        }
    );


    const deleteButton =
        card.querySelector(
            ".task-delete"
        );


    deleteButton.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            deleteTask(
                task.id
            );

        }
    );


    card.addEventListener(
        "click",
        () => {

            openTaskModal(
                task
            );

        }
    );


    return card;

}


/* =========================================================
   HOME
   ========================================================= */

function renderHome() {

    const container =
        document.getElementById(
            "task-list"
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    const today =
        formatDate(
            new Date()
        );


    const todayTasks = getTasksForDate(today);
    const completedCount = todayTasks.filter(task => isTaskCompletedForDate(task, today)).length;
    const progressText = document.getElementById("progress-text");
    const progressPercent = document.getElementById("progress-percent");
    const progressFill = document.getElementById("progress-fill");
    const percent = todayTasks.length ? Math.round(completedCount / todayTasks.length * 100) : 0;
    if (progressText) progressText.textContent = `${completedCount} of ${todayTasks.length} tasks completed`;
    if (progressPercent) progressPercent.textContent = `${percent}%`;
    if (progressFill) progressFill.style.width = `${percent}%`;

    if (todayTasks.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    ✓
                </div>

                <h3>
                    Nothing scheduled
                </h3>

                <p>
                    You're all caught up.
                </p>

            </div>

        `;

        return;

    }


    todayTasks
        .sort(
            (a, b) => {

                if (!a.time) return 1;

                if (!b.time) return -1;

                return a.time.localeCompare(
                    b.time
                );

            }
        )
        .forEach(
            task => {

                container.appendChild(
                    renderTaskCard(
                        task,
                        today
                    )
                );

            }
        );

}


/* =========================================================
   CALENDAR
   ========================================================= */

function renderCalendar() {

    const monthLabel =
        document.getElementById(
            "calendar-month"
        );


    const grid =
        document.getElementById(
            "calendar-grid"
        );


    if (
        !monthLabel ||
        !grid
    ) {

        return;

    }


    const year =
        calendarDate.getFullYear();


    const month =
        calendarDate.getMonth();


    monthLabel.textContent =
        calendarDate.toLocaleDateString(
            undefined,
            {
                month: "long",
                year: "numeric"
            }
        );


    grid.innerHTML =
        "";


    const firstDay =
        new Date(
            year,
            month,
            1
        );


    const lastDay =
        new Date(
            year,
            month + 1,
            0
        );


    const startingDay =
        firstDay.getDay();


    const daysInMonth =
        lastDay.getDate();


    for (
        let i = 0;
        i < startingDay;
        i++
    ) {

        const empty =
            document.createElement(
                "div"
            );

        empty.className =
            "calendar-day empty";

        grid.appendChild(
            empty
        );

    }


    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const date =
            new Date(
                year,
                month,
                day
            );


        const dateString =
            formatDate(date);


        const dayElement =
            document.createElement(
                "button"
            );


        dayElement.type =
            "button";


        dayElement.className =
            "calendar-day";


        if (
            dateString ===
            formatDate(new Date())
        ) {

            dayElement.classList.add(
                "today"
            );

        }


        if (
            dateString ===
            selectedCalendarDate
        ) {

            dayElement.classList.add(
                "selected"
            );

        }


        const dayTasks =
            getTasksForDate(
                dateString
            );


        dayElement.innerHTML = `

            <span class="calendar-day-number">
                ${day}
            </span>

            ${
                dayTasks.length
                    ? `
                        <span class="calendar-task-dots">
                            ${dayTasks
                                .slice(0, 3)
                                .map(
                                    task => {

                                        const category =
                                            getCategory(
                                                task.categoryId
                                            );

                                        return `
                                            <i
                                                style="
                                                    background:
                                                        ${
                                                            category?.color ||
                                                            "#078b91"
                                                        }
                                                "
                                            ></i>
                                        `;

                                    }
                                )
                                .join("")}
                        </span>
                      `
                    : ""
            }

        `;


        dayElement.addEventListener(
            "click",
            () => {

                selectedCalendarDate =
                    dateString;


                renderCalendar();

                renderCalendarTasks();

            }
        );


        grid.appendChild(
            dayElement
        );

    }


    renderCalendarTasks();

}


function renderCalendarTasks() {

    const container =
        document.getElementById(
            "calendar-task-list"
        );


    const label =
        document.getElementById(
            "calendar-selected-date"
        );


    if (!container) {

        return;

    }


    const date =
        selectedCalendarDate ||
        formatDate(new Date());


    if (label) {

        label.textContent =
            parseDate(
                date
            ).toLocaleDateString(
                undefined,
                {
                    weekday: "long",
                    month: "long",
                    day: "numeric"
                }
            );

    }


    container.innerHTML =
        "";


    const dayTasks =
        getTasksForDate(
            date
        );


    if (dayTasks.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    +
                </div>

                <h3>
                    No tasks
                </h3>

                <p>
                    Nothing scheduled for this day.
                </p>

            </div>

        `;

        return;

    }


    dayTasks
        .sort(
            (a, b) => {

                if (!a.time) return 1;

                if (!b.time) return -1;

                return a.time.localeCompare(
                    b.time
                );

            }
        )
        .forEach(
            task => {

                container.appendChild(
                    renderTaskCard(
                        task,
                        date
                    )
                );

            }
        );

}


/* =========================================================
   CALENDAR CONTROLS
   ========================================================= */

const previousMonth =
    document.getElementById(
        "previous-month"
    );


const nextMonth =
    document.getElementById(
        "next-month"
    );


if (previousMonth) {

    previousMonth.addEventListener(
        "click",
        () => {

            calendarDate =
                new Date(
                    calendarDate.getFullYear(),
                    calendarDate.getMonth() - 1,
                    1
                );


            renderCalendar();

        }
    );

}


if (nextMonth) {

    nextMonth.addEventListener(
        "click",
        () => {

            calendarDate =
                new Date(
                    calendarDate.getFullYear(),
                    calendarDate.getMonth() + 1,
                    1
                );


            renderCalendar();

        }
    );

}


/* =========================================================
   FORMAT TIME
   ========================================================= */

function formatTime(
    time
) {

    if (!time) {

        return "";

    }


    const [hourString, minute] =
        time.split(":");


    let hour =
        Number(hourString);


    const suffix =
        hour >= 12
            ? "PM"
            : "AM";


    hour =
        hour % 12 ||
        12;


    return `${hour}:${minute} ${suffix}`;

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(
    value
) {

    return String(
        value
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   DELETE TASK
   ========================================================= */

function deleteTask(
    taskId
) {

    if (
        typeof window.AqelioAndroid !==
            "undefined" &&
        typeof window.AqelioAndroid.cancelReminder ===
            "function"
    ) {

        window.AqelioAndroid.cancelReminder(
            String(taskId)
        );

    }


    const confirmed =
        confirm(
            "Delete this task?"
        );


    if (!confirmed) {

        return;

    }


    tasks =
        tasks.filter(
            task =>
                String(task.id) !==
                String(taskId)
        );


    saveTasks();

    renderEverything();

}


/* =========================================================
   RENDER EVERYTHING
   ========================================================= */

function renderEverything() {
    // Keep one rendering failure from preventing the other screens from updating.
    for (const render of [renderHome, renderCalendar, renderStats, renderCategories]) {
        try {
            render();
        } catch (error) {
            console.error("Aqelio render error:", error);
        }
    }
}


/* =========================================================
   REMINDER SYSTEM
   ========================================================= */

const reminderTimers =
    new Map();


function getReminderMinutes(
    reminder
) {

    if (
        !reminder ||
        reminder === "none"
    ) {

        return 0;

    }


    if (
        reminder === "10"
    ) {

        return 10;

    }


    if (
        reminder === "30"
    ) {

        return 30;

    }


    if (
        reminder === "60"
    ) {

        return 60;

    }


    return 0;

}


function getReminderTime(
    task,
    occurrenceDate
) {

    if (
        !task ||
        !task.time ||
        !task.reminder ||
        task.reminder === "none"
    ) {

        return null;

    }


    const [
        hour,
        minute
    ] =
        task.time
            .split(":")
            .map(Number);


    const reminderMinutes =
        getReminderMinutes(
            task.reminder
        );


    const date =
        parseDate(
            occurrenceDate
        );


    date.setHours(
        hour,
        minute,
        0,
        0
    );


    date.setMinutes(
        date.getMinutes() -
        reminderMinutes
    );


    return date;

}


function getReminderKey(
    task,
    occurrenceDate,
    reminderTime
) {

    return [
        task.id,
        occurrenceDate,
        reminderTime
    ].join("_");

}


function requestNotificationPermission() {

    if (
        !("Notification" in window)
    ) {

        return Promise.resolve(
            false
        );

    }


    if (
        Notification.permission ===
        "granted"
    ) {

        return Promise.resolve(
            true
        );

    }


    if (
        Notification.permission ===
        "denied"
    ) {

        return Promise.resolve(
            false
        );

    }


    return Notification.requestPermission()
        .then(
            permission =>
                permission ===
                "granted"
        )
        .catch(
            () => false
        );

}


function playReminderSound() {

    try {

        const AudioContext =
            window.AudioContext ||
            window.webkitAudioContext;


        if (!AudioContext) {

            return;

        }


        const context =
            new AudioContext();


        const oscillator =
            context.createOscillator();


        const gain =
            context.createGain();


        oscillator.type =
            "sine";


        oscillator.frequency.value =
            880;


        gain.gain.setValueAtTime(
            0.0001,
            context.currentTime
        );


        gain.gain.exponentialRampToValueAtTime(
            0.15,
            context.currentTime +
                0.02
        );


        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            context.currentTime +
                0.5
        );


        oscillator.connect(
            gain
        );


        gain.connect(
            context.destination
        );


        oscillator.start();

        oscillator.stop(
            context.currentTime +
                0.5
        );

    } catch (error) {

        console.warn(
            "Reminder sound unavailable:",
            error
        );

    }

}


/* =========================================================
   NATIVE AND BROWSER REMINDERS
   ========================================================= */

function scheduleReminder(
    task
) {

    if (
        !task ||
        !task.reminder ||
        task.reminder === "none" ||
        !task.time
    ) {

        return;

    }


    const occurrences =
        getUpcomingReminderOccurrences(
            task
        );


    occurrences.forEach(
        occurrence => {

            const reminderTime =
                getReminderTime(
                    task,
                    occurrence
                );


            if (!reminderTime) {

                return;

            }


            const when =
                reminderTime.getTime();


            if (
                when <=
                Date.now()
            ) {

                return;

            }


            const reminderKey =
                getReminderKey(
                    task,
                    occurrence,
                    when
                );


            if (
                typeof window.AqelioAndroid !==
                    "undefined" &&
                typeof window.AqelioAndroid.scheduleReminder ===
                    "function"
            ) {

                window.AqelioAndroid.scheduleReminder(
                    String(task.id),
                    String(task.title),
                    when
                );

                return;

            }


            const delay =
                when -
                Date.now();


            if (
                delay >
                2147483647
            ) {

                return;

            }


            if (
                reminderTimers.has(
                    reminderKey
                )
            ) {

                clearTimeout(
                    reminderTimers.get(
                        reminderKey
                    )
                );

            }


            const timer =
                setTimeout(
                    () => {

                        if (
                            firedReminders.includes(
                                reminderKey
                            )
                        ) {

                            return;

                        }


                        firedReminders.push(
                            reminderKey
                        );


                        saveFiredReminders();


                        sendReminderNotification(
                            task,
                            occurrence
                        );


                        reminderTimers.delete(
                            reminderKey
                        );

                    },
                    delay
                );


            reminderTimers.set(
                reminderKey,
                timer
            );

        }
    );

}


function getUpcomingReminderOccurrences(
    task
) {

    const occurrences =
        [];


    const today =
        new Date();


    for (
        let i = 0;
        i < 60;
        i++
    ) {

        const date =
            new Date(
                today
            );


        date.setDate(
            date.getDate() +
            i
        );


        const dateString =
            formatDate(
                date
            );


        if (
            isOccurrenceForDate(
                task,
                dateString
            )
        ) {

            occurrences.push(
                dateString
            );

        }

    }


    return occurrences;

}


function scheduleAllReminders() {

    tasks.forEach(
        task => {

            scheduleReminder(
                task
            );

        }
    );

}


/* =========================================================
   SEND REMINDER
   ========================================================= */

async function sendReminderNotification(
    task,
    occurrenceDate
) {

    playReminderSound();


    const reminderLabel =
        task.reminder === "10"
            ? "10 minutes before"
            : task.reminder === "30"
                ? "30 minutes before"
                : task.reminder === "60"
                    ? "1 hour before"
                    : "Reminder";


    if (
        "Notification" in window &&
        Notification.permission ===
            "granted"
    ) {

        try {

            const notification =
                new Notification(
                    "Aqelio Reminder",
                    {
                        body:
                            task.title,

                        icon:
                            "Aqelio.jpg",

                        tag:
                            `aqelio-${task.id}-${occurrenceDate}`,

                        requireInteraction:
                            false
                    }
                );


            notification.onclick =
                () => {

                    window.focus();

                    showScreen(
                        "calendar"
                    );

                    selectedCalendarDate =
                        occurrenceDate;

                    renderCalendar();

                };

        } catch (error) {

            console.error(
                "Notification error:",
                error
            );

        }

    } else {

        showInAppReminder(
            task,
            reminderLabel
        );

    }

}


/* =========================================================
   IN-APP REMINDER
   ========================================================= */

function showInAppReminder(
    task,
    reminderLabel
) {

    const existing =
        document.getElementById(
            "aqelio-reminder-popup"
        );


    if (existing) {

        existing.remove();

    }


    const popup =
        document.createElement(
            "div"
        );


    popup.id =
        "aqelio-reminder-popup";


    popup.innerHTML = `

        <div class="aqelio-reminder-icon">
            🔔
        </div>

        <div class="aqelio-reminder-content">

            <strong>
                Aqelio Reminder
            </strong>

            <span>
                ${escapeHtml(task.title)}
            </span>

            <small>
                ${escapeHtml(reminderLabel)}
            </small>

        </div>

        <button
            type="button"
            aria-label="Close reminder"
        >
            ×
        </button>

    `;


    Object.assign(
        popup.style,
        {
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: "99999",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "14px 16px",
            maxWidth: "340px",
            borderRadius: "16px",
            background: "#ffffff",
            boxShadow:
                "0 12px 35px rgba(0,0,0,0.18)",
            border:
                "1px solid rgba(7,139,145,0.18)",
            fontFamily:
                "inherit"
        }
    );


    const closeButton =
        popup.querySelector(
            "button"
        );


    Object.assign(
        closeButton.style,
        {
            border: "none",
            background: "transparent",
            fontSize: "22px",
            cursor: "pointer",
            opacity: "0.6"
        }
    );


    closeButton.addEventListener(
        "click",
        () => popup.remove()
    );


    document.body.appendChild(
        popup
    );


    setTimeout(
        () => {

            if (
                popup.parentNode
            ) {

                popup.remove();

            }

        },
        10000
    );
}


/* =========================================================
   CHECK REMINDERS
   ========================================================= */

function checkReminders() {

    const now =
        new Date();


    const today =
        formatDate(now);


    const todayTasks =
        getTasksForDate(
            today
        );


    todayTasks.forEach(
        task => {

            if (
                !task.time ||
                !task.reminder ||
                task.reminder ===
                    "none"
            ) {

                return;

            }


            const reminderTime =
                getReminderTime(
                    task,
                    today
                );


            if (!reminderTime) {

                return;

            }


            const difference =
                now.getTime() -
                reminderTime.getTime();


            if (
                difference >= 0 &&
                difference < 60000
            ) {

                const key =
                    getReminderKey(
                        task,
                        today,
                        reminderTime.getTime()
                    );


                if (
                    !firedReminders.includes(
                        key
                    )
                ) {

                    firedReminders.push(
                        key
                    );


                    saveFiredReminders();


                    sendReminderNotification(
                        task,
                        today
                    );

                }

            }

        }
    );


    cleanupFiredReminders();
}


/* =========================================================
   CLEANUP REMINDERS
   ========================================================= */

function cleanupFiredReminders() {

    if (
        firedReminders.length <= 500
    ) {

        return;

    }


    firedReminders =
        firedReminders.slice(
            -250
        );


    saveFiredReminders();
}


/* =========================================================
   REQUEST NOTIFICATIONS
   ========================================================= */

let notificationPermissionRequested =
    false;


async function initializeNotifications() {

    if (
        notificationPermissionRequested
    ) {

        return;

    }


    notificationPermissionRequested =
        true;


    await requestNotificationPermission();


    checkReminders();
}


document.addEventListener(
    "click",
    () => {

        initializeNotifications();

    },
    {
        once: true
    }
);


checkReminders();


setInterval(
    checkReminders,
    30000
);


document.addEventListener(
    "visibilitychange",
    () => {

        if (
            !document.hidden
        ) {

            checkReminders();

        }

    }
);


/* =========================================================
   FOCUS TIMER
   ========================================================= */

let focusSeconds =
    25 * 60;


let focusInterval =
    null;


let currentFocusTask =
    null;


function updateFocusDisplay() {

    const minutes =
        Math.floor(
            focusSeconds / 60
        );


    const seconds =
        focusSeconds % 60;


    const element =
        document.getElementById(
            "focus-time"
        );


    if (!element) {

        return;

    }


    element.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}


function startFocusForTask(
    task
) {

    currentFocusTask =
        task;


    focusSeconds =
        (
            task.duration ||
            25
        ) * 60;


    updateFocusDisplay();


    showScreen(
        "focus"
    );

}


document.getElementById(
    "start-focus-button"
).addEventListener(
    "click",
    () => {

        if (focusInterval) {

            return;

        }


        focusInterval =
            setInterval(
                () => {

                    if (
                        focusSeconds <= 0
                    ) {

                        clearInterval(
                            focusInterval
                        );


                        focusInterval =
                            null;


                        stats.focus++;


                        stats.minutes +=
                            currentFocusTask
                                ?.duration ||
                            25;


                        saveStats();


                        playReminderSound();


                        renderStats();


                        return;

                    }


                    focusSeconds--;


                    updateFocusDisplay();

                },
                1000
            );

    }
);


document.getElementById(
    "reset-focus-button"
).addEventListener(
    "click",
    () => {

        clearInterval(
            focusInterval
        );


        focusInterval =
            null;


        focusSeconds =
            (
                currentFocusTask
                    ?.duration ||
                25
            ) * 60;


        updateFocusDisplay();

    }
);


document.getElementById(
    "home-focus-button"
).addEventListener(
    "click",
    () => {

        currentFocusTask =
            null;


        focusSeconds =
            25 * 60;


        updateFocusDisplay();


        showScreen(
            "focus"
        );

    }
);


/* =========================================================
   STATS
   ========================================================= */

function renderStats() {

    const completed =
        document.getElementById(
            "total-completed"
        );


    const focus =
        document.getElementById(
            "total-focus"
        );


    const minutes =
        document.getElementById(
            "total-minutes"
        );


    if (completed) {

        completed.textContent =
            stats.completed;

    }


    if (focus) {

        focus.textContent =
            stats.focus;

    }


    if (minutes) {

        minutes.textContent =
            stats.minutes;

    }

}


/* =========================================================
   AQELIO PREMIUM ACCESS + PAYWALL PREVIEW
   Local-only prototype. Real paid access must be verified by a
   trusted payment/backend service before public launch.
   ========================================================= */

function hasAqelioPremium() {
    return localStorage.getItem(PREMIUM_KEY) === "true";
}

function openAqelioPaywall() {
    const modal = document.getElementById("premium-paywall-modal");
    if (!modal) return;
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("premium-paywall-open");
    modal.querySelector(".premium-paywall-panel")?.focus();
}

function closeAqelioPaywall() {
    const modal = document.getElementById("premium-paywall-modal");
    if (!modal) return;
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("premium-paywall-open");
}

function requireAqelioPremium() {
    if (hasAqelioPremium()) return true;
    openAqelioPaywall();
    return false;
}

function syncAqelioPremiumUI() {
    const premium = hasAqelioPremium();
    const content = document.getElementById("premium-tools-content");
    const locked = document.getElementById("premium-locked-screen");
    if (content) content.hidden = !premium;
    if (locked) locked.hidden = premium;
    const pill = document.querySelector(".premium-tools-heading .premium-pill");
    if (pill) pill.textContent = premium ? "PREMIUM ACTIVE" : "PREMIUM";
}

function setupAqelioPaywall() {
    syncAqelioPremiumUI();
    document.getElementById("open-premium-paywall")?.addEventListener("click", openAqelioPaywall);
    document.getElementById("close-premium-paywall")?.addEventListener("click", closeAqelioPaywall);
    document.getElementById("premium-later-button")?.addEventListener("click", closeAqelioPaywall);
    document.querySelectorAll("[data-close-premium-paywall]").forEach(button => button.addEventListener("click", closeAqelioPaywall));
    document.getElementById("premium-upgrade-button")?.addEventListener("click", () => {
        const note = document.querySelector(".premium-payment-note");
        if (note) note.textContent = "Checkout is not connected yet, so you cannot purchase Premium from this preview. No payment has been taken.";
    });
    document.addEventListener("keydown", event => {
        if (event.key === "Escape") closeAqelioPaywall();
    });
}

/* =========================================================
   AQELIO PLUS — LOCAL PREMIUM UTILITIES
   Natural-language quick add, non-overlapping time blocks,
   calendar export and portable backup/restore.
   ========================================================= */

function parseNaturalTaskPhrase(rawPhrase) {
    const now = new Date();
    let text = String(rawPhrase || "").trim();
    if (!text) return { error: "Type a task and a time, such as ‘Lunch tomorrow at 1 pm’." };

    let date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lower = text.toLowerCase();
    const weekdayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

    if (/\btomorrow\b/i.test(text)) {
        date.setDate(date.getDate() + 1);
        text = text.replace(/\btomorrow\b/i, " ");
    } else if (/\btoday\b/i.test(text)) {
        text = text.replace(/\btoday\b/i, " ");
    } else if (/\bnext week\b/i.test(text)) {
        date.setDate(date.getDate() + 7);
        text = text.replace(/\bnext week\b/i, " ");
    } else {
        const weekdayMatch = lower.match(/\b(next\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);
        if (weekdayMatch) {
            const targetDay = weekdayNames.indexOf(weekdayMatch[2]);
            let delta = (targetDay - date.getDay() + 7) % 7;
            if (delta === 0 || weekdayMatch[1]) delta += 7;
            date.setDate(date.getDate() + delta);
            text = text.replace(new RegExp("\\b" + weekdayMatch[0].replace(/\s+/g, "\\s+") + "\\b", "i"), " ");
        }
    }

    // Accept explicit dates like 2026-11-04 or 11/4.
    const isoMatch = text.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
    const slashMatch = !isoMatch && text.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
    if (isoMatch) {
        date = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
        text = text.replace(isoMatch[0], " ");
    } else if (slashMatch) {
        let year = slashMatch[3] ? Number(slashMatch[3]) : now.getFullYear();
        if (year < 100) year += 2000;
        date = new Date(year, Number(slashMatch[1]) - 1, Number(slashMatch[2]));
        if (!slashMatch[3] && date < new Date(now.getFullYear(), now.getMonth(), now.getDate())) date.setFullYear(date.getFullYear() + 1);
        text = text.replace(slashMatch[0], " ");
    }

    let time = "";
    const timeMatch = text.match(/\b(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)\b/i)
        || text.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\b/i);
    if (timeMatch) {
        let hour = Number(timeMatch[1]);
        const minute = Number(timeMatch[2] || 0);
        const meridiem = (timeMatch[3] || "").toLowerCase().replace(/\./g, "");
        if (minute > 59 || hour > 23 || (meridiem && (hour < 1 || hour > 12))) return { error: "That time doesn't look valid. Try a time like 1:30 pm." };
        if (meridiem === "pm" && hour < 12) hour += 12;
        if (meridiem === "am" && hour === 12) hour = 0;
        if (!meridiem && timeMatch[0].toLowerCase().includes("at") && hour <= 7) hour += 12; // common “at 1” means 1 pm
        time = String(hour).padStart(2, "0") + ":" + String(minute).padStart(2, "0");
        text = text.replace(timeMatch[0], " ");
    }

    text = text.replace(/\b(on|for|at)\b/gi, " ").replace(/[,.!?]+$/g, "").replace(/\s+/g, " ").trim();
    if (!text) return { error: "I found the date/time, but not a task name. Add a task name too." };
    return { title: text.charAt(0).toUpperCase() + text.slice(1), date: formatDate(date), time };
}

function addTaskFromNaturalLanguage(phrase) {
    if (!requireAqelioPremium()) return false;
    const parsed = parseNaturalTaskPhrase(phrase);
    const feedback = document.getElementById("natural-task-feedback");
    if (parsed.error) {
        if (feedback) feedback.textContent = parsed.error;
        return false;
    }
    const task = {
        id: createId(), title: parsed.title, date: parsed.date, time: parsed.time,
        reminder: "none", repeat: "none", categoryId: categories[0]?.id || null,
        duration: 25, completed: false, completedOccurrences: [], weekdays: []
    };
    tasks.push(task);
    saveTasks();
    renderHome();
    renderCalendar();
    if (feedback) feedback.textContent = `Added “${task.title}” for ${task.date}${task.time ? " at " + task.time : " (no time set)"}. You can edit it anytime.`;
    return true;
}

function timeToMinutes(value) {
    if (!value || !/^\d{2}:\d{2}$/.test(value)) return null;
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
}

function minutesToTime(value) {
    return String(Math.floor(value / 60)).padStart(2, "0") + ":" + String(value % 60).padStart(2, "0");
}

function buildSmartSchedule() {
    if (!requireAqelioPremium()) return;
    const dateInput = document.getElementById("smart-schedule-date");
    const startInput = document.getElementById("smart-schedule-start");
    const endInput = document.getElementById("smart-schedule-end");
    const feedback = document.getElementById("smart-schedule-feedback");
    const date = dateInput?.value || formatDate(new Date());
    const start = timeToMinutes(startInput?.value || "09:00");
    const end = timeToMinutes(endInput?.value || "17:00");
    if (start === null || end === null || start >= end) {
        if (feedback) feedback.textContent = "Choose a valid start and end time; the end must be later than the start.";
        return;
    }

    const dayTasks = getTasksForDate(date);
    const timed = dayTasks.filter(task => task.time && !isTaskCompletedForDate(task, date));
    const occupied = timed.map(task => {
        const startMinute = timeToMinutes(task.time);
        return { start: startMinute, end: startMinute + Math.max(5, Number(task.duration) || 25) };
    }).filter(slot => slot.start !== null);
    const unscheduled = dayTasks.filter(task => !task.time && (!task.repeat || task.repeat === "none") && !isTaskCompletedForDate(task, date));
    let placed = 0;
    let cursor = start;

    unscheduled.forEach(task => {
        const duration = Math.max(5, Number(task.duration) || 25);
        let candidate = cursor;
        while (candidate + duration <= end) {
            const conflict = occupied.find(slot => candidate < slot.end && candidate + duration > slot.start);
            if (!conflict) break;
            candidate = Math.ceil(conflict.end / 5) * 5;
        }
        if (candidate + duration <= end) {
            task.time = minutesToTime(candidate);
            occupied.push({ start: candidate, end: candidate + duration });
            occupied.sort((a, b) => a.start - b.start);
            cursor = candidate + duration + 5;
            placed++;
        }
    });

    if (placed) {
        saveTasks();
        renderHome();
        renderCalendar();
        if (feedback) feedback.textContent = `Scheduled ${placed} task${placed === 1 ? "" : "s"} on ${date}. Tasks that did not fit remain unscheduled.`;
    } else if (feedback) {
        feedback.textContent = unscheduled.length ? "No unscheduled tasks fit in that window. Try extending the day or shortening task durations." : "There are no incomplete, unscheduled tasks for that date.";
    }
}

function downloadTextFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escapeICS(value) {
    return String(value || "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function exportCalendarICS() {
    if (!requireAqelioPremium()) return;
    const events = tasks.filter(task => task.date && !task.completed);
    if (!events.length) {
        const feedback = document.getElementById("backup-feedback");
        if (feedback) feedback.textContent = "There are no tasks to export yet.";
        return;
    }
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Aqelio//Aqelio Calendar//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
    events.forEach(task => {
        const startDate = (task.date || formatDate(new Date())).replace(/-/g, "");
        const startTime = task.time || "09:00";
        const [hour, minute] = startTime.split(":").map(Number);
        const start = new Date(Number(startDate.slice(0, 4)), Number(startDate.slice(4, 6)) - 1, Number(startDate.slice(6, 8)), hour, minute);
        const finish = new Date(start.getTime() + Math.max(5, Number(task.duration) || 25) * 60000);
        const formatLocal = d => formatDate(d).replace(/-/g, "") + "T" + String(d.getHours()).padStart(2, "0") + String(d.getMinutes()).padStart(2, "0") + "00";
        lines.push("BEGIN:VEVENT", `UID:${String(task.id).replace(/[^a-zA-Z0-9-]/g, "")}@aqelio.local`, `DTSTAMP:${stamp}`, `DTSTART:${formatLocal(start)}`, `DTEND:${formatLocal(finish)}`, `SUMMARY:${escapeICS(task.title)}`, "END:VEVENT");
    });
    lines.push("END:VCALENDAR");
    downloadTextFile("aqelio-calendar.ics", lines.join("\r\n"), "text/calendar;charset=utf-8");
    const feedback = document.getElementById("backup-feedback");
    if (feedback) feedback.textContent = "Calendar file created. Import it into Google Calendar or another calendar app; this is an export, not continuous two-way sync.";
}

function exportAqelioBackup() {
    if (!requireAqelioPremium()) return;
    const backup = {
        app: "Aqelio", backupVersion: 1, exportedAt: new Date().toISOString(),
        tasks, categories, stats, profile, darkMode,
        firedReminders
    };
    downloadTextFile("aqelio-backup.json", JSON.stringify(backup, null, 2), "application/json;charset=utf-8");
    const feedback = document.getElementById("backup-feedback");
    if (feedback) feedback.textContent = "Backup downloaded. Keep this file somewhere safe; it contains your task and profile data.";
}

function restoreAqelioBackup(file) {
    if (!requireAqelioPremium()) return;
    const feedback = document.getElementById("backup-feedback");
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const backup = JSON.parse(String(reader.result || ""));
            if (backup.app !== "Aqelio" || !Array.isArray(backup.tasks) || !Array.isArray(backup.categories)) {
                throw new Error("That file is not a valid Aqelio backup.");
            }
            if (!confirm("Restore this backup? It will replace the tasks, categories, and stats currently stored on this device.")) return;
            tasks = backup.tasks;
            categories = backup.categories;
            stats = backup.stats && typeof backup.stats === "object" ? backup.stats : { completed: 0, focus: 0, minutes: 0 };
            profile = backup.profile && typeof backup.profile === "object" ? backup.profile : profile;
            firedReminders = Array.isArray(backup.firedReminders) ? backup.firedReminders : [];
            if (typeof backup.darkMode === "boolean") {
                darkMode = backup.darkMode;
                localStorage.setItem(THEME_KEY, darkMode ? "dark" : "light");
            }
            saveTasks(); saveCategories(); saveStats(); saveFiredReminders();
            localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
            applyTheme(); renderProfile(); renderCategories(); renderHome(); renderCalendar(); renderStats();
            if (feedback) feedback.textContent = "Backup restored on this device.";
        } catch (error) {
            if (feedback) feedback.textContent = error.message || "Could not read that backup file.";
        }
    };
    reader.onerror = () => { if (feedback) feedback.textContent = "Could not read that backup file."; };
    reader.readAsText(file);
}

function setupPremiumTools() {
    const dateInput = document.getElementById("smart-schedule-date");
    if (dateInput && !dateInput.value) dateInput.value = formatDate(new Date());
    document.getElementById("natural-task-form")?.addEventListener("submit", event => {
        event.preventDefault();
        const input = document.getElementById("natural-task-input");
        if (addTaskFromNaturalLanguage(input?.value || "") && input) input.value = "";
    });
    document.getElementById("smart-schedule-button")?.addEventListener("click", buildSmartSchedule);
    document.getElementById("export-calendar-button")?.addEventListener("click", exportCalendarICS);
    document.getElementById("export-backup-button")?.addEventListener("click", exportAqelioBackup);
    const importInput = document.getElementById("import-backup-file");
    document.getElementById("import-backup-button")?.addEventListener("click", () => importInput?.click());
    importInput?.addEventListener("change", () => {
        restoreAqelioBackup(importInput.files?.[0]);
        importInput.value = "";
    });
}

/* =========================================================
   INITIALIZE
   ========================================================= */

setupRepeatUI();
setupCategoryControls();
setupDurationButtons();

setupCategoryColorPicker();
setupAqelioPaywall();
setupPremiumTools();

applyTheme();

renderProfile();

renderCurrentDate();

renderHome();

renderCalendar();

renderStats();

updateFocusDisplay();

renderCategories();

checkReminders();


/*
   AQELIO READY

   Repeat:
   - Daily
   - Weekdays
   - Every week
   - Every other week
   - Every 3rd week
   - Every 4th week
   - Custom weekday selection

   Categories:
   - Custom color when creating
   - Subtle integrated delete button
   - Deleted categories safely reassigned

   Recurring tasks:
   - Correctly appear on Home
   - Correctly appear on Calendar
   - Completion tracked separately per occurrence

   Reminders:
   - At task time
   - 10 minutes before
   - 30 minutes before
   - 1 hour before
   - Browser notification
   - Sound
   - In-app fallback
   - Duplicate protection
*/
