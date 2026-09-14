package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.calendar.IranianHolidays
import com.example.calendar.JalaliDate
import com.example.calendar.PersianCalendarHelper
import com.example.data.AppRepository
import com.example.model.AppTask
import com.example.model.DefaultCategories
import com.example.model.EncouragementQuotes
import com.example.model.Habit
import com.example.ui.components.PlantGrowthCard
import com.example.ui.components.TaskTimerDialog

@Composable
fun TodayScreen(
    repository: AppRepository,
    onNavigateToTasks: () -> Unit,
    onNavigateToHabits: () -> Unit,
    modifier: Modifier = Modifier
) {
    val tasks by repository.tasks.collectAsState()
    val habits by repository.habits.collectAsState()
    val categories by repository.categories.collectAsState()

    val today = remember { PersianCalendarHelper.getToday() }
    val todayStr = remember { today.toFormattedString() }
    val todayDayOfWeek = remember { PersianCalendarHelper.getDayOfWeek(today) }
    val (isHoliday, holidayTitle) = remember { IranianHolidays.getHolidayInfo(today) }

    val todayTasks = tasks.filter {
        it.dueDate == todayStr ||
                (it.repeatDaysOfWeek.contains(todayDayOfWeek))
    }

    val todayHabits = habits.filter {
        it.frequency == com.example.model.HabitFrequency.DAILY ||
                it.targetDaysOfWeek.contains(todayDayOfWeek)
    }

    val (completedCount, totalCount, progressPercent) = repository.getTodayProgress()

    // Timer dialog state
    var timerItemTitle by remember { mutableStateOf<String?>(null) }
    var timerInitialMins by remember { mutableStateOf(25) }
    var activeTimerTaskId by remember { mutableStateOf<String?>(null) }

    Box(modifier = modifier.fillMaxSize()) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = PaddingValues(top = 16.dp, bottom = 90.dp)
        ) {
            // Header with Persian Date & Holiday Badge
            item {
                Column(modifier = Modifier.fillMaxWidth()) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "امروز، ${PersianCalendarHelper.WEEKDAY_NAMES[todayDayOfWeek]}",
                                fontSize = 14.sp,
                                color = Color(0xFF558B2F),
                                fontWeight = FontWeight.Medium
                            )
                            Text(
                                text = today.toPersianDisplayString(),
                                fontSize = 22.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF1B5E20)
                            )
                        }

                        // Holiday or normal day badge
                        if (isHoliday && holidayTitle != null) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(Color(0xFFFFEBEE))
                                    .padding(horizontal = 10.dp, vertical = 6.dp)
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(8.dp)
                                            .clip(CircleShape)
                                            .background(Color(0xFFD32F2F))
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = holidayTitle,
                                        fontSize = 11.sp,
                                        color = Color(0xFFC62828),
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                    }

                    // Encouraging Quote
                    Spacer(modifier = Modifier.height(10.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(14.dp))
                            .background(Color(0xFFF1F8E9))
                            .padding(horizontal = 12.dp, vertical = 8.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(text = "💡", fontSize = 14.sp)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = EncouragementQuotes.QUOTES[0],
                                fontSize = 12.sp,
                                color = Color(0xFF33691E)
                            )
                        }
                    }
                }
            }

            // Visual Plant Growth Card (باغچه رشد امروز)
            item {
                PlantGrowthCard(
                    progressPercent = progressPercent,
                    completedCount = completedCount,
                    totalCount = totalCount
                )
            }

            // Habits Section Header
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(text = "🌿", fontSize = 18.sp)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "عادت‌های امروز",
                            fontSize = 17.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF1B5E20)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(Color(0xFFE8F5E9))
                                .padding(horizontal = 8.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = PersianCalendarHelper.toPersianDigits(todayHabits.size),
                                fontSize = 12.sp,
                                color = Color(0xFF2E7D32),
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    TextButton(onClick = onNavigateToHabits) {
                        Text(text = "مشاهده همه", fontSize = 12.sp, color = Color(0xFF2E7D32))
                    }
                }
            }

            // Habits List
            if (todayHabits.isEmpty()) {
                item {
                    EmptySectionPlaceholder(
                        text = "هیچ عادتی برای امروز ثبت نشده است.",
                        buttonText = "+ ثبت اولین عادت",
                        onClick = onNavigateToHabits
                    )
                }
            } else {
                items(todayHabits, key = { it.id }) { habit ->
                    val isDone = habit.isCompletedOn(todayStr)
                    val streak = habit.calculateCurrentStreak()

                    HabitTodayCard(
                        habit = habit,
                        isDone = isDone,
                        streak = streak,
                        onToggle = { repository.toggleHabitToday(habit.id) },
                        onStartTimer = {
                            timerItemTitle = habit.title
                            timerInitialMins = habit.timerMinutes
                            activeTimerTaskId = null
                        }
                    )
                }
            }

            // Tasks Section Header
            item {
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(text = "✅", fontSize = 18.sp)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "تسک‌های امروز",
                            fontSize = 17.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF1B5E20)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(Color(0xFFE8F5E9))
                                .padding(horizontal = 8.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = PersianCalendarHelper.toPersianDigits(todayTasks.size),
                                fontSize = 12.sp,
                                color = Color(0xFF2E7D32),
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    TextButton(onClick = onNavigateToTasks) {
                        Text(text = "مدیریت تسک‌ها", fontSize = 12.sp, color = Color(0xFF2E7D32))
                    }
                }
            }

            // Tasks List
            if (todayTasks.isEmpty()) {
                item {
                    EmptySectionPlaceholder(
                        text = "همه تسک‌های امروز کامل شده یا تسکی نمانده است!",
                        buttonText = "+ افزودن تسک جدید",
                        onClick = onNavigateToTasks
                    )
                }
            } else {
                items(todayTasks, key = { it.id }) { task ->
                    val category = categories.find { it.id == task.categoryId } ?: DefaultCategories.PERSONAL

                    TaskTodayCard(
                        task = task,
                        categoryTitle = category.title,
                        categoryColor = Color(category.colorHex),
                        onToggle = { repository.toggleTaskCompletion(task.id) },
                        onStartTimer = {
                            timerItemTitle = task.title
                            timerInitialMins = task.timerSecondsTarget / 60
                            activeTimerTaskId = task.id
                        }
                    )
                }
            }
        }

        // Active Timer Dialog
        if (timerItemTitle != null) {
            TaskTimerDialog(
                itemTitle = timerItemTitle!!,
                initialTargetMinutes = timerInitialMins,
                onDismiss = { timerItemTitle = null },
                onComplete = { elapsed ->
                    activeTimerTaskId?.let { tid ->
                        repository.updateTaskTimer(tid, elapsed)
                        repository.toggleTaskCompletion(tid)
                    }
                    timerItemTitle = null
                }
            )
        }
    }
}

@Composable
fun HabitTodayCard(
    habit: Habit,
    isDone: Boolean,
    streak: Int,
    onToggle: () -> Unit,
    onStartTimer: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isDone) Color(0xFFF1F8E9) else Color.White
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = if (isDone) 1.dp else 2.dp),
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onToggle() }
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Checkbox / Plant symbol
            Box(
                modifier = Modifier
                    .size(42.dp)
                    .clip(CircleShape)
                    .background(if (isDone) Color(0xFF2E7D32) else Color(0xFFF1F8E9)),
                contentAlignment = Alignment.Center
            ) {
                if (isDone) {
                    Icon(
                        imageVector = Icons.Default.Check,
                        contentDescription = "تکمیل شده",
                        tint = Color.White,
                        modifier = Modifier.size(24.dp)
                    )
                } else {
                    Text(text = "🌱", fontSize = 20.sp)
                }
            }

            Spacer(modifier = Modifier.width(14.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = habit.title,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (isDone) Color(0xFF2E7D32) else Color(0xFF212121),
                    textDecoration = if (isDone) TextDecoration.LineThrough else TextDecoration.None
                )

                Spacer(modifier = Modifier.height(4.dp))

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // Streak tag
                    if (streak > 0) {
                        Text(
                            text = "🔥 ${PersianCalendarHelper.toPersianDigits(streak)} روز پیاپی",
                            fontSize = 11.sp,
                            color = Color(0xFFE65100),
                            fontWeight = FontWeight.Medium
                        )
                    }

                    if (habit.exemptHolidays) {
                        Text(
                            text = "• معاف در تعطیلات",
                            fontSize = 10.sp,
                            color = Color(0xFF757575)
                        )
                    }
                }
            }

            // Timer Button
            IconButton(
                onClick = onStartTimer,
                modifier = Modifier
                    .size(36.dp)
                    .clip(CircleShape)
                    .background(Color(0xFFE8F5E9))
            ) {
                Icon(
                    imageVector = Icons.Default.Timer,
                    contentDescription = "تایمر عادت",
                    tint = Color(0xFF2E7D32),
                    modifier = Modifier.size(18.dp)
                )
            }
        }
    }
}

@Composable
fun TaskTodayCard(
    task: AppTask,
    categoryTitle: String,
    categoryColor: Color,
    onToggle: () -> Unit,
    onStartTimer: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (task.isCompleted) Color(0xFFFAFAFA) else Color.White
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = if (task.isCompleted) 1.dp else 2.dp),
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onToggle() }
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Checkbox
            Box(
                modifier = Modifier
                    .size(28.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(if (task.isCompleted) Color(0xFF2E7D32) else Color(0xFFEEEEEE)),
                contentAlignment = Alignment.Center
            ) {
                if (task.isCompleted) {
                    Icon(
                        imageVector = Icons.Default.Check,
                        contentDescription = "انجام شد",
                        tint = Color.White,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.width(14.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = task.title,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (task.isCompleted) Color(0xFF9E9E9E) else Color(0xFF212121),
                    textDecoration = if (task.isCompleted) TextDecoration.LineThrough else TextDecoration.None
                )

                Spacer(modifier = Modifier.height(4.dp))

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // Category pill
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(categoryColor.copy(alpha = 0.12f))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = categoryTitle,
                            fontSize = 10.sp,
                            color = categoryColor,
                            fontWeight = FontWeight.Medium
                        )
                    }

                    if (task.time != null) {
                        Text(
                            text = "⏰ ${PersianCalendarHelper.toPersianDigits(task.time)}",
                            fontSize = 11.sp,
                            color = Color(0xFF757575)
                        )
                    }

                    if (task.reminderMinutesBefore != null) {
                        Text(
                            text = "🔔 ${PersianCalendarHelper.toPersianDigits(task.reminderMinutesBefore)} دقیقه قبل",
                            fontSize = 10.sp,
                            color = Color(0xFF9E9E9E)
                        )
                    }
                }
            }

            // Timer Button
            IconButton(
                onClick = onStartTimer,
                modifier = Modifier
                    .size(34.dp)
                    .clip(CircleShape)
                    .background(Color(0xFFF5F5F5))
            ) {
                Icon(
                    imageVector = Icons.Default.PlayArrow,
                    contentDescription = "شروع تایمر",
                    tint = Color(0xFF424242),
                    modifier = Modifier.size(18.dp)
                )
            }
        }
    }
}

@Composable
fun EmptySectionPlaceholder(
    text: String,
    buttonText: String,
    onClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Color(0xFFF9FBF9))
            .padding(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(text = "🌱", fontSize = 28.sp)
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = text,
            fontSize = 13.sp,
            color = Color(0xFF757575)
        )
        Spacer(modifier = Modifier.height(10.dp))
        OutlinedButton(
            onClick = onClick,
            shape = RoundedCornerShape(10.dp)
        ) {
            Text(text = buttonText, fontSize = 12.sp, color = Color(0xFF2E7D32))
        }
    }
}
