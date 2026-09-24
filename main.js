import {
    getTasks,
    addTask,
    updateTask,
    deleteTask
} from "./service/taskService.js";

let allTasks = [];
let editingTaskId = null;

let alarmInterval = null;
let alarmRunning = false;


// =============================
// DUE TODAY ALARM
// =============================

let alarmPlaying = false;

function checkDueTodayTasks() {

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueTodayTasks = allTasks.filter(task => {

        if (task.status === "completed") {
            return false;
        }

        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        return dueDate.getTime() === today.getTime();
    });

    if (dueTodayTasks.length > 0) {

        showDueTodayAlarm(dueTodayTasks);

    } else {

        hideAlarm();

    }
}


// =============================
// SHOW ALARM
// =============================

function showDueTodayAlarm(tasks) {

    const alarmBox =
        document.getElementById("alarmBox");

    const alarmMessage =
        document.getElementById("alarmMessage");

    alarmMessage.textContent =
        `${tasks.length} task(s) are due today.`;

    alarmBox.style.display = "block";

    startAlarm();
}


// =============================
// START ALARM
// =============================

function startAlarm() {

    if (alarmPlaying) {
        return;
    }

    const alarmSound =
        document.getElementById("alarmSound");

    if (!alarmSound) {
        return;
    }

    alarmSound.loop = true;
    alarmSound.currentTime = 0;

    const playPromise = alarmSound.play();

    if (playPromise !== undefined) {

        playPromise
            .then(() => {

                alarmPlaying = true;

                console.log(
                    "Alarm sound started successfully."
                );

            })
            .catch(error => {

                console.log(
                    "Browser blocked automatic alarm sound."
                );

                console.log(error);

                /*
                 * Try again after a short time.
                 * If the browser allows autoplay,
                 * the alarm will start.
                 */

                setTimeout(() => {

                    if (!alarmPlaying) {
                        startAlarm();
                    }

                }, 1000);

            });
    }
}


// =============================
// STOP ALARM
// =============================

document.getElementById(
    "stopAlarmBtn"
).addEventListener(
    "click",
    function () {

        const alarmSound =
            document.getElementById("alarmSound");

        alarmSound.pause();

        alarmSound.currentTime = 0;

        alarmPlaying = true;

        document.getElementById(
            "alarmBox"
        ).style.display = "none";

        console.log("Alarm stopped.");

    }
);


// =============================
// HIDE ALARM
// =============================

function hideAlarm() {

    const alarmBox =
        document.getElementById("alarmBox");

    const alarmSound =
        document.getElementById("alarmSound");

    if (alarmSound) {

        alarmSound.pause();

        alarmSound.currentTime = 0;

    }

    alarmBox.style.display = "none";

}

// =====================================
// LOAD TASKS
// =====================================

async function loadTasks() {

    try {

        allTasks = await getTasks();

        displayTasks(allTasks);

        checkDueTodayTasks();

    } catch (error) {

        console.error(
            "Unable to load tasks:",
            error
        );

    }
}


// =====================================
// DISPLAY TASKS
// =====================================

function displayTasks(tasks) {

    const todoContainer =
        document.getElementById("todoTasks");

    const progressContainer =
        document.getElementById("progressTasks");

    const completedContainer =
        document.getElementById("completedTasks");

    todoContainer.innerHTML = "";
    progressContainer.innerHTML = "";
    completedContainer.innerHTML = "";

    let todoCount = 0;
    let progressCount = 0;
    let completedCount = 0;

    tasks.forEach(task => {

        const card =
            document.createElement("div");

        card.className = "task-card";

        card.draggable = true;

        card.setAttribute(
            "data-id",
            task.id
        );


        // =================================
        // TASK CONTENT
        // =================================

        card.innerHTML = `

            <h3>
                ${task.title}
            </h3>

            <p>
                ${task.description}
            </p>

            <div class="task-info">

                <span class="priority-badge ${task.priority.toLowerCase()}">
                    ${task.priority}
                </span>

            </div>

            <div class="task-info">
                <strong>Assigned:</strong>
                ${task.assignedTo}
            </div>

            <div class="task-info">
                <strong>Due:</strong>
                ${task.dueDate}
            </div>

            <div class="task-actions">

                <button class="view-btn">
                    👁 View
                </button>

                <button class="edit-btn">
                    ✏ Edit
                </button>

                <button class="delete-btn">
                    🗑 Delete
                </button>

            </div>
        `;


        // =================================
        // DUE DATE WARNING
        // =================================

        addDueDateWarning(card, task);


        // =================================
        // VIEW
        // =================================

        card
            .querySelector(".view-btn")
            .addEventListener(
                "click",
                function () {

                    viewTask(task);

                }
            );


        // =================================
        // EDIT
        // =================================

        card
            .querySelector(".edit-btn")
            .addEventListener(
                "click",
                function () {

                    editTask(task);

                }
            );


        // =================================
        // DELETE
        // =================================

        card
            .querySelector(".delete-btn")
            .addEventListener(
                "click",
                function () {

                    deleteTaskHandler(task.id);

                }
            );


        // =================================
        // DRAG START
        // =================================

        card.addEventListener(
            "dragstart",
            function (event) {

                event.dataTransfer.setData(
                    "taskId",
                    task.id
                );

            }
        );


        // =================================
        // ADD TO COLUMN
        // =================================

        if (task.status === "todo") {

            todoContainer.appendChild(card);

            todoCount++;

        }

        else if (
            task.status === "in-progress"
        ) {

            progressContainer.appendChild(card);

            progressCount++;

        }

        else if (
            task.status === "completed"
        ) {

            completedContainer.appendChild(card);

            completedCount++;

        }

    });


    // =================================
    // COLUMN COUNTS
    // =================================

    document.getElementById(
        "todoCount"
    ).textContent = todoCount;

    document.getElementById(
        "progressCount"
    ).textContent = progressCount;

    document.getElementById(
        "completedCount"
    ).textContent = completedCount;


    updateDashboard(tasks);
}


// =====================================
// DUE DATE WARNING
// =====================================

function addDueDateWarning(card, task) {

    if (task.status === "completed") {
        return;
    }

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const dueDate =
        new Date(task.dueDate);

    dueDate.setHours(0, 0, 0, 0);

    const tomorrow =
        new Date(today);

    tomorrow.setDate(
        today.getDate() + 1
    );

    let label = "";
    let labelClass = "";


    if (dueDate < today) {

        card.classList.add("overdue");

        label = "⚠ OVERDUE";

        labelClass = "overdue-label";

    }

    else if (
        dueDate.getTime() ===
        today.getTime()
    ) {

        card.classList.add("due-today");

        label = "⏰ DUE TODAY";

        labelClass = "today-label";

    }

    else if (
        dueDate.getTime() ===
        tomorrow.getTime()
    ) {

        card.classList.add("due-soon");

        label = "📅 DUE TOMORROW";

        labelClass = "tomorrow-label";

    }


    if (label !== "") {

        const span =
            document.createElement("span");

        span.className =
            `due-label ${labelClass}`;

        span.textContent = label;

        card.appendChild(span);
    }
}


// =====================================
// DASHBOARD
// =====================================

function updateDashboard(tasks) {

    const total =
        tasks.length;

    const completed =
        tasks.filter(
            task =>
                task.status === "completed"
        ).length;

    const highPriority =
        tasks.filter(
            task =>
                task.priority === "High"
        ).length;


    const today = new Date();

    today.setHours(0, 0, 0, 0);


    const overdue =
        tasks.filter(task => {

            const dueDate =
                new Date(task.dueDate);

            dueDate.setHours(0, 0, 0, 0);

            return (
                task.status !== "completed" &&
                dueDate < today
            );

        }).length;


    const percentage =
        total === 0
            ? 0
            : Math.round(
                completed / total * 100
            );


    document.getElementById(
        "totalTasks"
    ).textContent = total;

    document.getElementById(
        "completedTasksStat"
    ).textContent = completed;

    document.getElementById(
        "highPriorityTasks"
    ).textContent = highPriority;

    document.getElementById(
        "overdueTasks"
    ).textContent = overdue;

    document.getElementById(
        "completionPercentage"
    ).textContent =
        percentage + "%";

    document.getElementById(
        "progressFill"
    ).style.width =
        percentage + "%";
}


// =====================================
// ADD TASK
// =====================================

const taskModal =
    document.getElementById("taskModal");

const taskForm =
    document.getElementById("taskForm");


document
    .getElementById("addTaskBtn")
    .addEventListener(
        "click",
        function () {

            editingTaskId = null;

            document.getElementById(
                "modalTitle"
            ).textContent =
                "Add New Task";

            taskForm.reset();

            taskModal.style.display =
                "flex";

        }
    );


// =====================================
// CANCEL TASK
// =====================================

document
    .getElementById("cancelBtn")
    .addEventListener(
        "click",
        function () {

            taskModal.style.display =
                "none";

            taskForm.reset();

            editingTaskId = null;

        }
    );


// =====================================
// SAVE TASK
// =====================================

taskForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const taskData = {

            title:
                document.getElementById(
                    "taskTitle"
                ).value,

            description:
                document.getElementById(
                    "taskDescription"
                ).value,

            priority:
                document.getElementById(
                    "taskPriority"
                ).value,

            assignedTo:
                document.getElementById(
                    "taskAssignedTo"
                ).value,

            dueDate:
                document.getElementById(
                    "taskDueDate"
                ).value

        };


        try {

            // ADD

            if (editingTaskId === null) {

                const newTask = {

                    ...taskData,

                    status: "todo"

                };

                await addTask(newTask);

                alert(
                    "Task created successfully!"
                );

            }


            // EDIT

            else {

                const oldTask =
                    allTasks.find(
                        task =>
                            task.id ==
                            editingTaskId
                    );

                const updatedTask = {

                    ...oldTask,

                    ...taskData

                };

                await updateTask(
                    editingTaskId,
                    updatedTask
                );

                alert(
                    "Task updated successfully!"
                );
            }


            taskModal.style.display =
                "none";

            taskForm.reset();

            editingTaskId = null;

            await loadTasks();

        }

        catch (error) {

            console.error(
                "Unable to save task:",
                error
            );

            alert(
                "Unable to save task."
            );

        }

    }
);


// =====================================
// EDIT TASK
// =====================================

function editTask(task) {

    editingTaskId = task.id;

    document.getElementById(
        "modalTitle"
    ).textContent =
        "Edit Task";

    document.getElementById(
        "taskTitle"
    ).value =
        task.title;

    document.getElementById(
        "taskDescription"
    ).value =
        task.description;

    document.getElementById(
        "taskPriority"
    ).value =
        task.priority;

    document.getElementById(
        "taskAssignedTo"
    ).value =
        task.assignedTo;

    document.getElementById(
        "taskDueDate"
    ).value =
        task.dueDate;

    taskModal.style.display =
        "flex";
}


// =====================================
// DELETE TASK
// =====================================

async function deleteTaskHandler(id) {

    const confirmDelete =
        confirm(
            "Are you sure you want to delete this task?"
        );

    if (!confirmDelete) {
        return;
    }

    try {

        await deleteTask(id);

        alert(
            "Task deleted successfully!"
        );

        await loadTasks();

    }

    catch (error) {

        console.error(
            "Unable to delete task:",
            error
        );

        alert(
            "Unable to delete task."
        );

    }
}


// =====================================
// VIEW TASK
// =====================================

function viewTask(task) {

    document.getElementById(
        "viewTaskTitle"
    ).textContent =
        task.title;

    document.getElementById(
        "viewDescription"
    ).textContent =
        task.description;

    document.getElementById(
        "viewPriority"
    ).textContent =
        task.priority;

    document.getElementById(
        "viewAssignedTo"
    ).textContent =
        task.assignedTo;

    document.getElementById(
        "viewStatus"
    ).textContent =
        task.status;

    document.getElementById(
        "viewDueDate"
    ).textContent =
        task.dueDate;

    document.getElementById(
        "viewTaskModal"
    ).style.display =
        "flex";
}


// =====================================
// CLOSE VIEW
// =====================================

document
    .getElementById("closeViewBtn")
    .addEventListener(
        "click",
        function () {

            document.getElementById(
                "viewTaskModal"
            ).style.display =
                "none";

        }
    );


// =====================================
// SEARCH + FILTER + SORT
// =====================================

function applyFilters() {

    const search =
        document.getElementById(
            "searchInput"
        )
        .value
        .trim()
        .toLowerCase();


    const priority =
        document.getElementById(
            "priorityFilter"
        ).value;


    const user =
        document.getElementById(
            "userFilter"
        ).value;


    const sort =
        document.getElementById(
            "sortFilter"
        ).value;


    let result =
        allTasks.filter(task => {

            const searchMatch =

                search === "" ||

                task.title
                    .toLowerCase()
                    .includes(search) ||

                task.description
                    .toLowerCase()
                    .includes(search);


            const priorityMatch =

                priority === "All" ||

                task.priority === priority;


            const userMatch =

                user === "All" ||

                task.assignedTo === user;


            return (
                searchMatch &&
                priorityMatch &&
                userMatch
            );

        });


    // SORT BY PRIORITY

    if (sort === "priority") {

        const priorityOrder = {

            High: 1,
            Medium: 2,
            Low: 3

        };

        result.sort(
            (a, b) =>
                priorityOrder[a.priority] -
                priorityOrder[b.priority]
        );
    }


    // SORT BY DUE DATE

    else if (sort === "dueDate") {

        result.sort(
            (a, b) =>
                new Date(a.dueDate) -
                new Date(b.dueDate)
        );
    }


    // SORT BY TASK NAME

    else if (sort === "title") {

        result.sort(
            (a, b) =>
                a.title.localeCompare(
                    b.title
                )
        );
    }


    displayTasks(result);
}


// =====================================
// FILTER LISTENERS
// =====================================

document
    .getElementById("searchInput")
    .addEventListener(
        "input",
        applyFilters
    );


document
    .getElementById("priorityFilter")
    .addEventListener(
        "change",
        applyFilters
    );


document
    .getElementById("userFilter")
    .addEventListener(
        "change",
        applyFilters
    );


document
    .getElementById("sortFilter")
    .addEventListener(
        "change",
        applyFilters
    );


// =====================================
// CLEAR FILTERS
// =====================================

document
    .getElementById("clearFiltersBtn")
    .addEventListener(
        "click",
        function () {

            document.getElementById(
                "searchInput"
            ).value = "";

            document.getElementById(
                "priorityFilter"
            ).value = "All";

            document.getElementById(
                "userFilter"
            ).value = "All";

            document.getElementById(
                "sortFilter"
            ).value = "none";

            displayTasks(allTasks);

        }
    );


// =====================================
// DRAG AND DROP
// =====================================

const columns = [

    {
        id: "todoTasks",
        status: "todo"
    },

    {
        id: "progressTasks",
        status: "in-progress"
    },

    {
        id: "completedTasks",
        status: "completed"
    }

];


columns.forEach(column => {

    const element =
        document.getElementById(
            column.id
        );


    element.addEventListener(
        "dragover",
        function (event) {

            event.preventDefault();

        }
    );


    element.addEventListener(
        "drop",
        async function (event) {

            event.preventDefault();

            const taskId =
                event.dataTransfer.getData(
                    "taskId"
                );


            const task =
                allTasks.find(
                    task =>
                        task.id == taskId
                );


            if (!task) {
                return;
            }


            try {

                task.status =
                    column.status;

                await updateTask(
                    task.id,
                    task
                );

                await loadTasks();

            }

            catch (error) {

                console.error(
                    "Unable to update task:",
                    error
                );

            }

        }
    );

});


// =====================================
// DARK MODE
// =====================================

const themeBtn =
    document.getElementById(
        "themeBtn"
    );


themeBtn.addEventListener(
    "click",
    function () {

        document.body
            .classList
            .toggle("dark-mode");


        if (
            document.body
                .classList
                .contains("dark-mode")
        ) {

            themeBtn.textContent =
                "☀️ Light Mode";

        }

        else {

            themeBtn.textContent =
                "🌙 Dark Mode";

        }

    }
);


// =====================================
// START APPLICATION
// =====================================

loadTasks();