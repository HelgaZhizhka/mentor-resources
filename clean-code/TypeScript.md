# TypeScript Best Practices

## 1. Основы типизации

### 1.1 Запрет `any`

**Почему `any` – это плохо?**

- Он отключает проверку типов, и **код становится незащищённым**
- TypeScript перестаёт помогать отлавливать ошибки
- Ошибки начинают проявляться только в runtime
- `any` заражает соседний код: если значение стало `any`, TypeScript перестаёт проверять цепочку вызовов дальше
- Теряется смысл использования TypeScript

**❌ Плохо:**

```typescript
const processData = (data: any) => {
  return data.map((item) => item.value); // ❌ Ошибки не поймаем
};

const users: any = fetchUsers();
const items: Array<any> = getItems();
const result: Promise<any> = loadData();
```

**✅ Хорошо:**

```typescript
interface Item {
  value: string;
}

const processData = (data: Item[]) => {
  return data.map((item) => item.value);
};

const users: User[] = fetchUsers();
const items: Item[] = getItems();
const result: Promise<Data> = loadData();
```

### 1.1.1 Опасность неявного `any`

`any` опасен не только когда его явно написали. Иногда он появляется **неявно**, если TypeScript не может вывести тип и строгие настройки выключены.

**❌ Плохо — параметр становится `any`, если выключен `noImplicitAny`:**

```typescript
const getUserName = (user) => {
  return user.profile.name.toUpperCase();
};
```

В таком коде TypeScript не знает структуру `user`, но при выключенном `noImplicitAny` разрешит любые обращения:

```typescript
getUserName(null); // Runtime error
getUserName({}); // Runtime error
getUserName({ profile: null }); // Runtime error
```

**✅ Хорошо — тип параметра описан явно:**

```typescript
type User = {
  profile: {
    name: string;
  };
};

const getUserName = (user: User): string => {
  return user.profile.name.toUpperCase();
};
```

**✅ Ещё лучше для данных извне — принять `unknown` и проверить структуру:**

```typescript
const isUser = (value: unknown): value is User => {
  if (typeof value !== 'object' || value === null) return false;

  const user = value as { profile?: { name?: unknown } };

  return typeof user.profile?.name === 'string';
};

const getUserName = (value: unknown): string => {
  if (!isUser(value)) {
    throw new Error('Invalid user');
  }

  return value.profile.name.toUpperCase();
};
```

**Правило:** включайте `noImplicitAny` и не оставляйте параметры, результаты API, callbacks и данные из библиотек без типа.

**Настройка запрета `any`:**

**В `tsconfig.json`:**

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

**В `.eslintrc.js`:**

```javascript
module.exports = {
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
  },
};
```

### 1.2 Использование `unknown` вместо `any`

**Правило:**

- **Используем `unknown` вместо `any`**, если не знаем, какой будет тип
- **Сначала проверяем `unknown` через type guard или валидацию**
- `as` используем только точечно, когда TypeScript не может вывести тип после проверки

**❌ Плохо — `any` отключает проверки TypeScript:**

```typescript
const processData = (data: any) => {
  return data.map((item) => item.value); // ❌ Ошибки не поймаем
};
```

**✅ Хорошо — `unknown` требует явного приведения типа:**

```typescript
const processData = (data: unknown) => {
  if (!Array.isArray(data)) throw new Error('Invalid data');
  return data.map((item) => (item as { value: string }).value);
};
```

**Пример обработки ошибок в `catch` с `unknown`:**

```typescript
try {
  throw new Error('Something went wrong');
} catch (error: unknown) {
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error('Unexpected error', error);
  }
}
```

**Или с функцией-помощником:**

```typescript
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Unknown error occurred';
};

try {
  throw 'Something went wrong';
} catch (error: unknown) {
  console.error(getErrorMessage(error));
}
```

### 1.3 Запрет `{}` и `object`

**Проблема:**

- `{}` и `object` слишком общие → **не дают нормальной типизации**
- Лучше использовать **`Record<string, string>`** или **`unknown`**

**❌ Плохо — `object` ничего не гарантирует:**

```typescript
const processUser = (user: object) => {
  console.log(user.name); // ❌ Ошибка! TS не знает, что есть `name`: Свойство "name" не существует в типе "object"
};
```

**✅ Хорошо — `Record<string, string>` или `unknown` + приведение типа:**

```typescript
const processUser = (user: Record<string, string>) => {
  console.log(user.name); // ✅ Теперь `name` точно строка
};

// Или с интерфейсом
interface User {
  name: string;
  age: number;
}

const processUser = (user: User) => {
  console.log(user.name); // ✅ Типизация работает
};
```

### 1.4 Явные типы возврата функций

**Почему это важно:**

- Предотвращает непреднамеренные типы возврата (TypeScript может выводить неправильные типы)
- Делает функциональные подписи более ясными для товарищей по команде
- Помогает TypeScript ловить ошибки на раннем этапе (особенно в асинхронных функциях)

**❌ Плохо — TypeScript выводит тип, но не всегда корректен:**

```typescript
const getUser = (id: string) => {
  return fetch(`/users/${id}`).then((res) => res.json());
};
```

**✅ Хорошо — явный тип возврата обеспечивает безопасность типа:**

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

const getUser = (id: string): Promise<User> => {
  return fetch(`/users/${id}`).then((res) => res.json());
};
```

**Примеры:**

```typescript
// ✅ Простая функция
const add = (a: number, b: number): number => a + b;

// ✅ Функция с объектом
const formatUser = (user: User): string => `${user.name} (${user.email})`;

// ✅ Async функция
// В реальном проекте данные из API нужно валидировать перед возвратом как Data
// isData — type guard для проверки структуры ответа
const fetchData = async (url: string): Promise<Data> => {
  const response = await fetch(url);
  const data: unknown = await response.json();

  if (!isData(data)) {
    throw new Error('Invalid API response');
  }

  return data;
};

// ✅ Функция без возврата
const logMessage = (message: string): void => {
  console.log(message);
};
```

**Теперь функции всегда возвращают ожидаемый тип — никаких сюрпризов!**

## 2. `type` vs `interface`

### 2.1 Когда использовать `type`

**Рекомендация:**

- Если **не нужно расширять типы**, **используем `type`**
- Более гибкий, можно использовать union types, intersection types

**✅ Используем `type`, если не надо расширять:**

```typescript
type ButtonProps = {
  label: string;
  onClick: () => void;
};

type Status = 'pending' | 'success' | 'error';

type ID = string | number;

type Point = {
  x: number;
  y: number;
};
```

**Union и Intersection types:**

```typescript
// Union types
type Result = Success | Error;

type Success = {
  status: 'success';
  data: string;
};

type Error = {
  status: 'error';
  message: string;
};

// Intersection types
type Named = {
  name: string;
};

type Aged = {
  age: number;
};

type Person = Named & Aged;
```

### 2.2 Когда использовать `interface`

**Рекомендация:**

- Если **нужно расширять (`extends`)** – лучше **`interface`**
- В **команде** → **смотрим, что уже используется, и следуем стандарту**

**✅ Используем `interface`, если нужно `extends`:**

```typescript
interface BaseProps {
  id: string;
}

interface ButtonProps extends BaseProps {
  label: string;
  onClick: () => void;
}

interface User extends BaseProps {
  name: string;
  email: string;
}
```

**Расширение нескольких интерфейсов:**

```typescript
interface Named {
  name: string;
}

interface Aged {
  age: number;
}

interface Person extends Named, Aged {
  email: string;
}
```

**Declaration Merging:**

```typescript
// Интерфейсы могут объединяться
interface Window {
  customProperty: string;
}

interface Window {
  anotherProperty: number;
}
// Теперь Window имеет оба свойства
```

## 3. Enum vs const объекты

### 3.1 Почему в frontend чаще избегают `enum`

**Проблемы обычного `enum` во frontend-коде:**

- Генерирует runtime-код в JavaScript
- Этот код попадает в итоговый bundle
- Numeric enum создаёт reverse mapping, из-за чего `Object.keys` может вернуть неожиданные значения
- Работает не как чистый type-level механизм TypeScript
- Обычно занимает больше места, чем `as const` + union type

**❌ Нежелательно во frontend — обычный `enum` генерирует лишний JS-код:**

```typescript
enum Role {
  Admin = 'admin',
  User = 'user',
}

// Генерирует в JS:
var Role;
(function (Role) {
  Role['Admin'] = 'admin';
  Role['User'] = 'user';
})(Role || (Role = {}));
```

**Когда `enum` может быть допустим:**

В новых frontend-проектах лучше по умолчанию выбирать `as const` или union literals. Но есть случаи, когда `enum` уже задан контекстом проекта:

**1. `const enum` может быть удалён из JS при совместимой сборке:**

```typescript
const enum Status {
  Pending = 0,
  Success = 1,
  Error = 2,
}

const status = Status.Success; // В JS будет: const status = 1

// ✅ При обычной компиляции TypeScript без preserveConstEnums лишний runtime-код не попадёт в бандл.
```

**2. Numeric enum с reverse mapping:**

```typescript
enum HttpStatus {
  OK = 200,
  NotFound = 404,
  InternalError = 500,
}

// Можно получить имя по значению
console.log(HttpStatus[200]); // "OK"
console.log(HttpStatus.OK); // 200
```

**3. Когда требуется совместимость с внешними библиотеками, legacy-кодом или shared contracts:**
Если библиотека, backend contract или существующий shared-пакет уже использует `enum`, иногда проще и безопаснее использовать тот же тип.

**Рекомендация:** В frontend-коде по умолчанию используйте `as const` вместо обычного `enum`, чтобы не добавлять runtime-код в bundle. `const enum` используйте осторожно: он зависит от настроек сборки (`preserveConstEnums`, Babel/SWC, `isolatedModules`) и не всегда подходит для библиотек.

### 3.2 Использование `as const`

**✅ Хорошо — `as const` делает объект `readonly`, оптимальный вариант!**

```typescript
const Role = {
  Admin: 'admin',
  User: 'user',
} as const;

type RoleType = (typeof Role)[keyof typeof Role]; // "admin" | "user"
```

**Теперь `RoleType` будет `"admin" | "user"`, и не будет лишнего кода в JS!**

**Примеры использования:**

```typescript
const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  CONTACT: '/contact',
} as const;

type Route = (typeof ROUTES)[keyof typeof ROUTES];

// Использование
const navigateTo = (route: Route) => {
  console.log(`Navigating to ${route}`);
};

navigateTo(ROUTES.HOME); // ✅
navigateTo('/profile'); // ❌ Type error
```

**Для статусов:**

```typescript
const STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;

type Status = (typeof STATUS)[keyof typeof STATUS];

const handleStatus = (status: Status) => {
  if (status === STATUS.SUCCESS) {
    console.log('Success!');
  }
};
```

## 4. Type Guards и Type Assertions

### 4.1 Type Assertion (`as`)

**Проблема:**
Оператор **type assertion (`as`)** просто **заставляет TypeScript "поверить", что тип корректный**, но **он не делает реальной проверки в runtime**.

Это важно: `as` не преобразует данные, не валидирует объект и не защищает приложение от падения. Он только говорит компилятору: "поверь мне, я знаю лучше".

**Почему это опасно:**

- Можно скрыть реальную ошибку типов
- Можно получить runtime error там, где TypeScript показывает "всё зелёное"
- Можно случайно протащить неверные данные из API в доменную модель
- Можно превратить `unknown` или `any` в любой тип без проверки
- Можно создать ложное чувство безопасности: код выглядит типизированным, но фактически не проверен

**❌ Плохо — может привести к ошибке:**

```typescript
const input = document.getElementById('myInput') as HTMLInputElement;
console.log(input.value); // ❌ В runtime здесь будет ошибка, если input = null!
```

**Проблема:** Если элемент не найден, `input` будет `null`, но TypeScript об этом не знает!

**❌ Плохо — assertion не валидирует данные из API:**

```typescript
type User = {
  id: string;
  name: string;
};

const loadUser = async (): Promise<User> => {
  const response = await fetch('/api/user');
  const data = await response.json();

  return data as User;
};
```

Этот код выглядит безопасно, но если API вернёт `{ id: 1, fullName: 'Alex' }`, TypeScript не предупредит. Ошибка появится позже, когда код начнёт обращаться к `user.name` как к строке.

**❌ Плохо — double assertion почти всегда признак проблемы:**

```typescript
const user = data as unknown as User;
```

Такой код полностью обходит систему типов. Если приходится писать `as unknown as`, почти всегда лучше остановиться и добавить нормальную проверку данных.

**✅ Хорошо — проверить тип перед использованием:**

```typescript
type User = {
  id: string;
  name: string;
};

const isUser = (value: unknown): value is User => {
  if (typeof value !== 'object' || value === null) return false;

  const user = value as { id?: unknown; name?: unknown };

  return typeof user.id === 'string' && typeof user.name === 'string';
};

const loadUser = async (): Promise<User> => {
  const response = await fetch('/api/user');
  const data: unknown = await response.json();

  if (!isUser(data)) {
    throw new Error('Invalid user response');
  }

  return data;
};
```

**Когда `as` допустим:**

- После runtime-проверки, когда TypeScript не может вывести тип достаточно точно
- Для DOM API, если есть проверка `instanceof` или null-check
- Для `as const`, чтобы зафиксировать literal types и readonly-значения
- В редких местах на границе с плохо типизированной библиотекой, желательно с комментарием почему

**Правило:** используйте `as` как последнее средство. Если данные приходят извне — API, `localStorage`, `JSON.parse`, query params — сначала проверяйте их через type guard, schema validation или явную валидацию.

### 4.2 Type Guards (`typeof`, `instanceof`, `is`)

**Альтернатива – Type Guards делают реальную проверку в рантайме!**

**1. `typeof` – для примитивных типов (`string`, `number`, `boolean`)**

```typescript
const isNumber = (value: unknown): value is number => typeof value === 'number';

const input: unknown = getSomeValue();

if (isNumber(input)) {
  console.log(input.toFixed(2)); // ✅ Теперь TypeScript знает, что это число!
}
```

**Теперь TypeScript проверит тип перед выполнением кода!**

**2. `instanceof` – для классов (`HTMLElement`, `Error`, `Date`)**

```typescript
const input = document.getElementById('myInput');

if (input instanceof HTMLInputElement) {
  console.log(input.value); // ✅ Теперь TypeScript знает, что `input` – это `HTMLInputElement`
} else {
  console.error('Элемент не найден или не является `input`');
}
```

**Теперь `input.value` не вызовет ошибку, если элемент отсутствует!**

**3. Type Guard через функцию `is` (для объектов)**

Допустим, у нас есть **интерфейс `User`**, и нам нужно проверить, что объект соответствует ему.

```typescript
interface User {
  name: string;
  age: number;
}

const isUser = (obj: unknown): obj is User => {
  if (typeof obj !== 'object' || obj === null) return false;

  const user = obj as Record<string, unknown>;

  return typeof user.name === 'string' && typeof user.age === 'number';
};

const data: unknown = { name: 'Alice', age: 25 };

if (isUser(data)) {
  console.log(`Привет, ${data.name}, тебе ${data.age} лет!`);
} else {
  console.error('Некорректный пользователь!');
}
```

**Теперь TypeScript знает, что `data` – это `User`, и мы можем безопасно работать с ним.**

**Ещё примеры Type Guards:**

```typescript
// Для массивов
const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

// Для null/undefined
const isDefined = <T>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined;

// Использование
const users: (User | null)[] = getUsers();
const validUsers = users.filter(isDefined); // Type: User[]
```

**Важно помнить:**

- Type assertion (`as`) просто "заставляет поверить" TS, но не проверяет тип реально
- Type guard (как `typeof`, `instanceof`, свои is-функции) реально валидируют тип во время выполнения и защищают от падения приложения

**Рекомендации:**

- [ts-reset](https://github.com/total-typescript/ts-reset) — исправляет встроенные типы TS (`JSON.parse`, `fetch` → `unknown` вместо `any`)

### 4.3 Современные практики TypeScript

#### `satisfies`

`as const` фиксирует значения, но иногда нужно ещё проверить, что объект соответствует ожидаемой форме. Для этого используйте `satisfies`.

**❌ Плохо — `as` может скрыть ошибку:**

```typescript
type Route = {
  path: string;
  title: string;
};

const routes = {
  home: { path: '/', title: 'Home' },
  profile: { path: '/profile', label: 'Profile' }, // ❌ title отсутствует
} as Record<string, Route>;
```

**✅ Хорошо — `satisfies` проверяет форму, но сохраняет точные типы:**

```typescript
type Route = {
  path: string;
  title: string;
};

const routes = {
  home: { path: '/', title: 'Home' },
  profile: { path: '/profile', title: 'Profile' },
} satisfies Record<string, Route>;
```

**Когда использовать:**

- конфиги;
- словари роутов;
- maps статусов;
- объекты с дизайн-токенами;
- данные, где важно проверить форму, но сохранить literal types.

#### Discriminated unions

Discriminated union помогает описывать состояния явно и безопасно. Это особенно полезно для UI-состояний: loading, error, success.

**❌ Плохо — много nullable-полей и неясные комбинации:**

```typescript
type State = {
  isLoading: boolean;
  data?: User[];
  error?: string;
};
```

Такой тип разрешает странные состояния: `isLoading: true`, но при этом уже есть `data` и `error`.

**✅ Хорошо — каждое состояние описано отдельно:**

```typescript
type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: User[] }
  | { status: 'error'; message: string };

const renderUsers = (state: State): React.ReactNode => {
  switch (state.status) {
    case 'idle':
      return null;
    case 'loading':
      return <Spinner />;
    case 'success':
      return <UserList users={state.data} />;
    case 'error':
      return <ErrorMessage message={state.message} />;
  }
};
```

#### Exhaustiveness checking через `never`

Если вариантов union станет больше, TypeScript должен подсказать, что обработка неполная.

```typescript
const assertNever = (value: never): never => {
  throw new Error(`Unexpected value: ${String(value)}`);
};

const getStatusLabel = (state: State): string => {
  switch (state.status) {
    case 'idle':
      return 'Idle';
    case 'loading':
      return 'Loading';
    case 'success':
      return 'Success';
    case 'error':
      return 'Error';
    default:
      return assertNever(state);
  }
};
```

Если добавить новый статус, например `{ status: 'empty' }`, TypeScript покажет ошибку в `assertNever(state)`.

#### Осторожно с non-null assertion (`!`)

Оператор `!` говорит TypeScript: "значение точно не `null` и не `undefined`". Но runtime-проверки он не делает.

**❌ Плохо:**

```typescript
const input = document.querySelector('input')!;
input.value = 'Hello';
```

Если `input` не найден, приложение упадёт.

**✅ Хорошо:**

```typescript
const input = document.querySelector('input');

if (!(input instanceof HTMLInputElement)) {
  throw new Error('Input not found');
}

input.value = 'Hello';
```

**Правило:** избегайте `!` в прикладном коде. Лучше сделать явную проверку или изменить тип данных так, чтобы `null` был обработан.

#### `noUncheckedIndexedAccess`

При обращении по индексу элемент может отсутствовать. Настройка `noUncheckedIndexedAccess` заставляет TypeScript учитывать это.

**❌ Плохо — без строгой настройки можно забыть про `undefined`:**

```typescript
const users: User[] = [];
const firstUser = users[0];

console.log(firstUser.name); // Runtime error, если массива пустой
```

**✅ Хорошо — проверяем наличие элемента:**

```typescript
const users: User[] = [];
const firstUser = users[0];

if (!firstUser) {
  return null;
}

console.log(firstUser.name);
```

То же касается `Record` и динамических ключей:

```typescript
const usersById: Record<string, User> = {};
const user = usersById[userId];

if (!user) {
  throw new Error('User not found');
}
```

#### `readonly` и `ReadonlyArray`

`readonly` помогает защитить данные от случайной мутации.

**❌ Плохо — функция может изменить входные данные:**

```typescript
const sortUsers = (users: User[]): User[] => {
  return users.sort((a, b) => a.name.localeCompare(b.name));
};
```

**✅ Хорошо — входной массив нельзя мутировать:**

```typescript
const sortUsers = (users: ReadonlyArray<User>): User[] => {
  return [...users].sort((a, b) => a.name.localeCompare(b.name));
};
```

Для объектов:

```typescript
type Config = Readonly<{
  apiUrl: string;
  timeout: number;
}>;
```

#### Utility types: `Pick`, `Omit`, `Partial`, `Required`

Utility types полезны, если не злоупотреблять ими.

```typescript
type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
};

type PublicUser = Omit<User, 'passwordHash'>;
type UserPreview = Pick<User, 'id' | 'name'>;
type UpdateUserPayload = Partial<Pick<User, 'name' | 'email'>>;
type CompleteUserForm = Required<UpdateUserPayload>;
```

**Правило:** utility types должны упрощать код, а не превращать типы в головоломку. Если тип становится трудно читать — лучше описать его явно.

## 5. Константы и Magic Values

### 5.1 Вынос числовых значений

**Правило:** Числа в коде – это магия! Делаем их понятными.

**❌ Плохо — непонятно, что значит `10`:**

```typescript
const users = fetchUsers(10);

const delay = 3600000;
setTimeout(() => {}, 3600000);
```

**✅ Хорошо — `MAX_USERS_PER_PAGE` делает код понятным:**

```typescript
const MAX_USERS_PER_PAGE = 10;
const users = fetchUsers(MAX_USERS_PER_PAGE);

const ONE_HOUR_MS = 60 * 60 * 1000;
setTimeout(() => {}, ONE_HOUR_MS);
```

**Примеры констант:**

```typescript
// Pagination
const ITEMS_PER_PAGE = 20;
const MAX_PAGES = 100;

// Timeouts
const REQUEST_TIMEOUT = 5000;
const DEBOUNCE_DELAY = 300;
const THROTTLE_INTERVAL = 100;

// Limits
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MIN_PASSWORD_LENGTH = 8;
const MAX_USERNAME_LENGTH = 20;

// Retry
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;
```

### 5.2 Вынос строк в константы

**❌ Плохо — Magic strings:**

```typescript
if (user.role === 'admin') {
}

fetch('/api/users');

localStorage.setItem('token', token);
```

**✅ Хорошо — константы:**

```typescript
const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest',
} as const;

if (user.role === USER_ROLES.ADMIN) {
}

const API_ENDPOINTS = {
  USERS: '/api/users',
  POSTS: '/api/posts',
} as const;

fetch(API_ENDPOINTS.USERS);

const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
} as const;

localStorage.setItem(STORAGE_KEYS.TOKEN, token);
```

### 5.3 Использование `as const` для объектов

```typescript
const ROUTES = {
  HOME: '/',
  OPTIONS: '/options',
  PICKER: '/picker',
} as const;

type Route = (typeof ROUTES)[keyof typeof ROUTES];

// Использование
const navigate = (route: Route) => {
  window.location.hash = route;
};

navigate(ROUTES.PICKER); // ✅
navigate('/unknown'); // ❌ Type error
```

**Преимущества:**

- Централизованное хранилище маршрутов
- Защита от опечаток (автодополнение работает)
- Масштабируемость без дублирования литералов

## Чек-лист: TypeScript Best Practices

### ✅ Типизация

- [ ] Нет `any` в коде
- [ ] Используется `unknown` вместо `any`
- [ ] Нет `{}` или `object` типов
- [ ] Явные типы возврата во всех функциях
- [ ] Type Guards вместо type assertions где возможно

### ✅ Структуры данных

- [ ] `as const` вместо `enum`
- [ ] `type` для простых типов
- [ ] `interface` для расширяемых типов
- [ ] Константы для magic values

### ✅ Настройка

- [ ] Строгий режим в `tsconfig.json`
- [ ] ESLint правила для TypeScript
- [ ] Path aliases настроены
