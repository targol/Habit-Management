package com.example.model

enum class TaskRepeatType {
    NONE,    // یک‌باره
    WEEKLY,  // هفتگی در روزهای مشخص
    MONTHLY  // ماهانه در تاریخ مشخص
}

data class AppTask(
    val id: String,
    val title: String,
    val notes: String = "",
    val categoryId: String = "cat_personal",
    val goalId: String? = null,
    val dueDate: String, // "1403/07/15" in Jalali format
    val time: String? = null, // "14:30"
    val reminderMinutesBefore: Int? = null, // e.g. 10 or 30 minutes before
    val repeatType: TaskRepeatType = TaskRepeatType.NONE,
    val repeatDaysOfWeek: List<Int> = emptyList(), // 0=Saturday .. 6=Friday
    val repeatDayOfMonth: Int? = null,
    val isCompleted: Boolean = false,
    val completedAt: Long? = null,
    val timerSecondsTarget: Int = 1500, // Default 25 min Pomodoro
    val timerSecondsElapsed: Int = 0,
    val createdAt: Long = System.currentTimeMillis()
)
