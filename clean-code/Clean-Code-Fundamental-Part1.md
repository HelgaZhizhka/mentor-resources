# Основы чистого кода

**Чистый код** — это код, который легко читать, понимать и поддерживать. Он написан так, что другой разработчик (или вы через полгода) сможет быстро разобраться, что происходит, и внести изменения без страха что-то сломать.

## Зачем нужен чистый код?

- **Снижает стоимость поддержки** — меньше времени на разбор "что это вообще делает"
- **Упрощает добавление новых фич** — понятная структура = быстрая разработка
- **Уменьшает количество багов** — явный код = меньше неожиданностей
- **Облегчает работу в команде** — все понимают код друг друга
- **Упрощает код-ревью** — не нужно тратить часы на разбор

### Цена плохого кода

```javascript
// ❌ Плохой код
function calc(a, b, t) {
  if (t === 1) return a + b;
  if (t === 2) return a - b;
  if (t === 3) return a * b;
  return a / b;
}
```

**Проблемы:**

- Непонятные имена (`a`, `b`, `t`)
- Магические числа (что такое `1`, `2`, `3`?)
- Непонятная логика выбора операции через магические числа
- Нет обработки деления на ноль

```typescript
// ✅ Чистый код
const OPERATIONS = {
  ADD: 'add',
  SUBTRACT: 'subtract',
  MULTIPLY: 'multiply',
  DIVIDE: 'divide',
} as const;

type Operation = (typeof OPERATIONS)[keyof typeof OPERATIONS];

function calculate(firstNumber: number, secondNumber: number, operation: Operation): number {
  switch (operation) {
    case OPERATIONS.ADD:
      return firstNumber + secondNumber;
    case OPERATIONS.SUBTRACT:
      return firstNumber - secondNumber;
    case OPERATIONS.MULTIPLY:
      return firstNumber * secondNumber;
    case OPERATIONS.DIVIDE:
      if (secondNumber === 0) {
        throw new Error('Деление на ноль невозможно');
      }
      return firstNumber / secondNumber;
    default:
      throw new Error(`Неизвестная операция: ${operation}`);
  }
}
```

## 1. Именование (Naming Conventions)

### 1.1 Общие принципы

**Правила хорошего именования:**

1. **Понятность превыше краткости** — `userAge` лучше, чем `ua`
2. **Избегать сокращений** — `button` лучше, чем `btn` (кроме общепринятых: `id`, `url`, `api`)
3. **Контекст важен** — `name` в контексте `User` понятно, но `n` — нет
4. **Избегать дезинформации** — `userList` должен быть массивом, а не объектом

**❌ Плохо:**

```typescript
const d = new Date(); // ❌ Что такое d?
const temp = getData(); // ❌ Временная переменная с неясным смыслом
const data = fetchUsers(); // ❌ Слишком общее
```

**✅ Хорошо:**

```typescript
const currentDate = new Date();
const userResponse = getData();
const users = fetchUsers();
```

### 1.2 Переменные

**Правила:**

- **camelCase** для обычных переменных
- **UPPER_SNAKE_CASE** для констант
- **Существительные** для данных
- **Множественное число** для массивов

**❌ Плохо:**

```typescript
const d = 5; // ❌ Непонятно что это
const UserName = 'John'; // ❌ Переменная не должна начинаться с большой буквы
const user = ['John', 'Jane', 'Bob']; // ❌ Имя в единственном числе, а данные — массив
const maxage = 100; // ❌ Непонятно, что это константа
```

**✅ Хорошо:**

```typescript
const daysInWeek = 7;
const userName = 'John';
const users = ['John', 'Jane', 'Bob'];
const MAX_AGE = 100;
const API_ENDPOINT = 'https://api.example.com';
```

**Контекстные имена:**

```typescript
// ❌ Плохо — непонятно из контекста
const process = (n: string): string => n.toUpperCase();

// ✅ Хорошо — контекст ясен
const formatUserName = (userName: string): string => userName.toUpperCase();
```

### 1.3 Функции

**Правила:**

- **camelCase**
- **Глаголы** для действий
- **get/set/is/has/should** префиксы
- **Имя отражает ЧТО делает функция**

**Типичные префиксы:**

| Префикс     | Значение                 | Пример                               |
| ----------- | ------------------------ | ------------------------------------ |
| `get`       | Получить данные          | `getUser()`, `getUserName()`         |
| `set`       | Установить значение      | `setUser()`, `setUserName()`         |
| `is`        | Проверка boolean         | `isActive()`, `isValid()`            |
| `has`       | Наличие чего-то          | `hasPermission()`, `hasAccess()`     |
| `should`    | Условие                  | `shouldUpdate()`, `shouldRender()`   |
| `create`    | Создать                  | `createUser()`, `createOrder()`      |
| `update`    | Обновить                 | `updateUser()`, `updateProfile()`    |
| `delete`    | Удалить                  | `deleteUser()`, `deleteOrder()`      |
| `fetch`     | Загрузить данные (async) | `fetchUsers()`, `fetchPosts()`       |
| `handle`    | Обработчик события       | `handleClick()`, `handleSubmit()`    |
| `calculate` | Вычислить                | `calculateTotal()`, `calculateTax()` |
| `validate`  | Валидация                | `validateEmail()`, `validateForm()`  |
| `format`    | Форматирование           | `formatDate()`, `formatCurrency()`   |

**❌ Плохо:**

```typescript
const data = () => {
  /*...*/
}; // ❌ Не глагол
const process = () => {
  /*...*/
}; // ❌ Слишком общее
const doStuff = () => {
  /*...*/
}; // ❌ Непонятно что делает
const x = (a, b) => {
  /*...*/
}; // ❌ Нечитаемо
```

**✅ Хорошо:**

```typescript
const getUserById = (id: string): User => {
  /*...*/
};
const calculateTotalPrice = (items: Item[]): number => {
  /*...*/
};
const isUserActive = (user: User): boolean => {
  /*...*/
};
const hasAdminPermission = (user: User): boolean => {
  /*...*/
};
const shouldRenderHeader = (): boolean => {
  /*...*/
};
```

**Одна функция — одно действие:**

```typescript
// ❌ Плохо — функция делает слишком много
const processUserAndSendEmail = (user: User) => {
  validateUser(user);
  saveUser(user);
  sendWelcomeEmail(user);
  logActivity(user);
};

// ✅ Хорошо — каждая функция делает одно
const validateUser = (user: User): boolean => {
  /*...*/
};
const saveUser = (user: User): void => {
  /*...*/
};
const sendWelcomeEmail = (user: User): void => {
  /*...*/
};
const logUserActivity = (user: User): void => {
  /*...*/
};

const onboardNewUser = (user: User): void => {
  if (!validateUser(user)) return;
  saveUser(user);
  sendWelcomeEmail(user);
  logUserActivity(user);
};
```

### 1.4 Классы и компоненты

**Правила:**

- **PascalCase**
- **Существительные**
- **Описательные имена**

**❌ Плохо:**

```typescript
class user {} // ❌ Начинается с маленькой буквы
class UserManager {} // ❌ Слишком общий суффикс
class UserUtils {} // ❌ "Utils" — признак плохой абстракции
class DataHandler {} // ❌ Непонятно что обрабатывает
```

**✅ Хорошо:**

```typescript
class User {}
class UserRepository {} // Конкретная ответственность
class UserValidator {}
class EmailService {}
class PaymentProcessor {}

// React компоненты
const UserProfile = () => {};
const ProductCard = () => {};
const NavigationMenu = () => {};
```

### 1.5 Boolean переменные

**Правила:**

- **is/has/should/can** префиксы
- **Утвердительная форма**
- **Понятный вопрос**

**❌ Плохо:**

```typescript
const active = true; // ❌ Не ясно что это boolean
const notDisabled = false; // ❌ Двойное отрицание
const flag = true; // ❌ Непонятно что за флаг
```

**✅ Хорошо:**

```typescript
const isActive = true;
const isDisabled = false;
const hasPermission = true;
const shouldUpdate = false;
const canDelete = true;
const isLoading = false;
const hasErrors = true;
```

**Примеры в контексте:**

```typescript
// User
const isUserLoggedIn = true;
const hasUserVerifiedEmail = false;
const isUserAdmin = true;

// Form
const isFormValid = true;
const hasFormErrors = false;
const shouldShowErrors = true;

// UI
const isModalOpen = false;
const shouldRenderHeader = true;
const canSubmitForm = true;
```

### 1.6 Анти-паттерны именования

**Избегайте:**

| Плохо         | Почему плохо                 | Хорошо                        |
| ------------- | ---------------------------- | ----------------------------- |
| `temp`        | Непонятно что временного     | `currentUser`, `cachedData`   |
| `data`        | Слишком общее                | `users`, `products`, `orders` |
| `info`        | Неинформативно               | `userDetails`, `orderSummary` |
| `obj`         | Непонятно что за объект      | `user`, `product`, `order`    |
| `arr`         | Непонятно что в массиве      | `users`, `items`, `products`  |
| `flag`        | Непонятно что за флаг        | `isActive`, `shouldUpdate`    |
| `x`, `y`, `z` | Однобуквенные (кроме циклов) | Полное имя                    |
| `userObj`     | Венгерская нотация           | `user` (тип и так виден)      |
| `strName`     | Венгерская нотация           | `userName`                    |

**Исключения:**

- `i`, `j`, `k` — в коротких циклах
- `e` — для event в обработчиках
- `_` — для неиспользуемых параметров

```typescript
// ✅ Допустимо
for (let i = 0; i < items.length; i++) {}

array.forEach((_, index) => {}); // Не используем элемент

button.addEventListener('click', (e) => {
  e.preventDefault();
});
```

## 2. Функции и методы

### 2.1 Размер функции

**Правило:** Функция должна делать ОДНО действие.
**Оптимальный размер:**

- **5-15 строк** — идеально
- **20-30 строк** — приемлемо
- **Больше 30** — подумать о разбиении

**❌ Плохо — функция делает слишком много:**

```typescript
const processOrder = (order: Order) => {
  // Валидация (5 строк)
  if (!order.items.length) throw new Error('Empty order');
  if (!order.user) throw new Error('No user');
  if (!order.address) throw new Error('No address');

  // Вычисление цены (10 строк)
  let total = 0;
  order.items.forEach((item) => {
    const discount = item.hasDiscount ? item.price * 0.1 : 0;
    const tax = (item.price - discount) * 0.2;
    total += item.price - discount + tax;
  });

  // Отправка email (5 строк)
  const emailBody = `Thank you for your order! Total: ${total}`;
  sendEmail(order.user.email, emailBody);

  // Сохранение в БД (5 строк)
  database.save({
    userId: order.user.id,
    total,
    date: new Date(),
  });

  // Логирование (3 строки)
  logger.log(`Order processed for ${order.user.name}`);

  return total;
};
```

**✅ Хорошо — разбито на маленькие функции:**

```typescript
const validateOrder = (order: Order): void => {
  if (!order.items?.length) throw new Error('Order must contain items');
  if (!order.user) throw new Error('Order must have a user');
  if (!order.address) throw new Error('Order must have a shipping address');
};

const calculateItemPrice = (item: OrderItem): number => {
  const discount = item.hasDiscount ? item.price * 0.1 : 0;
  const priceAfterDiscount = item.price - discount;
  const tax = priceAfterDiscount * 0.2;
  return priceAfterDiscount + tax;
};

const calculateOrderTotal = (items: OrderItem[]): number =>
  items.reduce((total, item) => total + calculateItemPrice(item), 0);

const sendOrderConfirmation = (user: User, total: number): void => {
  const emailBody = `Thank you for your order! Total: $${total}`;
  sendEmail(user.email, emailBody);
};

const saveOrderToDatabase = (order: Order, total: number): void => {
  database.save({
    userId: order.user.id,
    total,
    date: new Date(),
  });
};

const logOrderProcessed = (user: User): void => {
  logger.log(`Order processed for ${user.name}`);
};

// Главная функция — оркестратор
const processOrder = (order: Order): number => {
  validateOrder(order);

  const total = calculateOrderTotal(order.items);

  sendOrderConfirmation(order.user, total);
  saveOrderToDatabase(order, total);
  logOrderProcessed(order.user);

  return total;
};
```

**Когда разбивать функцию:**

- Видно несколько **логических блоков** (валидация, вычисление, сохранение)
- Функция делает больше одной вещи
- Сложно понять с первого взгляда

### 2.2 Параметры функции

**Правило:**

- **0-2 параметра** — идеально
- **3 параметра** — приемлемо
- **Больше 3** — использовать объект параметров

**❌ Плохо — слишком много параметров:**

```typescript
const createUser = (
  firstName: string,
  lastName: string,
  email: string,
  age: number,
  address: string,
  phone: string,
  role: string
) => {
  // ...
};

// Использование — легко ошибиться в порядке
createUser('John', 'Doe', 'john@example.com', 30, '123 St', '+123456', 'admin');
```

**✅ Хорошо — объект параметров:**

```typescript
interface CreateUserParams {
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  address: string;
  phone: string;
  role: string;
}

const createUser = (params: CreateUserParams): User => {
  // Destructuring для удобства
  const { firstName, lastName, email, age, address, phone, role } = params;
  // ...
};

// Использование — понятно и безопасно
createUser({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  age: 30,
  address: '123 St',
  phone: '+123456',
  role: 'admin',
});
```

**Избегать boolean флагов:**

```typescript
// ❌ Плохо
const renderPage = (showHeader: boolean, showFooter: boolean, showSidebar: boolean) => {
  if (showHeader) {
    /* ... */
  }
  if (showFooter) {
    /* ... */
  }
  if (showSidebar) {
    /* ... */
  }
};

renderPage(true, false, true); // ❌ Непонятно что значат эти флаги

// ✅ Хорошо — объект с именованными полями
interface PageLayout {
  showHeader: boolean;
  showFooter: boolean;
  showSidebar: boolean;
}

const renderPage = (layout: PageLayout) => {
  if (layout.showHeader) {
    /* ... */
  }
  if (layout.showFooter) {
    /* ... */
  }
  if (layout.showSidebar) {
    /* ... */
  }
};

renderPage({
  showHeader: true,
  showFooter: false,
  showSidebar: true,
}); // ✅ Всё понятно
```

**Destructuring параметров:**

```typescript
// ✅ Хорошая практика
const createUser = ({ firstName, lastName, email }: CreateUserParams): User => ({
  id: generateId(),
  firstName,
  lastName,
  email,
  createdAt: new Date(),
});
```

### 2.3 Побочные эффекты (Side Effects)

**Определение:** Побочный эффект — это любое изменение состояния вне функции (мутация переменных, запись в БД, console.log, изменение DOM).
**Чистые функции (Pure Functions):**

- Не имеют побочных эффектов
- Всегда возвращают одинаковый результат для одинаковых входных данных
- Легко тестировать

**❌ Плохо — скрытые побочные эффекты:**

```typescript
let totalPrice = 0; // Глобальная переменная

const addItemPrice = (price: number) => {
  totalPrice += price; // ❌ Мутация глобального состояния
  console.log('Added:', price); // ❌ Побочный эффект
  return totalPrice;
};

addItemPrice(10); // totalPrice = 10
addItemPrice(20); // totalPrice = 30 — функция зависит от глобального состояния!
```

**✅ Хорошо — чистая функция:**

```typescript
const addItemPrice = (currentTotal: number, price: number): number => currentTotal + price; // ✅ Нет побочных эффектов

let totalPrice = 0;
totalPrice = addItemPrice(totalPrice, 10); // 10
totalPrice = addItemPrice(totalPrice, 20); // 30
```

**Когда побочные эффекты неизбежны:**

```typescript
// Побочные эффекты явно обозначены в названии
const saveUserToDatabase = async (user: User): Promise<void> => {
  await database.save(user); // ❌ Побочный эффект, но он явный
};

const logError = (message: string): void => {
  console.error(message); // ❌ Побочный эффект, но он явный
};

const sendEmail = (to: string, body: string): void => {
  emailService.send(to, body); // ❌ Побочный эффект, но он явный
};
```

**Как изолировать побочные эффекты:**

1. **Выносить в отдельные функции** с явным названием
2. **Разделять "вычисление" и "действие"**
3. **Делать чистые функции** для бизнес-логики

```typescript
// ✅ Разделение: чистая функция + функция с side effect
const calculateTotal = (items: Item[]): number => items.reduce((sum, item) => sum + item.price, 0);

const saveOrder = async (order: Order): Promise<void> => {
  const total = calculateTotal(order.items); // Чистая функция
  await database.save({ ...order, total }); // Побочный эффект изолирован
};
```

### 2.4 Single Responsibility для функций

**Правило:** Каждая функция должна делать одну вещь и делать её хорошо.

**❌ Плохо — функция делает несколько вещей:**

```typescript
const processUserData = (userId: string) => {
  // 1. Загрузка
  const user = database.getUser(userId);

  // 2. Валидация
  if (!user.email) throw new Error('No email');

  // 3. Вычисление
  const age = calculateAge(user.birthDate);

  // 4. Форматирование
  const formatted = `${user.firstName} ${user.lastName}, ${age} years old`;

  // 5. Сохранение
  cache.set(userId, formatted);

  // 6. Возврат
  return formatted;
};
```

**✅ Хорошо — каждая функция делает одно:**

```typescript
const getUserById = (userId: string): User => database.getUser(userId);

const validateUserEmail = (user: User): void => {
  if (!user.email) {
    throw new Error('User must have an email');
  }
};

const calculateUserAge = (birthDate: Date): number => {
  const today = new Date();
  return today.getFullYear() - birthDate.getFullYear();
};

const formatUserInfo = (user: User, age: number): string =>
  `${user.firstName} ${user.lastName}, ${age} years old`;

const cacheUserInfo = (userId: string, info: string): void => {
  cache.set(userId, info);
};

// Оркестратор
const processUserData = (userId: string): string => {
  const user = getUserById(userId);
  validateUserEmail(user);

  const age = calculateUserAge(user.birthDate);
  const formatted = formatUserInfo(user, age);

  cacheUserInfo(userId, formatted);

  return formatted;
};
```

### 2.5 Возврат значений

**Early Return Pattern**

**❌ Плохо — глубокая вложенность:**

```typescript
const getDiscount = (user: User): number => {
  if (user) {
    if (user.isPremium) {
      if (user.orders > 10) {
        return 0.2;
      } else {
        return 0.1;
      }
    } else {
      return 0.05;
    }
  } else {
    return 0;
  }
};
```

**✅ Хорошо — early return:**

```typescript
const getDiscount = (user: User | null): number => {
  if (!user) return 0;
  if (!user.isPremium) return 0.05;
  if (user.orders > 10) return 0.2;
  return 0.1;
};
```

**Guard Clauses**

```typescript
const processPayment = (amount: number, user: User): void => {
  // Guard clauses в начале
  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }

  if (!user) {
    throw new Error('User is required');
  }

  if (!user.paymentMethod) {
    throw new Error('Payment method is required');
  }

  // Основная логика
  chargeUser(user, amount);
};
```

**Один тип возврата:**

```typescript
// ❌ Плохо — разные типы возврата
const getUser = (id: string): User | null | undefined | false => {
  if (!id) return false; // ❌
  if (id === 'invalid') return undefined; // ❌
  const user = database.find(id);
  return user || null; // ❌
};

// ✅ Хорошо — один тип возврата
const getUser = (id: string): User | null => {
  if (!id) return null;
  if (id === 'invalid') return null;
  return database.find(id) || null;
};
```

### 2.6 Стрелочные функции vs обычные

**Когда использовать arrow functions:**

✅ **Коллбэки:**

```typescript
const numbers = [1, 2, 3, 4];

// ✅ Хорошо
const doubled = numbers.map((n) => n * 2);
const evens = numbers.filter((n) => n % 2 === 0);
```

✅ **Короткие функции:**

```typescript
const add = (a: number, b: number) => a + b;
const isEven = (n: number) => n % 2 === 0;
```

✅ **Методы в React:**

```typescript
const Component = () => {
  // ✅ Не нужно биндить this
  const handleClick = () => {
    console.log('Clicked');
  };

  return <button onClick={handleClick}>Click</button>;
};
```

**Когда использовать обычные функции:**

❌ **Методы объектов (если нужен `this`):**

```typescript
const user = {
  name: 'John',
  greet: function () {
    console.log(`Hello, ${this.name}`); // ✅ this работает
  },
};

const userArrow = {
  name: 'John',
  greet: () => {
    console.log(`Hello, ${this.name}`); // ❌ this не работает
  },
};
```

✅ **Конструкторы:**

```typescript
function Person(name: string) {
  this.name = name;
}

// ❌ Arrow functions не могут быть конструкторами
const PersonArrow = (name: string) => {
  this.name = name; // Ошибка!
};
```

## 3. Комментарии и документация

### 3.1 Когда НЕ нужны комментарии

**Самодокументируемый код:**

```typescript
// ❌ Плохо — комментарий описывает очевидное
// Increment counter
counter++;

// ❌ Плохо — комментарий дублирует код
// Check if user is active
if (user.isActive) {
}

// ❌ Плохо — комментарий вместо нормального имени
// Days in a week
const d = 7;

// ✅ Хорошо — код говорит сам за себя
const DAYS_IN_WEEK = 7;

if (user.isActive) {
  activateUserAccount(user);
}
```

**Закомментированный код — удалять!**

```typescript
// ❌ Плохо
const calculateTotal = (items) => {
  // const tax = 0.1;
  // const discount = 0.05;
  return items.reduce((sum, item) => sum + item.price, 0);
  // return total * (1 + tax) * (1 - discount);
};

// ✅ Хорошо — нет закомментированного кода
const calculateTotal = (items: Item[]): number => items.reduce((sum, item) => sum + item.price, 0);
```

### 3.2 Когда комментарии полезны

**1. Сложная бизнес-логика:**

```typescript
// ✅ Хорошо — объясняем "почему"
const calculateShippingCost = (order: Order): number => {
  const baseRate = 10;

  // Применяем 20% скидку для заказов свыше $100 согласно маркетинговой кампании Q4 2024
  if (order.total > 100) {
    return baseRate * 0.8;
  }

  return baseRate;
};
```

**2. Неочевидные решения:**

```typescript
// ✅ Объясняем почему выбрано именно это решение
const debounce = (fn: Function, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: unknown[]) => {
    // Очищаем предыдущий таймер вместо проверки времени
    // потому что clearTimeout эффективнее по памяти
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};
```

**3. Workarounds и хаки:**

```typescript
// ✅ Объясняем временное решение
const parseDate = (dateString: string): Date => {
  // FIXME: Safari не поддерживает ISO формат с timezone,
  // временно используем библиотеку date-fns
  // Удалить после обновления минимальной версии Safari до 16+
  return parse(dateString, 'yyyy-MM-dd', new Date());
};
```

**4. Предупреждения:**

```typescript
// ✅ Предупреждаем о важных деталях
const deleteUser = (userId: string): Promise<void> => {
  // ВАЖНО: Эта операция необратима!
  // Все связанные данные (заказы, комментарии) тоже будут удалены
  return database.delete('users', userId);
};
```

### 3.3 JSDoc

**Когда использовать:**

- Публичное API
- Библиотеки и пакеты
- Сложные функции

```typescript
/**
 * Вычисляет итоговую стоимость заказа с учётом налогов и скидок
 *
 * @param items - Массив товаров в заказе
 * @param taxRate - Ставка налога (от 0 до 1)
 * @param discount - Скидка в процентах (от 0 до 100)
 * @returns Итоговая стоимость заказа
 *
 * @example
 * const total = calculateOrderTotal(
 *   [{ price: 100 }, { price: 200 }],
 *   0.2,
 *   10
 * ); // 270
 *
 * @throws {Error} Если массив товаров пустой
 */
const calculateOrderTotal = (items: Item[], taxRate: number, discount: number): number => {
  if (items.length === 0) {
    throw new Error('Order must contain at least one item');
  }

  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const discountAmount = subtotal * (discount / 100);
  const taxAmount = (subtotal - discountAmount) * taxRate;

  return subtotal - discountAmount + taxAmount;
};
```

**Основные теги JSDoc:**

| Тег           | Описание                     |
| ------------- | ---------------------------- |
| `@param`      | Параметры функции            |
| `@returns`    | Что возвращает               |
| `@throws`     | Какие ошибки может выбросить |
| `@example`    | Пример использования         |
| `@deprecated` | Устаревший метод             |
| `@see`        | Ссылка на связанный код      |

### 3.4 TODO/FIXME

```typescript
// TODO: Добавить валидацию email адреса (Olga, 2024-11-20)
const saveUser = (user: User) => {
  database.save(user);
};

// FIXME: Memory leak при размонтировании компонента (высокий приоритет)
useEffect(() => {
  const interval = setInterval(() => {
    fetchData();
  }, 1000);

  // Нужно добавить cleanup
}, []);

// HACK: Временное решение до обновления API
const getUsers = async () => {
  // Добавляем задержку, потому что API иногда возвращает кэш
  await delay(100);
  return fetch('/api/users');
};

// NOTE: Не использовать в production, только для отладки
const DEBUG_MODE = true;
```

**Формат:**

```
// TODO: Что нужно сделать (Автор, Дата)
// FIXME: Что сломано (приоритет)
// HACK: Почему хак, когда удалить
// NOTE: Важная информация
```

### 3.5 Комментарии "почему", а не "что"

**❌ Плохо — комментарий описывает ЧТО делает код:**

```typescript
// Проверяем что пользователь активен
if (user.isActive) {
  // Отправляем email
  sendEmail(user.email);
}
```

**✅ Хорошо — комментарий объясняет ПОЧЕМУ:**

```typescript
// Отправляем email только активным пользователям,
// потому что неактивные могли отписаться от рассылки
if (user.isActive) {
  sendEmail(user.email);
}
```

**✅ Ещё лучше — код объясняет сам себя:**

```typescript
const shouldSendEmail = (user: User): boolean => {
  // Неактивные пользователи отписались от рассылки
  return user.isActive;
};

if (shouldSendEmail(user)) {
  sendEmail(user.email);
}
```

## 4. Обработка ошибок

### 4.1 Try-Catch правила

**❌ Плохо — игнорирование ошибок:**

```typescript
try {
  const data = JSON.parse(jsonString);
} catch (error) {
  // ❌ Пустой catch — ошибка проглочена
}
```

**✅ Хорошо — обработка ошибки:**

```typescript
try {
  const data = JSON.parse(jsonString);
  return data;
} catch (error) {
  console.error('Failed to parse JSON:', error);
  throw new Error('Invalid JSON format');
}
```

**Конкретные catch блоки:**

```typescript
try {
  await saveUser(user);
} catch (error) {
  if (error instanceof ValidationError) {
    showValidationErrors(error.fields);
  } else if (error instanceof NetworkError) {
    showNetworkErrorMessage();
  } else {
    showGenericErrorMessage();
    logError(error);
  }
}
```

**Finally для cleanup:**

```typescript
let connection;

try {
  connection = await database.connect();
  await connection.query('SELECT * FROM users');
} catch (error) {
  console.error('Database error:', error);
} finally {
  // ✅ Cleanup всегда выполнится
  if (connection) {
    await connection.close();
  }
}
```

**❌ Не использовать как flow control:**

```typescript
// ❌ Плохо — try-catch для контроля потока
try {
  const user = getUser(userId);
  return user;
} catch (error) {
  return null; // ❌ Ошибки не для логики
}

// ✅ Хорошо — явная проверка
const getUser = (userId: string): User | null => {
  if (!userId) return null;
  return database.find(userId) || null;
};
```

### 4.2 Fail Fast принцип

**Проверка на входе:**

```typescript
const calculateDiscount = (price: number, discountPercent: number): number => {
  // ✅ Fail Fast — проверки в начале
  if (price < 0) {
    throw new Error('Price cannot be negative');
  }

  if (discountPercent < 0 || discountPercent > 100) {
    throw new Error('Discount must be between 0 and 100');
  }

  return price * (discountPercent / 100);
};
```

**Ранний return при ошибке:**

```typescript
const processPayment = (order: Order): PaymentResult => {
  // ✅ Ранние выходы при проблемах
  if (!order.items.length) {
    return { success: false, error: 'Order is empty' };
  }

  if (!order.paymentMethod) {
    return { success: false, error: 'Payment method required' };
  }

  if (order.total <= 0) {
    return { success: false, error: 'Invalid order total' };
  }

  // Основная логика только если всё ОК
  const result = chargePayment(order);
  return result;
};
```

**Guard clauses:**

```typescript
const sendEmail = (email: string, subject: string, body: string): void => {
  // Guard clauses
  if (!email) throw new Error('Email is required');
  if (!isValidEmail(email)) throw new Error('Invalid email format');
  if (!subject) throw new Error('Subject is required');
  if (!body) throw new Error('Body is required');

  // Основная логика
  emailService.send({ email, subject, body });
};
```

### 4.3 Defensive Programming

**Проверка null/undefined:**

```typescript
// ❌ Плохо — может упасть
const getUserName = (user: User) => {
  return user.profile.firstName; // ❌ Если profile = null?
};

// ✅ Хорошо — защита от null
const getUserName = (user: User | null): string => {
  if (!user) return 'Anonymous';
  if (!user.profile) return 'No profile';
  return user.profile.firstName || 'Unknown';
};

// ✅ Ещё лучше — optional chaining
const getUserName = (user: User | null): string => user?.profile?.firstName ?? 'Anonymous';
```

**Валидация типов:**

```typescript
const calculateTotal = (items: unknown): number => {
  // ✅ Проверяем тип
  if (!Array.isArray(items)) {
    throw new Error('Items must be an array');
  }

  return items.reduce((sum: number, item: unknown) => {
    if (typeof item.price !== 'number') {
      throw new Error('Item price must be a number');
    }
    return sum + item.price;
  }, 0);
};
```

**Граничные случаи:**

```typescript
const divide = (a: number, b: number): number => {
  // ✅ Проверяем граничный случай
  if (b === 0) {
    throw new Error('Division by zero');
  }

  // ✅ Проверяем NaN
  if (isNaN(a) || isNaN(b)) {
    throw new Error('Arguments must be numbers');
  }

  return a / b;
};
```

**Optional chaining (?.) и Nullish coalescing (??):**

```typescript
// ❌ Плохо — длинная проверка
const city = user && user.address && user.address.city ? user.address.city : 'Unknown';

// ✅ Хорошо — optional chaining + nullish coalescing
const city = user?.address?.city ?? 'Unknown';

// ✅ С default значением
const age = user?.age ?? 18;

// ✅ С вызовом метода
const userName = user?.getName?.() ?? 'Guest';
```
