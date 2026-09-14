package com.example.data

import android.content.Context
import android.content.SharedPreferences
import com.example.calendar.JalaliDate
import com.example.calendar.PersianCalendarHelper
import com.example.model.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID

class AppRepository(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences("javaneh_app_prefs", Context.MODE_PRIVATE)

    private val _categories = MutableStateFlow<List<TaskCategory>>(emptyList())
    val categories: StateFlow<List<TaskCategory>> = _categories.asStateFlow()

    private val _goals = MutableStateFlow<List<Goal>>(emptyList())
    val goals: StateFlow<List<Goal>> = _goals.asStateFlow()

    private val _tasks = MutableStateFlow<List<AppTask>>(emptyList())
    val tasks: StateFlow<List<AppTask>> = _tasks.asStateFlow()

    private val _habits = MutableStateFlow<List<Habit>>(emptyList())
    val habits: StateFlow<List<Habit>> = _habits.asStateFlow()

    init {
        loadData()
    }

    private fun loadData() {
        val hasInitialized = prefs.getBoolean("has_initialized", false)
        if (!hasInitialized) {
            seedInitialData()
        } else {
            loadCategories()
            loadGoals()
            loadTasks()
            loadHabits()
        }
    }

    private fun seedInitialData() {
        val defaultCats = DefaultCategories.ALL
        _categories.value = defaultCats

        val today = PersianCalendarHelper.getToday()
        val curYear = today.year
        val todayStr = today.toFormattedString()

        // Sample Annual Goal
        val annualGoal1Id = UUID.randomUUID().toString()
        val annualGoal1 = Goal(
            id = annualGoal1Id,
            title = "تسلط بر مهارت‌های فردی و زبان انگلیسی",
            description = "یادگیری روزانه واژگان، گوش دادن به پادکست و مطالعه کتب تخصصی",
            year = curYear,
            period = GoalPeriod.ANNUAL,
            colorHex = 0xFF2E7D32,
            targetCount = 20
        )

        // Seasonal Goal (Spring / بهار)
        val seasonalGoal1Id = UUID.randomUUID().toString()
        val seasonalGoal1 = Goal(
            id = seasonalGoal1Id,
            title = "پایه زبان و تقویت گرامر و ۵۰۰ لغت",
            description = "پایان دوره مقدماتی و تثبیت عادات مطالعه روزمره",
            year = curYear,
            period = GoalPeriod.SEASONAL,
            seasonIndex = 0,
            parentId = annualGoal1Id,
            colorHex = 0xFF3B82F6,
            targetCount = 10
        )

        val initialGoals = listOf(annualGoal1, seasonalGoal1)
        _goals.value = initialGoals

        // Sample Habits
        val pastDays = PersianCalendarHelper.getPastNDays(14)
        val habit1History = mutableMapOf<String, Boolean>()
        pastDays.take(12).forEach {
            habit1History[it.toFormattedString()] = true
        }

        val habit1 = Habit(
            id = UUID.randomUUID().toString(),
            title = "مطالعه ۲۰ صفحه کتاب تخصصی",
            notes = "کتاب طراحی سیستم یا روانشناسی رشد",
            categoryId = DefaultCategories.STUDY.id,
            goalId = annualGoal1Id,
            frequency = HabitFrequency.DAILY,
            timerMinutes = 25,
            exemptHolidays = true,
            exemptWeekends = false,
            plantType = PlantType.BONSAI,
            history = habit1History
        )

        val habit2History = mutableMapOf<String, Boolean>()
        pastDays.take(10).forEach {
            habit2History[it.toFormattedString()] = true
        }
        val habit2 = Habit(
            id = UUID.randomUUID().toString(),
            title = "ورزش صبحگاهی و نوشیدن آب کافی",
            notes = "۳۰ دقیقه پیاده‌روی سبک یا یوگا",
            categoryId = DefaultCategories.FITNESS.id,
            goalId = null,
            frequency = HabitFrequency.DAILY,
            timerMinutes = 30,
            exemptHolidays = true,
            exemptWeekends = true,
            plantType = PlantType.SPROUT,
            history = habit2History
        )

        val initialHabits = listOf(habit1, habit2)
        _habits.value = initialHabits

        // Sample Tasks
        val task1 = AppTask(
            id = UUID.randomUUID().toString(),
            title = "بررسی و اولویت‌بندی اهداف فصل جدید",
            notes = "نوشتن شاخص‌های کلیدی موفقیت (OKR)",
            categoryId = DefaultCategories.WORK.id,
            goalId = annualGoal1Id,
            dueDate = todayStr,
            time = "10:30",
            reminderMinutesBefore = 15,
            isCompleted = true,
            completedAt = System.currentTimeMillis() - 3600000,
            timerSecondsTarget = 1800,
            timerSecondsElapsed = 1800
        )

        val task2 = AppTask(
            id = UUID.randomUUID().toString(),
            title = "گوش دادن به یک اپیزود پادکست انگلیسی",
            notes = "یادداشت ۵ اصطلاح جدید در دفترچه",
            categoryId = DefaultCategories.STUDY.id,
            goalId = seasonalGoal1Id,
            dueDate = todayStr,
            time = "17:00",
            reminderMinutesBefore = 30,
            isCompleted = false,
            timerSecondsTarget = 1200,
            timerSecondsElapsed = 0
        )

        val task3 = AppTask(
            id = UUID.randomUUID().toString(),
            title = "آبیاری و رسیدگی به گلدان‌های خانه",
            notes = "تمیز کردن برگ‌ها و بررسی رطوبت خاک",
            categoryId = DefaultCategories.HOME.id,
            goalId = null,
            dueDate = todayStr,
            time = "20:00",
            reminderMinutesBefore = 10,
            isCompleted = false,
            timerSecondsTarget = 900,
            timerSecondsElapsed = 0
        )

        val initialTasks = listOf(task1, task2, task3)
        _tasks.value = initialTasks

        saveAll()
        prefs.edit().putBoolean("has_initialized", true).apply()
    }

    // --- Task Operations ---

    fun addTask(task: AppTask) {
        val current = _tasks.value.toMutableList()
        current.add(task)
        _tasks.value = current
        saveTasks()
    }

    fun updateTask(task: AppTask) {
        val current = _tasks.value.map {
            if (it.id == task.id) task else it
        }
        _tasks.value = current
        saveTasks()
    }

    fun toggleTaskCompletion(taskId: String) {
        val current = _tasks.value.map {
            if (it.id == taskId) {
                val newStatus = !it.isCompleted
                it.copy(
                    isCompleted = newStatus,
                    completedAt = if (newStatus) System.currentTimeMillis() else null
                )
            } else it
        }
        _tasks.value = current
        saveTasks()
    }

    fun deleteTask(taskId: String) {
        _tasks.value = _tasks.value.filter { it.id != taskId }
        saveTasks()
    }

    fun updateTaskTimer(taskId: String, elapsedSeconds: Int) {
        val current = _tasks.value.map {
            if (it.id == taskId) {
                it.copy(timerSecondsElapsed = elapsedSeconds)
            } else it
        }
        _tasks.value = current
        saveTasks()
    }

    // --- Habit Operations ---

    fun addHabit(habit: Habit) {
        val current = _habits.value.toMutableList()
        current.add(habit)
        _habits.value = current
        saveHabits()
    }

    fun updateHabit(habit: Habit) {
        val current = _habits.value.map {
            if (it.id == habit.id) habit else it
        }
        _habits.value = current
        saveHabits()
    }

    fun toggleHabitToday(habitId: String) {
        val todayStr = PersianCalendarHelper.getToday().toFormattedString()
        toggleHabitOnDate(habitId, todayStr)
    }

    fun toggleHabitOnDate(habitId: String, dateStr: String) {
        val current = _habits.value.map { habit ->
            if (habit.id == habitId) {
                val newHistory = habit.history.toMutableMap()
                val isCurrentlyDone = newHistory[dateStr] == true
                if (isCurrentlyDone) {
                    newHistory.remove(dateStr)
                } else {
                    newHistory[dateStr] = true
                }
                habit.copy(history = newHistory)
            } else habit
        }
        _habits.value = current
        saveHabits()
    }

    fun deleteHabit(habitId: String) {
        _habits.value = _habits.value.filter { it.id != habitId }
        saveHabits()
    }

    // --- Goal Operations ---

    fun addGoal(goal: Goal) {
        val current = _goals.value.toMutableList()
        current.add(goal)
        _goals.value = current
        saveGoals()
    }

    fun updateGoal(goal: Goal) {
        val current = _goals.value.map {
            if (it.id == goal.id) goal else it
        }
        _goals.value = current
        saveGoals()
    }

    fun deleteGoal(goalId: String) {
        _goals.value = _goals.value.filter { it.id != goalId && it.parentId != goalId }
        saveGoals()
    }

    fun getGoalProgress(goalId: String): Int {
        val linkedTasks = _tasks.value.filter { it.goalId == goalId }
        val linkedHabits = _habits.value.filter { it.goalId == goalId }

        var totalItems = 0
        var completedItems = 0

        // Tasks score
        if (linkedTasks.isNotEmpty()) {
            totalItems += linkedTasks.size
            completedItems += linkedTasks.count { it.isCompleted }
        }

        // Habits score (adherence over past 30 days)
        if (linkedHabits.isNotEmpty()) {
            for (habit in linkedHabits) {
                totalItems += 10
                val adherence = habit.calculateAdherenceRate(30)
                completedItems += (adherence / 10).coerceIn(0, 10)
            }
        }

        // Also include child goals (e.g. seasonal childs of annual)
        val childGoals = _goals.value.filter { it.parentId == goalId }
        if (childGoals.isNotEmpty()) {
            for (child in childGoals) {
                totalItems += 10
                val childProg = getGoalProgress(child.id)
                completedItems += (childProg / 10).coerceIn(0, 10)
            }
        }

        if (totalItems == 0) return 0
        return ((completedItems.toDouble() / totalItems) * 100).toInt().coerceIn(0, 100)
    }

    // --- Categories Operations ---

    fun addCategory(category: TaskCategory) {
        val current = _categories.value.toMutableList()
        current.add(category)
        _categories.value = current
        saveCategories()
    }

    // --- Today & Stats Calculations ---

    fun getTodayProgress(): Triple<Int, Int, Int> {
        val todayStr = PersianCalendarHelper.getToday().toFormattedString()
        val todayDayOfWeek = PersianCalendarHelper.getDayOfWeek(PersianCalendarHelper.getToday())

        // Today tasks
        val todayTasks = _tasks.value.filter { task ->
            task.dueDate == todayStr ||
                    (task.repeatType == TaskRepeatType.WEEKLY && task.repeatDaysOfWeek.contains(todayDayOfWeek))
        }

        // Today habits
        val todayHabits = _habits.value.filter { habit ->
            habit.frequency == HabitFrequency.DAILY || habit.targetDaysOfWeek.contains(todayDayOfWeek)
        }

        val total = todayTasks.size + todayHabits.size
        if (total == 0) return Triple(0, 0, 100)

        val completedTasks = todayTasks.count { it.isCompleted }
        val completedHabits = todayHabits.count { it.isCompletedOn(todayStr) }
        val completed = completedTasks + completedHabits

        val percent = ((completed.toDouble() / total) * 100).toInt().coerceIn(0, 100)
        return Triple(completed, total, percent)
    }

    // --- Serialization and Persistence ---

    private fun saveAll() {
        saveCategories()
        saveGoals()
        saveTasks()
        saveHabits()
    }

    private fun saveCategories() {
        val arr = JSONArray()
        for (cat in _categories.value) {
            val obj = JSONObject()
            obj.put("id", cat.id)
            obj.put("title", cat.title)
            obj.put("colorHex", cat.colorHex)
            obj.put("iconName", cat.iconName)
            arr.put(obj)
        }
        prefs.edit().putString("categories_json", arr.toString()).apply()
    }

    private fun loadCategories() {
        val str = prefs.getString("categories_json", null)
        if (str == null) {
            _categories.value = DefaultCategories.ALL
            return
        }
        try {
            val arr = JSONArray(str)
            val list = mutableListOf<TaskCategory>()
            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                list.add(
                    TaskCategory(
                        id = obj.getString("id"),
                        title = obj.getString("title"),
                        colorHex = obj.getLong("colorHex"),
                        iconName = obj.optString("iconName", "Tag")
                    )
                )
            }
            _categories.value = if (list.isEmpty()) DefaultCategories.ALL else list
        } catch (e: Exception) {
            _categories.value = DefaultCategories.ALL
        }
    }

    private fun saveGoals() {
        val arr = JSONArray()
        for (g in _goals.value) {
            val obj = JSONObject()
            obj.put("id", g.id)
            obj.put("title", g.title)
            obj.put("description", g.description)
            obj.put("year", g.year)
            obj.put("period", g.period.name)
            if (g.seasonIndex != null) obj.put("seasonIndex", g.seasonIndex)
            if (g.monthIndex != null) obj.put("monthIndex", g.monthIndex)
            if (g.parentId != null) obj.put("parentId", g.parentId)
            obj.put("colorHex", g.colorHex)
            obj.put("iconName", g.iconName)
            obj.put("targetCount", g.targetCount)
            obj.put("createdAt", g.createdAt)
            arr.put(obj)
        }
        prefs.edit().putString("goals_json", arr.toString()).apply()
    }

    private fun loadGoals() {
        val str = prefs.getString("goals_json", null) ?: return
        try {
            val arr = JSONArray(str)
            val list = mutableListOf<Goal>()
            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                list.add(
                    Goal(
                        id = obj.getString("id"),
                        title = obj.getString("title"),
                        description = obj.optString("description", ""),
                        year = obj.getInt("year"),
                        period = GoalPeriod.valueOf(obj.getString("period")),
                        seasonIndex = if (obj.has("seasonIndex")) obj.getInt("seasonIndex") else null,
                        monthIndex = if (obj.has("monthIndex")) obj.getInt("monthIndex") else null,
                        parentId = if (obj.has("parentId")) obj.getString("parentId") else null,
                        colorHex = obj.optLong("colorHex", 0xFF2E7D32),
                        iconName = obj.optString("iconName", "Target"),
                        targetCount = obj.optInt("targetCount", 10),
                        createdAt = obj.optLong("createdAt", System.currentTimeMillis())
                    )
                )
            }
            _goals.value = list
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun saveTasks() {
        val arr = JSONArray()
        for (t in _tasks.value) {
            val obj = JSONObject()
            obj.put("id", t.id)
            obj.put("title", t.title)
            obj.put("notes", t.notes)
            obj.put("categoryId", t.categoryId)
            if (t.goalId != null) obj.put("goalId", t.goalId)
            obj.put("dueDate", t.dueDate)
            if (t.time != null) obj.put("time", t.time)
            if (t.reminderMinutesBefore != null) obj.put("reminderMinutesBefore", t.reminderMinutesBefore)
            obj.put("repeatType", t.repeatType.name)
            val repeatDaysArr = JSONArray()
            t.repeatDaysOfWeek.forEach { repeatDaysArr.put(it) }
            obj.put("repeatDaysOfWeek", repeatDaysArr)
            if (t.repeatDayOfMonth != null) obj.put("repeatDayOfMonth", t.repeatDayOfMonth)
            obj.put("isCompleted", t.isCompleted)
            if (t.completedAt != null) obj.put("completedAt", t.completedAt)
            obj.put("timerSecondsTarget", t.timerSecondsTarget)
            obj.put("timerSecondsElapsed", t.timerSecondsElapsed)
            obj.put("createdAt", t.createdAt)
            arr.put(obj)
        }
        prefs.edit().putString("tasks_json", arr.toString()).apply()
    }

    private fun loadTasks() {
        val str = prefs.getString("tasks_json", null) ?: return
        try {
            val arr = JSONArray(str)
            val list = mutableListOf<AppTask>()
            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                val repeatDays = mutableListOf<Int>()
                val repeatArr = obj.optJSONArray("repeatDaysOfWeek")
                if (repeatArr != null) {
                    for (j in 0 until repeatArr.length()) {
                        repeatDays.add(repeatArr.getInt(j))
                    }
                }
                list.add(
                    AppTask(
                        id = obj.getString("id"),
                        title = obj.getString("title"),
                        notes = obj.optString("notes", ""),
                        categoryId = obj.optString("categoryId", "cat_personal"),
                        goalId = if (obj.has("goalId")) obj.getString("goalId") else null,
                        dueDate = obj.getString("dueDate"),
                        time = if (obj.has("time")) obj.getString("time") else null,
                        reminderMinutesBefore = if (obj.has("reminderMinutesBefore")) obj.getInt("reminderMinutesBefore") else null,
                        repeatType = TaskRepeatType.valueOf(obj.optString("repeatType", "NONE")),
                        repeatDaysOfWeek = repeatDays,
                        repeatDayOfMonth = if (obj.has("repeatDayOfMonth")) obj.getInt("repeatDayOfMonth") else null,
                        isCompleted = obj.optBoolean("isCompleted", false),
                        completedAt = if (obj.has("completedAt")) obj.getLong("completedAt") else null,
                        timerSecondsTarget = obj.optInt("timerSecondsTarget", 1500),
                        timerSecondsElapsed = obj.optInt("timerSecondsElapsed", 0),
                        createdAt = obj.optLong("createdAt", System.currentTimeMillis())
                    )
                )
            }
            _tasks.value = list
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun saveHabits() {
        val arr = JSONArray()
        for (h in _habits.value) {
            val obj = JSONObject()
            obj.put("id", h.id)
            obj.put("title", h.title)
            obj.put("notes", h.notes)
            obj.put("categoryId", h.categoryId)
            if (h.goalId != null) obj.put("goalId", h.goalId)
            obj.put("frequency", h.frequency.name)
            val targetDaysArr = JSONArray()
            h.targetDaysOfWeek.forEach { targetDaysArr.put(it) }
            obj.put("targetDaysOfWeek", targetDaysArr)
            if (h.time != null) obj.put("time", h.time)
            obj.put("timerMinutes", h.timerMinutes)
            obj.put("exemptHolidays", h.exemptHolidays)
            obj.put("exemptWeekends", h.exemptWeekends)
            obj.put("plantType", h.plantType.name)

            val historyObj = JSONObject()
            for ((k, v) in h.history) {
                historyObj.put(k, v)
            }
            obj.put("history", historyObj)
            obj.put("createdAt", h.createdAt)
            arr.put(obj)
        }
        prefs.edit().putString("habits_json", arr.toString()).apply()
    }

    private fun loadHabits() {
        val str = prefs.getString("habits_json", null) ?: return
        try {
            val arr = JSONArray(str)
            val list = mutableListOf<Habit>()
            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                val targetDays = mutableListOf<Int>()
                val targetDaysArr = obj.optJSONArray("targetDaysOfWeek")
                if (targetDaysArr != null) {
                    for (j in 0 until targetDaysArr.length()) {
                        targetDays.add(targetDaysArr.getInt(j))
                    }
                }
                val historyMap = mutableMapOf<String, Boolean>()
                val historyObj = obj.optJSONObject("history")
                if (historyObj != null) {
                    val keys = historyObj.keys()
                    while (keys.hasNext()) {
                        val key = keys.next()
                        historyMap[key] = historyObj.getBoolean(key)
                    }
                }
                list.add(
                    Habit(
                        id = obj.getString("id"),
                        title = obj.getString("title"),
                        notes = obj.optString("notes", ""),
                        categoryId = obj.optString("categoryId", "cat_personal"),
                        goalId = if (obj.has("goalId")) obj.getString("goalId") else null,
                        frequency = HabitFrequency.valueOf(obj.optString("frequency", "DAILY")),
                        targetDaysOfWeek = if (targetDays.isEmpty()) listOf(0,1,2,3,4,5,6) else targetDays,
                        time = if (obj.has("time")) obj.getString("time") else null,
                        timerMinutes = obj.optInt("timerMinutes", 15),
                        exemptHolidays = obj.optBoolean("exemptHolidays", true),
                        exemptWeekends = obj.optBoolean("exemptWeekends", false),
                        plantType = PlantType.valueOf(obj.optString("plantType", "SPROUT")),
                        history = historyMap,
                        createdAt = obj.optLong("createdAt", System.currentTimeMillis())
                    )
                )
            }
            _habits.value = list
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
