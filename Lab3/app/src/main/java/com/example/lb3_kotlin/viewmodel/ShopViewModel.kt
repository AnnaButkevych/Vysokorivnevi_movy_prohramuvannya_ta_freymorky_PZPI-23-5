package com.example.lb3_kotlin.viewmodel

import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import com.example.lb3_kotlin.data.models.Product
import com.example.lb3_kotlin.data.models.CartItem
import com.example.lb3_kotlin.data.models.Order

class ShopViewModel : ViewModel() {
    
    // Sample products
    private val _products = MutableStateFlow<List<Product>>(
        listOf(
            Product(1, "Ноутбук", "Потужний ноутбук для роботи", 899.99),
            Product(2, "Телефон", "Смартфон нового покоління", 599.99),
            Product(3, "Планшет", "Портативний планшет", 349.99),
            Product(4, "Навушники", "Бездротові навушники", 199.99),
            Product(5, "Монітор", "4K монітор 27 дюймів", 449.99),
            Product(6, "Клавіатура", "Механічна клавіатура", 129.99),
        )
    )
    val products = _products.asStateFlow()
    
    // Cart management
    private val _cartItems = MutableStateFlow<List<CartItem>>(emptyList())
    val cartItems = _cartItems.asStateFlow()
    
    // Wishlist
    private val _wishlist = MutableStateFlow<Set<Int>>(emptySet())
    val wishlist = _wishlist.asStateFlow()
    
    // Orders
    private val _orders = MutableStateFlow<List<Order>>(emptyList())
    val orders = _orders.asStateFlow()
    
    fun addToCart(product: Product, quantity: Int = 1) {
        val currentCart = _cartItems.value.toMutableList()
        val existingItem = currentCart.find { it.product.id == product.id }
        
        if (existingItem != null) {
            currentCart.remove(existingItem)
            currentCart.add(existingItem.copy(quantity = existingItem.quantity + quantity))
        } else {
            currentCart.add(CartItem(product, quantity))
        }
        _cartItems.value = currentCart
    }
    
    fun removeFromCart(productId: Int) {
        _cartItems.value = _cartItems.value.filter { it.product.id != productId }
    }
    
    fun updateCartItemQuantity(productId: Int, quantity: Int) {
        if (quantity <= 0) {
            removeFromCart(productId)
        } else {
            _cartItems.value = _cartItems.value.map { item ->
                if (item.product.id == productId) item.copy(quantity = quantity) else item
            }
        }
    }
    
    fun toggleWishlist(productId: Int) {
        val currentWishlist = _wishlist.value.toMutableSet()
        if (currentWishlist.contains(productId)) {
            currentWishlist.remove(productId)
        } else {
            currentWishlist.add(productId)
        }
        _wishlist.value = currentWishlist
    }
    
    fun clearCart() {
        _cartItems.value = emptyList()
    }
    
    fun createOrder(
        customerName: String,
        customerEmail: String,
        address: String
    ): Order {
        val totalPrice = _cartItems.value.sumOf { it.product.price * it.quantity }
        val order = Order(
            id = "ORД-${System.currentTimeMillis()}",
            items = _cartItems.value,
            totalPrice = totalPrice,
            customerName = customerName,
            customerEmail = customerEmail,
            address = address
        )
        
        _orders.value = _orders.value + order
        clearCart()
        return order
    }
    
    fun getTotalPrice(): Double {
        return _cartItems.value.sumOf { it.product.price * it.quantity }
    }
    
    fun getCartItemCount(): Int {
        return _cartItems.value.sumOf { it.quantity }
    }
}

