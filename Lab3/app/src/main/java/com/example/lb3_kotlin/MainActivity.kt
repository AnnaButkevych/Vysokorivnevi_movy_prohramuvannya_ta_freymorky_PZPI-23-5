package com.example.lb3_kotlin

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.*
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.lb3_kotlin.ui.theme.Lb3_KotlinTheme
import com.example.lb3_kotlin.viewmodel.ShopViewModel
import com.example.lb3_kotlin.ui.screens.*

enum class ShopScreen {
    CATALOG,
    CART,
    CHECKOUT,
    CONFIRMATION
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            Lb3_KotlinTheme {
                ShopApp()
            }
        }
    }
}

@Composable
fun ShopApp() {
    val viewModel: ShopViewModel = viewModel()
    var currentScreen by remember { mutableStateOf(ShopScreen.CATALOG) }
    
    when (currentScreen) {
        ShopScreen.CATALOG -> {
            CatalogScreen(
                viewModel = viewModel,
                onNavigateToCart = { currentScreen = ShopScreen.CART }
            )
        }
        ShopScreen.CART -> {
            CartScreen(
                viewModel = viewModel,
                onNavigateToCatalog = { currentScreen = ShopScreen.CATALOG },
                onNavigateToCheckout = { currentScreen = ShopScreen.CHECKOUT }
            )
        }
        ShopScreen.CHECKOUT -> {
            CheckoutScreen(
                viewModel = viewModel,
                onOrderComplete = { currentScreen = ShopScreen.CONFIRMATION }
            )
        }
        ShopScreen.CONFIRMATION -> {
            OrderConfirmationScreen(
                onReturnToCatalog = { 
                    currentScreen = ShopScreen.CATALOG
                }
            )
        }
    }
}