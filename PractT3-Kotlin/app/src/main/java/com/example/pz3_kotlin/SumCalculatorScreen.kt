package com.example.pz3_kotlin

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp

@Composable
fun SumCalculatorScreen(modifier: Modifier = Modifier) {
    var number1 by remember { mutableStateOf("") }
    var number2 by remember { mutableStateOf("") }
    var result by remember { mutableStateOf<String?>(null) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "Обчислення суми",
            style = MaterialTheme.typography.headlineSmall
        )

        Spacer(modifier = Modifier.height(24.dp))

        OutlinedTextField(
            value = number1,
            onValueChange = { number1 = it },
            label = { Text("Перше число") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            isError = number1.isNotEmpty() && number1.toDoubleOrNull() == null
        )

        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(
            value = number2,
            onValueChange = { number2 = it },
            label = { Text("Друге число") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            isError = number2.isNotEmpty() && number2.toDoubleOrNull() == null
        )

        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = {
                val n1 = number1.toDoubleOrNull()
                val n2 = number2.toDoubleOrNull()
                result = if (n1 != null && n2 != null) {
                    val sum = n1 + n2
                    // Відображати як ціле, якщо дробова частина = 0
                    if (sum == sum.toLong().toDouble()) "Сума: ${sum.toLong()}"
                    else "Сума: $sum"
                } else {
                    "Помилка: введіть коректні числа!"
                }
            },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Обчислити суму")
        }

        result?.let { res ->
            Spacer(modifier = Modifier.height(24.dp))
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = if (res.startsWith("Помилка"))
                        MaterialTheme.colorScheme.errorContainer
                    else
                        MaterialTheme.colorScheme.primaryContainer
                )
            ) {
                Text(
                    text = res,
                    modifier = Modifier.padding(16.dp),
                    style = MaterialTheme.typography.headlineSmall,
                    color = if (res.startsWith("Помилка"))
                        MaterialTheme.colorScheme.onErrorContainer
                    else
                        MaterialTheme.colorScheme.onPrimaryContainer
                )
            }
        }
    }
}

