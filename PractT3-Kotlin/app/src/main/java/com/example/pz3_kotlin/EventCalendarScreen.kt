package com.example.pz3_kotlin

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import java.text.SimpleDateFormat
import java.util.*

data class Event(val date: String, val name: String)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EventCalendarScreen(modifier: Modifier = Modifier) {
    val events = remember { mutableStateListOf<Event>() }
    var selectedDate by remember { mutableStateOf("") }
    var newEventName by remember { mutableStateOf("") }
    var showDatePicker by remember { mutableStateOf(false) }
    val datePickerState = rememberDatePickerState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("Календар подій", style = MaterialTheme.typography.headlineSmall)

        Spacer(modifier = Modifier.height(16.dp))

        // ── Кнопка вибору дати ──────────────────────────────────────────────
        OutlinedButton(
            onClick = { showDatePicker = true },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(
                if (selectedDate.isEmpty()) "Оберіть дату"
                else "Дата: $selectedDate"
            )
        }

        // ── Діалог DatePicker ────────────────────────────────────────────────
        if (showDatePicker) {
            DatePickerDialog(
                onDismissRequest = { showDatePicker = false },
                confirmButton = {
                    TextButton(onClick = {
                        datePickerState.selectedDateMillis?.let { millis ->
                            // UTC щоб уникнути зміщення часового поясу
                            val sdf = SimpleDateFormat("dd.MM.yyyy", Locale.getDefault())
                            sdf.timeZone = TimeZone.getTimeZone("UTC")
                            selectedDate = sdf.format(Date(millis))
                        }
                        showDatePicker = false
                    }) { Text("OK") }
                },
                dismissButton = {
                    TextButton(onClick = { showDatePicker = false }) { Text("Скасувати") }
                }
            ) {
                DatePicker(state = datePickerState)
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // ── Поле вводу назви події ───────────────────────────────────────────
        OutlinedTextField(
            value = newEventName,
            onValueChange = { newEventName = it },
            label = { Text("Назва події") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            enabled = selectedDate.isNotEmpty()
        )

        Spacer(modifier = Modifier.height(8.dp))

        Button(
            onClick = {
                if (selectedDate.isNotEmpty() && newEventName.isNotBlank()) {
                    events.add(Event(date = selectedDate, name = newEventName.trim()))
                    newEventName = ""
                }
            },
            modifier = Modifier.fillMaxWidth(),
            enabled = selectedDate.isNotEmpty() && newEventName.isNotBlank()
        ) {
            Text("Додати подію")
        }

        Spacer(modifier = Modifier.height(16.dp))
        HorizontalDivider()
        Spacer(modifier = Modifier.height(8.dp))

        // ── Список подій для вибраної дати ──────────────────────────────────
        if (selectedDate.isEmpty()) {
            Text(
                text = "Оберіть дату, щоб переглянути або додати події",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        } else {
            val dayEvents = events.filter { it.date == selectedDate }
            Text(
                text = "Події на $selectedDate (${dayEvents.size}):",
                style = MaterialTheme.typography.titleMedium
            )
            Spacer(modifier = Modifier.height(8.dp))

            if (dayEvents.isEmpty()) {
                Text(
                    text = "Немає подій на цю дату",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    items(items = dayEvents, key = { it.hashCode() }) { event ->
                        Card(modifier = Modifier.fillMaxWidth()) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 12.dp, vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "• ${event.name}",
                                    modifier = Modifier.weight(1f),
                                    style = MaterialTheme.typography.bodyMedium
                                )
                                TextButton(
                                    onClick = { events.remove(event) }
                                ) {
                                    Text("✕", color = MaterialTheme.colorScheme.error)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

