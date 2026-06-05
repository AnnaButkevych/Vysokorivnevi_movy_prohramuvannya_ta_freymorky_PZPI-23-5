import express from "express";
import cors from "cors";

const app = express();
const PORT = 5000;

const ORDER_STATUSES = [
  "Створено",
  "Підтверджено",
  "Передано на склад",
  "Відправлено",
  "Доставлено",
];

const products = [
  {
    id: 1,
    name: "Ноутбук NovaBook Air 14",
    category: "Ноутбуки",
    price: 34999,
    stock: 6,
    description: "Легкий ноутбук для навчання, роботи та щоденних задач.",
  },
  {
    id: 2,
    name: "Смартфон Orbit X5",
    category: "Смартфони",
    price: 18999,
    stock: 12,
    description: "Смартфон з AMOLED-екраном, NFC та ємною батареєю.",
  },
  {
    id: 3,
    name: "Навушники SoundPeak Pro",
    category: "Аксесуари",
    price: 4299,
    stock: 20,
    description: "Бездротові навушники з активним шумозаглушенням.",
  },
  {
    id: 4,
    name: "Монітор Vision 27Q",
    category: "Монітори",
    price: 11999,
    stock: 8,
    description: "27-дюймовий QHD-монітор для роботи та мультимедіа.",
  },
  {
    id: 5,
    name: "Механічна клавіатура TypeFlow",
    category: "Периферія",
    price: 3599,
    stock: 15,
    description:
      "Компактна клавіатура з підсвічуванням та hot-swap перемикачами.",
  },
  {
    id: 6,
    name: "Рюкзак CityPack 18L",
    category: "Аксесуари",
    price: 2199,
    stock: 10,
    description: 'Міський рюкзак з відділенням для ноутбука 15.6".',
  },
];

const users = [
  {
    id: 1,
    username: "demo",
    password: "demo123",
    fullName: "Демо Користувач",
  },
];

const sessions = new Map();
const carts = new Map();
const orders = [];

let nextUserId = users.length + 1;
let nextOrderId = 1;

app.use(cors());
app.use(express.json());

const sanitizeUser = ({ password, ...user }) => user;

const getTokenFromRequest = (req) => {
  const header = req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    return null;
  }

  return header.slice(7).trim();
};

const getUserByToken = (req) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    return null;
  }

  const userId = sessions.get(token);
  return users.find((user) => user.id === userId) || null;
};

const requireAuth = (req, res, next) => {
  const user = getUserByToken(req);

  if (!user) {
    return res.status(401).json({ message: "Потрібна авторизація." });
  }

  req.user = user;
  return next();
};

const getCartForUser = (userId) => {
  if (!carts.has(userId)) {
    carts.set(userId, []);
  }

  return carts.get(userId);
};

const mapCartItem = (item) => {
  const product = products.find((entry) => entry.id === item.productId);

  return {
    productId: item.productId,
    quantity: item.quantity,
    product,
    lineTotal: product.price * item.quantity,
  };
};

const buildCartResponse = (userId) => {
  const items = getCartForUser(userId).map(mapCartItem);
  const total = items.reduce((sum, item) => sum + item.lineTotal, 0);

  return { items, total };
};

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/products", (req, res) => {
  res.json({ products });
});

app.post("/api/auth/register", (req, res) => {
  const { username, password, fullName } = req.body;

  if (!username || !password || !fullName) {
    return res.status(400).json({ message: "Заповніть всі поля реєстрації." });
  }

  const existingUser = users.find((user) => user.username === username);

  if (existingUser) {
    return res
      .status(409)
      .json({ message: "Користувач з таким логіном вже існує." });
  }

  const user = {
    id: nextUserId++,
    username,
    password,
    fullName,
  };

  users.push(user);

  return res.status(201).json({
    message: "Реєстрація успішна. Тепер увійдіть у систему.",
    user: sanitizeUser(user),
  });
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(
    (entry) => entry.username === username && entry.password === password,
  );

  if (!user) {
    return res.status(401).json({ message: "Невірний логін або пароль." });
  }

  const token = `token-${user.id}-${Date.now()}`;
  sessions.set(token, user.id);

  return res.json({
    token,
    user: sanitizeUser(user),
    message: "Вхід виконано успішно.",
  });
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});

app.post("/api/auth/logout", requireAuth, (req, res) => {
  const token = getTokenFromRequest(req);
  sessions.delete(token);

  res.json({ message: "Ви вийшли з системи." });
});

app.get("/api/cart", requireAuth, (req, res) => {
  res.json(buildCartResponse(req.user.id));
});

app.post("/api/cart", requireAuth, (req, res) => {
  const productId = Number(req.body.productId);
  const quantity = Number(req.body.quantity ?? 1);
  const product = products.find((entry) => entry.id === productId);

  if (!product) {
    return res.status(404).json({ message: "Товар не знайдено." });
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    return res
      .status(400)
      .json({ message: "Кількість має бути додатним цілим числом." });
  }

  const cart = getCartForUser(req.user.id);
  const existingItem = cart.find((item) => item.productId === productId);
  const nextQuantity = (existingItem?.quantity || 0) + quantity;

  if (nextQuantity > product.stock) {
    return res.status(400).json({ message: "Недостатньо товару на складі." });
  }

  if (existingItem) {
    existingItem.quantity = nextQuantity;
  } else {
    cart.push({ productId, quantity });
  }

  return res.status(201).json({
    message: "Товар додано до кошика.",
    cart: buildCartResponse(req.user.id),
  });
});

app.patch("/api/cart/:productId", requireAuth, (req, res) => {
  const productId = Number(req.params.productId);
  const quantity = Number(req.body.quantity);
  const product = products.find((entry) => entry.id === productId);

  if (!product) {
    return res.status(404).json({ message: "Товар не знайдено." });
  }

  if (!Number.isInteger(quantity) || quantity < 1) {
    return res
      .status(400)
      .json({ message: "Кількість має бути додатним цілим числом." });
  }

  if (quantity > product.stock) {
    return res.status(400).json({ message: "Недостатньо товару на складі." });
  }

  const cart = getCartForUser(req.user.id);
  const item = cart.find((entry) => entry.productId === productId);

  if (!item) {
    return res.status(404).json({ message: "Товар відсутній у кошику." });
  }

  item.quantity = quantity;

  return res.json({
    message: "Кошик оновлено.",
    cart: buildCartResponse(req.user.id),
  });
});

app.delete("/api/cart/:productId", requireAuth, (req, res) => {
  const productId = Number(req.params.productId);
  const cart = getCartForUser(req.user.id);
  const itemIndex = cart.findIndex((item) => item.productId === productId);

  if (itemIndex === -1) {
    return res.status(404).json({ message: "Товар відсутній у кошику." });
  }

  cart.splice(itemIndex, 1);

  return res.json({
    message: "Товар видалено з кошика.",
    cart: buildCartResponse(req.user.id),
  });
});

app.post("/api/orders", requireAuth, (req, res) => {
  const { customerName, address, phone } = req.body;
  const cart = getCartForUser(req.user.id);

  if (!customerName || !address || !phone) {
    return res
      .status(400)
      .json({ message: "Заповніть усі поля для оформлення замовлення." });
  }

  if (cart.length === 0) {
    return res.status(400).json({ message: "Кошик порожній." });
  }

  const items = cart.map((item) => mapCartItem(item));
  const total = items.reduce((sum, item) => sum + item.lineTotal, 0);

  for (const item of items) {
    if (item.quantity > item.product.stock) {
      return res.status(400).json({
        message: `Товар \"${item.product.name}\" більше недоступний у потрібній кількості.`,
      });
    }
  }

  for (const item of items) {
    item.product.stock -= item.quantity;
  }

  const order = {
    id: nextOrderId++,
    userId: req.user.id,
    customerName,
    address,
    phone,
    total,
    statusIndex: 0,
    status: ORDER_STATUSES[0],
    createdAt: new Date().toISOString(),
    items: items.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    })),
  };

  orders.push(order);
  carts.set(req.user.id, []);

  return res.status(201).json({
    message: "Замовлення створено.",
    order,
  });
});

app.get("/api/orders", requireAuth, (req, res) => {
  const userOrders = orders
    .filter((order) => order.userId === req.user.id)
    .sort(
      (left, right) => new Date(right.createdAt) - new Date(left.createdAt),
    );

  res.json({ orders: userOrders, statuses: ORDER_STATUSES });
});

app.post("/api/orders/:orderId/progress", requireAuth, (req, res) => {
  const orderId = Number(req.params.orderId);
  const order = orders.find(
    (entry) => entry.id === orderId && entry.userId === req.user.id,
  );

  if (!order) {
    return res.status(404).json({ message: "Замовлення не знайдено." });
  }

  if (order.statusIndex >= ORDER_STATUSES.length - 1) {
    return res.status(400).json({ message: "Замовлення вже доставлено." });
  }

  order.statusIndex += 1;
  order.status = ORDER_STATUSES[order.statusIndex];

  return res.json({
    message: "Статус замовлення оновлено.",
    order,
  });
});

app.use((req, res) => {
  res.status(404).json({ message: "Маршрут не знайдено." });
});

app.listen(PORT, () => console.log(`Сервер працює на порту ${PORT}`));
