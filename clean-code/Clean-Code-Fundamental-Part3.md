# Продвинутые практики чистого кода

## 1. Работа с данными

### 1.1 Избегать глобальных переменных

**❌ Плохо:**

```typescript
let userName = 'John'; // Глобальная переменная

const greet = () => {
  console.log(`Hello, ${userName}`);
};

// Проблема: userName может быть изменён откуда угодно
```

**✅ Хорошо:**

```typescript
const greet = (userName: string) => {
  console.log(`Hello, ${userName}`);
};

// Или используем модуль
const config = {
  userName: 'John',
};

export const greet = () => {
  console.log(`Hello, ${config.userName}`);
};
```

### 1.2 Использовать const по умолчанию

```typescript
// ✅ const по умолчанию
const MAX_USERS = 100;
const userName = 'John';

// let только если нужно переприсвоение
let count = 0;
count++;

// не используем var
```

### 1.3 Избегать мутации параметров

**❌ Плохо:**

```typescript
const updateUser = (user: User) => {
  user.age = 30; // ❌ Мутация параметра
  user.updatedAt = new Date();
};
```

**✅ Хорошо:**

```typescript
const updateUser = (user: User): User => ({
  ...user,
  age: 30,
  updatedAt: new Date(),
});
```

### 1.4 Immutability (Неизменяемость)

**Почему важна:**

- Предсказуемость
- Упрощает отладку
- React оптимизация (shallow comparison)
- Избегает мутаций

**❌ Плохо — мутация:**

```typescript
const user = { name: 'John', age: 30 };
user.age = 31; // ❌ Мутация

const numbers = [1, 2, 3];
numbers.push(4); // ❌ Мутация

const users = [{ id: 1, name: 'John' }];
users[0].name = 'Jane'; // ❌ Мутация
```

**✅ Хорошо — иммутабельность:**

```typescript
// Объекты — spread operator
const user = { name: 'John', age: 30 };
const updatedUser = { ...user, age: 31 }; // ✅ Новый объект

// Массивы — методы без мутации
const numbers = [1, 2, 3];
const newNumbers = [...numbers, 4]; // ✅ Новый массив
const filtered = numbers.filter((n) => n > 1); // ✅ Новый массив

// Вложенные объекты
const users = [{ id: 1, name: 'John' }];
const updatedUsers = users.map((u) => (u.id === 1 ? { ...u, name: 'Jane' } : u)); // ✅ Новый массив с новым объектом
```

**Методы массивов (иммутабельные):**

| Метод                   | Описание                |
| ----------------------- | ----------------------- |
| `map()`                 | Трансформация элементов |
| `filter()`              | Фильтрация элементов    |
| `reduce()`              | Агрегация               |
| `slice()`               | Копия части массива     |
| `concat()`              | Объединение массивов    |
| `find()`, `findIndex()` | Поиск                   |
| `some()`, `every()`     | Проверки                |

**❌ Мутирующие методы (избегать):**

| Метод       | Альтернатива         |
| ----------- | -------------------- |
| `push()`    | `[...arr, item]`     |
| `pop()`     | `arr.slice(0, -1)`   |
| `shift()`   | `arr.slice(1)`       |
| `unshift()` | `[item, ...arr]`     |
| `splice()`  | `slice() + concat()` |
| `sort()`    | `[...arr].sort()`    |
| `reverse()` | `[...arr].reverse()` |

### 1.5 Работа с массивами

**Декларативные методы вместо циклов, когда это повышает читаемость:**

`map`, `filter`, `reduce`, `some`, `every`, `find` часто делают намерение кода понятнее. Но это не запрет на циклы: простой `for...of` иногда читается лучше, особенно если нужен early exit, несколько накопителей или сложная пошаговая логика.

**❌ Плохо — императивный стиль:**

```typescript
const numbers = [1, 2, 3, 4, 5];

// Фильтрация
const evens = [];
for (let i = 0; i < numbers.length; i++) {
  if (numbers[i] % 2 === 0) {
    evens.push(numbers[i]);
  }
}

// Трансформация
const doubled = [];
for (let i = 0; i < numbers.length; i++) {
  doubled.push(numbers[i] * 2);
}

// Сумма
let sum = 0;
for (let i = 0; i < numbers.length; i++) {
  sum += numbers[i];
}
```

**✅ Хорошо — декларативный стиль:**

```typescript
const numbers = [1, 2, 3, 4, 5];

// Фильтрация
const evens = numbers.filter((n) => n % 2 === 0);

// Трансформация
const doubled = numbers.map((n) => n * 2);

// Сумма
const sum = numbers.reduce((acc, n) => acc + n, 0);

// Если reduce становится сложным — лучше обычный цикл
let total = 0;
for (const number of numbers) {
  total += number;
}
```

**Читаемость цепочек:**

**❌ Плохо — слишком длинная цепочка:**

```typescript
const result = users
  .filter((u) => u.isActive)
  .map((u) => ({ ...u, fullName: `${u.firstName} ${u.lastName}` }))
  .filter((u) => u.age > 18)
  .sort((a, b) => a.age - b.age)
  .slice(0, 10)
  .map((u) => u.email);
```

**✅ Хорошо — разбито на этапы:**

```typescript
const activeUsers = users.filter((u) => u.isActive);

const usersWithFullName = activeUsers.map((u) => ({
  ...u,
  fullName: `${u.firstName} ${u.lastName}`,
}));

const adults = usersWithFullName.filter((u) => u.age > 18);

const sortedByAge = [...adults].sort((a, b) => a.age - b.age);

const topTen = sortedByAge.slice(0, 10);

const emails = topTen.map((u) => u.email);
```

**Или с промежуточными переменными:**

```typescript
const formatUser = (user: User) => ({
  ...user,
  fullName: `${user.firstName} ${user.lastName}`,
});

const sortByAge = (a: User, b: User) => a.age - b.age;

const result = users
  .filter((u) => u.isActive && u.age > 18)
  .map(formatUser)
  .toSorted(sortByAge)
  .slice(0, 10)
  .map((u) => u.email);
```

**Полезные паттерны:**

```typescript
// Проверка наличия элемента
const hasAdmin = users.some((u) => u.role === 'admin');

// Проверка всех элементов
const allActive = users.every((u) => u.isActive);

// Поиск элемента
const admin = users.find((u) => u.role === 'admin');

// Индекс элемента
const index = users.findIndex((u) => u.id === userId);

// Удаление дубликатов
const uniqueIds = [...new Set(users.map((u) => u.id))];
```

### 1.6 Работа с объектами

**Destructuring:**

```typescript
// ❌ Плохо — повторение
const displayUser = (user: User) => {
  console.log(user.firstName);
  console.log(user.lastName);
  console.log(user.email);
  console.log(user.age);
};

// ✅ Хорошо — destructuring
const displayUser = ({ firstName, lastName, email, age }: User) => {
  console.log(firstName);
  console.log(lastName);
  console.log(email);
  console.log(age);
};

// Или внутри функции
const displayUser = (user: User) => {
  const { firstName, lastName, email, age } = user;
  console.log(firstName, lastName, email, age);
};
```

**Default values:**

```typescript
const greet = ({ name = 'Guest', greeting = 'Hello' } = {}) => {
  console.log(`${greeting}, ${name}!`);
};

greet(); // Hello, Guest!
greet({ name: 'John' }); // Hello, John!
```

**Переименование при destructuring:**

```typescript
const user = { name: 'John', age: 30 };
const { name: userName, age: userAge } = user;

console.log(userName); // John
console.log(userAge); // 30
```

**Spread для копирования:**

```typescript
// Поверхностное копирование
const user = { name: 'John', age: 30 };
const userCopy = { ...user };

// Объединение объектов
const defaults = { theme: 'light', language: 'en' };
const userSettings = { theme: 'dark' };
const settings = { ...defaults, ...userSettings }; // { theme: 'dark', language: 'en' }

// Обновление свойства
const updatedUser = { ...user, age: 31 };

// Добавление свойства
const userWithId = { ...user, id: '123' };

// Удаление свойства
const { age, ...userWithoutAge } = user;
```

**Object methods:**

```typescript
// Object.keys
const user = { name: 'John', age: 30 };
Object.keys(user); // ['name', 'age']

// Object.values
Object.values(user); // ['John', 30]

// Object.entries
Object.entries(user); // [['name', 'John'], ['age', 30]]

// Object.fromEntries
const entries: [string, unknown][] = [
  ['name', 'John'],
  ['age', 30],
];
Object.fromEntries(entries); // { name: 'John', age: 30 }

// Object.assign (лучше использовать spread)
const merged = Object.assign({}, defaults, userSettings);
```

**Глубокое копирование:**

```typescript
// ❌ Shallow copy не работает для вложенных объектов
const user = { name: 'John', address: { city: 'NY' } };
const copy = { ...user };
copy.address.city = 'LA';
console.log(user.address.city); // 'LA' — оригинал изменился! ❌

// ✅ Глубокое копирование
const deepCopy = JSON.parse(JSON.stringify(user)); // Работает для простых случаев
deepCopy.address.city = 'LA';
console.log(user.address.city); // 'NY' ✅

// ✅ Или structuredClone (новый API)
const deepCopy2 = structuredClone(user);

// ✅ Или вручную для конкретного случая
const deepCopy3 = {
  ...user,
  address: { ...user.address },
};
```

### 1.7 Null и Undefined

**Различия:**

```typescript
let a; // undefined — переменная объявлена, но не инициализирована
let b = null; // null — явное отсутствие значения

console.log(a === undefined); // true
console.log(b === null); // true
console.log(a == b); // true (loose equality)
console.log(a === b); // false (strict equality)
```

**Когда использовать что:**
| Использовать | Когда |
|--------------|-------|
| `undefined` | Значение не было установлено |
| `null` | Явное указание "нет значения" |

```typescript
// ✅ Хорошая практика
interface User {
  name: string;
  email: string;
  avatar: string | null; // null = пользователь не загрузил аватар
  phone?: string; // undefined = опциональное поле
}

const findUser = (id: string): User | null => {
  const user = database.find(id);
  return user || null; // null = пользователь не найден
};
```

**Проверки:**

```typescript
// Nullish coalescing (??)
const value1 = null ?? 'default'; // 'default'
const value2 = undefined ?? 'default'; // 'default'
const value3 = 0 ?? 'default'; // 0 (не заменяется!)
const value4 = '' ?? 'default'; // '' (не заменяется!)

// Optional chaining (?.)
const city = user?.address?.city;

// Nullish coalescing assignment (??=)
let count: number | undefined;
count ??= 0; // Присвоить 0, только если undefined или null
```

**Избегать null где возможно:**

```typescript
// ❌ Плохо — может вернуть null
const getUsers = (): User[] | null => {
  return database.isEmpty() ? null : database.getAll();
};

// ✅ Хорошо — возвращать пустой массив
const getUsers = (): User[] => {
  return database.isEmpty() ? [] : database.getAll();
};
```

## 2. Асинхронный код

### 2.1 Promises

**Цепочки then:**

```typescript
// ✅ Правильное использование
fetchUser(userId)
  .then((user) => validateUser(user))
  .then((validatedUser) => saveUser(validatedUser))
  .then(() => console.log('User saved'))
  .catch((error) => console.error('Error:', error))
  .finally(() => console.log('Done'));
```

**Обработка ошибок:**

```typescript
// ❌ Плохо — ошибки не обрабатываются
fetchUser(userId).then((user) => saveUser(user));

// ✅ Хорошо — ошибка обработана явно
fetchUser(userId)
  .then((user) => saveUser(user))
  .catch((error) => {
    console.error('Failed to save user:', error);
    showErrorNotification(error.message);
  });
```

**Promise.all, Promise.race:**

`Promise.all` используйте только для независимых операций. Если второй запрос зависит от результата первого — выполняйте их последовательно. Если нужно получить все результаты, даже при частичных ошибках, используйте `Promise.allSettled`.

```typescript
// Параллельное выполнение независимых запросов
const [users, posts, comments] = await Promise.all([fetchUsers(), fetchPosts(), fetchComments()]);

// Гонка — первый выполненный
const result = await Promise.race([fetchFromCache(), fetchFromAPI()]);

// Promise.allSettled — результаты всех (даже если ошибки)
const results = await Promise.allSettled([fetchUsers(), fetchPosts(), fetchComments()]);

results.forEach((result) => {
  if (result.status === 'fulfilled') {
    console.log('Success:', result.value);
  } else {
    console.error('Error:', result.reason);
  }
});
```

### 2.2 Async/Await

**Читаемость:**

```typescript
// ❌ Promise chains могут быть сложными
const processUser = (userId: string) => {
  return fetchUser(userId)
    .then((user) => validateUser(user))
    .then((validatedUser) => {
      return fetchUserOrders(validatedUser.id).then((orders) => ({ user: validatedUser, orders }));
    })
    .then((data) => saveUserData(data))
    .catch((error) => handleError(error));
};

// ✅ Async/await проще читать
const processUser = async (userId: string) => {
  try {
    const user = await fetchUser(userId);
    const validatedUser = await validateUser(user);
    const orders = await fetchUserOrders(validatedUser.id);
    const data = { user: validatedUser, orders };
    await saveUserData(data);
  } catch (error) {
    handleError(error);
  }
};
```

**Try-catch для ошибок:**

```typescript
const loadUserData = async (userId: string) => {
  try {
    const user = await fetchUser(userId);
    return user;
  } catch (error) {
    if (error instanceof NetworkError) {
      console.error('Network error:', error);
      return null;
    }
    throw error; // Пробрасываем дальше
  }
};
```

**Параллельное выполнение:**

```typescript
// ❌ Плохо — последовательное выполнение (медленно)
const loadData = async () => {
  const users = await fetchUsers(); // Ждём 1 сек
  const posts = await fetchPosts(); // Ждём 1 сек
  const comments = await fetchComments(); // Ждём 1 сек
  // Всего: 3 секунды
};

// ✅ Хорошо — параллельное выполнение (быстро)
const loadData = async () => {
  // ✅ Запросы независимы друг от друга, поэтому их можно запускать параллельно
  const [users, posts, comments] = await Promise.all([fetchUsers(), fetchPosts(), fetchComments()]);
  // Всего: 1 секунда (если все запросы одинаковые)
};
```

**Top-level await:**

```typescript
// В модулях ES (с type: "module")
const config = await fetchConfig();
const users = await fetchUsers();

export { config, users };
```

Top-level await зависит от target/bundler и может задерживать выполнение модулей, которые импортируют этот файл. Во frontend-приложениях часто лучше загружать данные через router loaders, React Query/SWR, server components или внутри эффекта — в зависимости от архитектуры.

### 2.3 Анти-паттерны

**Callback hell:**

```typescript
// ❌ Плохо — callback hell
fetchUser(userId, (user) => {
  validateUser(user, (validatedUser) => {
    fetchOrders(validatedUser.id, (orders) => {
      saveData({ user: validatedUser, orders }, (result) => {
        console.log('Done');
      });
    });
  });
});

// ✅ Хорошо — async/await
const processUser = async (userId: string) => {
  const user = await fetchUser(userId);
  const validatedUser = await validateUser(user);
  const orders = await fetchOrders(validatedUser.id);
  await saveData({ user: validatedUser, orders });
  console.log('Done');
};
```

**Забытый await:**

```typescript
// ❌ Плохо — забыли await
const saveUser = async (user: User) => {
  database.save(user); // ❌ Promise не ждём
  console.log('Saved'); // Выполнится ДО сохранения!
};

// ✅ Хорошо
const saveUser = async (user: User) => {
  await database.save(user);
  console.log('Saved'); // Выполнится ПОСЛЕ сохранения
};
```

**Необработанные промисы:**

```typescript
// ❌ Плохо
const loadData = async () => {
  fetchUsers(); // ❌ Promise не обработан
};
// ✅ Хорошо
const loadData = async () => {
  await fetchUsers();
  // Или явно игнорируем
  void fetchUsers(); // Если действительно не нужен результат
};
```

**Смешивание then и async/await:**

```typescript
// ❌ Плохо — смешанный стиль
const loadData = async () => {
  const user = await fetchUser(userId);

  return fetchOrders(user.id).then((orders) => ({ user, orders })); // ❌ Смешали стили
};

// ✅ Хорошо — единый стиль
const loadData = async () => {
  const user = await fetchUser(userId);
  const orders = await fetchOrders(user.id);
  return { user, orders };
};
```
