import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000/api";

const emptyCart = { items: [], total: 0 };
const initialAuthForm = { fullName: "", username: "", password: "" };
const initialCheckoutForm = { customerName: "", address: "", phone: "" };

async function requestJson(path, options = {}, authToken = "") {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Сталася помилка запиту.");
  }

  return data;
}

function formatPrice(value) {
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
    maximumFractionDigits: 0,
  }).format(value);
}

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(emptyCart);
  const [orders, setOrders] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    () => localStorage.getItem("lab2-token") || "",
  );
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState(initialAuthForm);
  const [checkoutForm, setCheckoutForm] = useState(initialCheckoutForm);
  const [notice, setNotice] = useState({ type: "", text: "" });
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingPanel, setLoadingPanel] = useState(false);
  const [submittingAuth, setSubmittingAuth] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);

  async function apiRequest(path, options = {}, authToken = token) {
    return requestJson(path, options, authToken);
  }

  async function loadProducts() {
    setLoadingProducts(true);

    try {
      const data = await apiRequest("/products", {}, "");
      setProducts(data.products || []);
    } catch (error) {
      setNotice({ type: "error", text: error.message });
    } finally {
      setLoadingProducts(false);
    }
  }

  useEffect(() => {
    let ignore = false;

    async function fetchProducts() {
      try {
        const data = await requestJson("/products");

        if (!ignore) {
          setProducts(data.products || []);
        }
      } catch (error) {
        if (!ignore) {
          setNotice({ type: "error", text: error.message });
        }
      } finally {
        if (!ignore) {
          setLoadingProducts(false);
        }
      }
    }

    fetchProducts();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!token) {
      localStorage.removeItem("lab2-token");
      return;
    }

    localStorage.setItem("lab2-token", token);
    let ignore = false;

    async function fetchProtectedData() {
      setLoadingPanel(true);

      try {
        const [profileData, cartData, ordersData] = await Promise.all([
          requestJson("/auth/me", {}, token),
          requestJson("/cart", {}, token),
          requestJson("/orders", {}, token),
        ]);

        if (ignore) {
          return;
        }

        setUser(profileData.user);
        setCart(cartData);
        setOrders(ordersData.orders || []);
        setStatuses(ordersData.statuses || []);
        setCheckoutForm((current) => ({
          ...current,
          customerName: current.customerName || profileData.user.fullName,
        }));
      } catch (error) {
        if (ignore) {
          return;
        }

        localStorage.removeItem("lab2-token");
        setToken("");
        setUser(null);
        setCart(emptyCart);
        setOrders([]);
        setStatuses([]);
        setNotice({ type: "error", text: error.message });
      } finally {
        if (!ignore) {
          setLoadingPanel(false);
        }
      }
    }

    fetchProtectedData();

    return () => {
      ignore = true;
    };
  }, [token]);

  function showMessage(type, text) {
    setNotice({ type, text });
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setSubmittingAuth(true);

    try {
      if (authMode === "register") {
        const registerData = await apiRequest(
          "/auth/register",
          {
            method: "POST",
            body: JSON.stringify(authForm),
          },
          "",
        );

        showMessage("success", registerData.message);
        setAuthMode("login");
        setAuthForm((current) => ({ ...current, password: "" }));
      } else {
        const loginData = await apiRequest(
          "/auth/login",
          {
            method: "POST",
            body: JSON.stringify({
              username: authForm.username,
              password: authForm.password,
            }),
          },
          "",
        );

        setToken(loginData.token);
        setCheckoutForm((current) => ({
          ...current,
          customerName: loginData.user.fullName,
        }));
        showMessage("success", loginData.message);
      }
    } catch (error) {
      showMessage("error", error.message);
    } finally {
      setSubmittingAuth(false);
    }
  }

  async function handleLogout() {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } catch {
      // Ignore logout transport errors and clear local state anyway.
    }

    setToken("");
    setAuthForm(initialAuthForm);
    setCheckoutForm(initialCheckoutForm);
    showMessage("success", "Сесію завершено.");
  }

  async function handleAddToCart(productId) {
    if (!token) {
      showMessage(
        "error",
        "Спочатку увійдіть у систему, щоб працювати з кошиком.",
      );
      return;
    }

    try {
      const data = await apiRequest("/cart", {
        method: "POST",
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      setCart(data.cart);
      showMessage("success", data.message);
      await loadProducts();
    } catch (error) {
      showMessage("error", error.message);
    }
  }

  async function handleQuantityChange(productId, quantity) {
    try {
      const data = await apiRequest(`/cart/${productId}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity }),
      });

      setCart(data.cart);
      showMessage("success", data.message);
    } catch (error) {
      showMessage("error", error.message);
    }
  }

  async function handleRemoveFromCart(productId) {
    try {
      const data = await apiRequest(`/cart/${productId}`, {
        method: "DELETE",
      });

      setCart(data.cart);
      showMessage("success", data.message);
      await loadProducts();
    } catch (error) {
      showMessage("error", error.message);
    }
  }

  async function handleCheckout(event) {
    event.preventDefault();
    setSubmittingOrder(true);

    try {
      const data = await apiRequest("/orders", {
        method: "POST",
        body: JSON.stringify(checkoutForm),
      });

      setCart(emptyCart);
      setOrders((current) => [data.order, ...current]);
      setCheckoutForm((current) => ({
        ...initialCheckoutForm,
        customerName: current.customerName,
      }));
      showMessage("success", data.message);
      await loadProducts();
    } catch (error) {
      showMessage("error", error.message);
    } finally {
      setSubmittingOrder(false);
    }
  }

  async function handleProgressOrder(orderId) {
    try {
      const data = await apiRequest(`/orders/${orderId}/progress`, {
        method: "POST",
      });

      setOrders((current) =>
        current.map((order) => (order.id === orderId ? data.order : order)),
      );
      showMessage("success", data.message);
    } catch (error) {
      showMessage("error", error.message);
    }
  }

  return (
    <div className="app-shell">
      <header className="hero-panel">
        <div>
          <p className="eyebrow">Лабораторна робота №2</p>
          <h1>Node.js + Express + React магазин техніки</h1>
          <p className="hero-copy">
            Каталог товарів, кошик, оформлення замовлень, авторизація та
            відстеження статусу в одному застосунку.
          </p>
        </div>

        <div className="hero-badge-grid">
          <div className="hero-badge">
            <span>Рівень 1</span>
            <strong>{products.length} товарів у каталозі</strong>
          </div>
          <div className="hero-badge">
            <span>Рівень 2</span>
            <strong>{cart.items.length} позицій у кошику</strong>
          </div>
          <div className="hero-badge">
            <span>Рівень 3</span>
            <strong>{orders.length} ваших замовлень</strong>
          </div>
        </div>
      </header>

      {notice.text ? (
        <div className={`notice notice-${notice.type || "info"}`}>
          {notice.text}
        </div>
      ) : null}

      <main className="content-grid">
        <section className="catalog-panel panel">
          <div className="panel-heading">
            <div>
              <p className="panel-kicker">Рівень 1</p>
              <h2>Каталог товарів</h2>
            </div>
            <span className="panel-meta">
              {loadingProducts
                ? "Завантаження..."
                : `У наявності: ${products.length}`}
            </span>
          </div>

          <div className="product-grid">
            {products.map((product) => (
              <article className="product-card" key={product.id}>
                <div className="product-topline">
                  <span className="category-tag">{product.category}</span>
                  <span className={product.stock ? "stock ok" : "stock out"}>
                    {product.stock
                      ? `Залишок: ${product.stock}`
                      : "Немає в наявності"}
                  </span>
                </div>
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <div className="product-footer">
                  <strong>{formatPrice(product.price)}</strong>
                  <button
                    type="button"
                    onClick={() => handleAddToCart(product.id)}
                    disabled={!product.stock}
                  >
                    Додати в кошик
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="sidebar-stack">
          <section className="panel auth-panel">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">Рівень 3</p>
                <h2>{user ? "Профіль користувача" : "Вхід та реєстрація"}</h2>
              </div>
            </div>

            {user ? (
              <div className="user-card">
                <p className="user-name">{user.fullName}</p>
                <p className="user-login">@{user.username}</p>
                <button
                  type="button"
                  className="secondary"
                  onClick={handleLogout}
                >
                  Вийти
                </button>
              </div>
            ) : (
              <>
                <div className="mode-switch">
                  <button
                    type="button"
                    className={authMode === "login" ? "active" : ""}
                    onClick={() => setAuthMode("login")}
                  >
                    Вхід
                  </button>
                  <button
                    type="button"
                    className={authMode === "register" ? "active" : ""}
                    onClick={() => setAuthMode("register")}
                  >
                    Реєстрація
                  </button>
                </div>

                <form className="auth-form" onSubmit={handleAuthSubmit}>
                  {authMode === "register" ? (
                    <label>
                      Повне ім'я
                      <input
                        type="text"
                        value={authForm.fullName}
                        onChange={(event) =>
                          setAuthForm((current) => ({
                            ...current,
                            fullName: event.target.value,
                          }))
                        }
                        required
                      />
                    </label>
                  ) : null}

                  <label>
                    Логін
                    <input
                      type="text"
                      value={authForm.username}
                      onChange={(event) =>
                        setAuthForm((current) => ({
                          ...current,
                          username: event.target.value,
                        }))
                      }
                      required
                    />
                  </label>

                  <label>
                    Пароль
                    <input
                      type="password"
                      value={authForm.password}
                      onChange={(event) =>
                        setAuthForm((current) => ({
                          ...current,
                          password: event.target.value,
                        }))
                      }
                      required
                    />
                  </label>

                  <button type="submit" disabled={submittingAuth}>
                    {submittingAuth
                      ? "Обробка..."
                      : authMode === "login"
                        ? "Увійти"
                        : "Створити акаунт"}
                  </button>
                </form>

                <p className="hint">
                  Демо-доступ: <strong>demo</strong> / <strong>demo123</strong>
                </p>
              </>
            )}
          </section>

          <section className="panel cart-panel">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">Рівень 2</p>
                <h2>Кошик</h2>
              </div>
              <span className="panel-meta">{formatPrice(cart.total)}</span>
            </div>

            {!user ? (
              <p className="empty-state">
                Авторизуйтесь, щоб зберігати товари у кошику.
              </p>
            ) : loadingPanel ? (
              <p className="empty-state">Оновлення даних...</p>
            ) : cart.items.length === 0 ? (
              <p className="empty-state">
                Кошик порожній. Додайте товари з каталогу.
              </p>
            ) : (
              <div className="cart-list">
                {cart.items.map((item) => (
                  <div className="cart-item" key={item.productId}>
                    <div>
                      <strong>{item.product.name}</strong>
                      <p>
                        {formatPrice(item.product.price)} × {item.quantity} ={" "}
                        {formatPrice(item.lineTotal)}
                      </p>
                    </div>

                    <div className="cart-controls">
                      <input
                        type="number"
                        min="1"
                        max={item.product.stock + item.quantity}
                        value={item.quantity}
                        onChange={(event) =>
                          handleQuantityChange(
                            item.productId,
                            Number(event.target.value),
                          )
                        }
                      />
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => handleRemoveFromCart(item.productId)}
                      >
                        Видалити
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="panel checkout-panel">
            <div className="panel-heading">
              <div>
                <p className="panel-kicker">Рівень 2</p>
                <h2>Оформлення замовлення</h2>
              </div>
            </div>

            <form className="checkout-form" onSubmit={handleCheckout}>
              <label>
                Отримувач
                <input
                  type="text"
                  value={checkoutForm.customerName}
                  onChange={(event) =>
                    setCheckoutForm((current) => ({
                      ...current,
                      customerName: event.target.value,
                    }))
                  }
                  required
                  disabled={!user}
                />
              </label>

              <label>
                Адреса доставки
                <input
                  type="text"
                  value={checkoutForm.address}
                  onChange={(event) =>
                    setCheckoutForm((current) => ({
                      ...current,
                      address: event.target.value,
                    }))
                  }
                  required
                  disabled={!user}
                />
              </label>

              <label>
                Телефон
                <input
                  type="tel"
                  value={checkoutForm.phone}
                  onChange={(event) =>
                    setCheckoutForm((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                  required
                  disabled={!user}
                />
              </label>

              <button
                type="submit"
                disabled={!user || cart.items.length === 0 || submittingOrder}
              >
                {submittingOrder ? "Створення..." : "Підтвердити замовлення"}
              </button>
            </form>
          </section>
        </aside>
      </main>

      <section className="panel orders-panel">
        <div className="panel-heading">
          <div>
            <p className="panel-kicker">Рівень 3</p>
            <h2>Статуси замовлень</h2>
          </div>
          <span className="panel-meta">
            {statuses.length
              ? statuses.join(" → ")
              : "Авторизуйтесь для перегляду"}
          </span>
        </div>

        {!user ? (
          <p className="empty-state">
            Увійдіть у систему, щоб переглянути історію замовлень.
          </p>
        ) : orders.length === 0 ? (
          <p className="empty-state">Замовлень ще немає.</p>
        ) : (
          <div className="orders-grid">
            {orders.map((order) => (
              <article className="order-card" key={order.id}>
                <div className="order-head">
                  <div>
                    <h3>Замовлення #{order.id}</h3>
                    <p>{new Date(order.createdAt).toLocaleString("uk-UA")}</p>
                  </div>
                  <span className="status-pill">{order.status}</span>
                </div>

                <ul className="order-items">
                  {order.items.map((item) => (
                    <li key={`${order.id}-${item.productId}`}>
                      <span>{item.name}</span>
                      <strong>
                        {item.quantity} × {formatPrice(item.price)}
                      </strong>
                    </li>
                  ))}
                </ul>

                <div className="order-foot">
                  <p>
                    Отримувач: {order.customerName}, {order.phone}
                  </p>
                  <p>Адреса: {order.address}</p>
                  <strong>{formatPrice(order.total)}</strong>
                </div>

                <button
                  type="button"
                  className="secondary"
                  onClick={() => handleProgressOrder(order.id)}
                  disabled={order.status === statuses[statuses.length - 1]}
                >
                  Оновити статус
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default App;
