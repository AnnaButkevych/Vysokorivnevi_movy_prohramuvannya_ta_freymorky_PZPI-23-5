package com.example.lb3_kotlin.data.models

data class Product(
    val id: Int,
    val name: String,
    val description: String,
    val price: Double,
    val imageUrl: String = ""
)

data class CartItem(
    val product: Product,
    val quantity: Int
)

data class Order(
    val id: String,
    val items: List<CartItem>,
    val totalPrice: Double,
    val customerName: String,
    val customerEmail: String,
    val address: String,
    val status: String = "Pending"
)

