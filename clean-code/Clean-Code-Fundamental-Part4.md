# Продвинутые практики чистого кода

## Производительность и тестирование

### 1. Преждевременная оптимизация

> "Premature optimization is the root of all evil" — Donald Knuth

**Правильный подход:**

1. ✅ Сначала **работающий** код
2. ✅ Потом **чистый** код
3. ✅ Профилирование (где реально медленно?)
4. ✅ Оптимизация узких мест
5. ✅ Измерение результата

### 1.1 Когда оптимизировать

**Признаки необходимости оптимизации:**

- Измеримая проблема (медленный рендер, долгий запрос)
- Жалобы пользователей
- Метрики показывают проблему

**Профилирование:**

```typescript
// Chrome DevTools Performance
// React DevTools Profiler
// Или вручную
console.time('fetchUsers');
await fetchUsers();
console.timeEnd('fetchUsers'); // fetchUsers: 1234ms
```

**Big O сложность:**

```typescript
// O(n²) — квадратичная (плохо для больших массивов)
for (let i = 0; i < arr.length; i++) {
  for (let j = 0; j < arr.length; j++) {
    // ...
  }
}

// O(n) — линейная (хорошо)
for (let i = 0; i < arr.length; i++) {
  // ...
}

// O(1) — константная (отлично)
const item = map.get(key);
```

### 1.2 Простые оптимизации

**Кэширование результатов:**

```typescript
// Мемоизация дорогой функции
const cache = new Map<string, User>();

const getUserById = (id: string): User | null => {
  const cachedUser = cache.get(id);

  if (cachedUser) {
    return cachedUser;
  }

  const user = database.find(id);

  if (!user) {
    return null;
  }

  cache.set(id, user);
  return user;
};
```

Важно: кеш не должен скрывать отсутствие данных. Если `database.find(id)` может вернуть `null` или `undefined`, тип функции должен это отражать (`User | null`), а вызывающий код должен обработать этот случай.

```typescript
const user = getUserById(userId);

if (!user) {
  showNotFoundMessage();
  return;
}

renderUser(user);
```

**Debounce/Throttle:**

```typescript
// Debounce — вызов после паузы
const debounce = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

// Использование
const handleSearch = debounce((query: string) => {
  fetchSearchResults(query);
}, 300);

// Throttle — вызов не чаще N мс
const throttle = <Args extends unknown[], ReturnType>(
  fn: (...args: Args) => ReturnType,
  limit: number
): ((...args: Args) => void) => {
  let inThrottle: boolean;

  return (...args: Args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Использование
const handleScroll = throttle(() => {
  console.log('Scrolling...');
}, 100);
```

**Lazy loading:**

```typescript
// Загрузка по требованию
let heavyModule: typeof import('./heavy-module') | null = null;

const useHeavyFeature = async () => {
  if (!heavyModule) {
    heavyModule = await import('./heavy-module');
  }
  return heavyModule.doSomething();
};
```

**Избегать лишних вычислений:**

```typescript
// ❌ Плохо — вычисляем на каждой итерации
for (let i = 0; i < arr.length; i++) {
  const processedData = expensiveOperation(data); // ❌
  arr[i] = processedData;
}

// ✅ Хорошо — вычисляем один раз
const processedData = expensiveOperation(data);
for (let i = 0; i < arr.length; i++) {
  arr[i] = processedData;
}
```

## 2. Тестируемость кода

### 2.1 Что делает код тестируемым

**Чистые функции:**

```typescript
// ✅ Легко тестировать — чистая функция
const add = (a: number, b: number): number => a + b;

test('add', () => {
  expect(add(2, 3)).toBe(5);
});
```

**Dependency Injection:**

```typescript
// ❌ Сложно тестировать — жёсткая зависимость
class UserService {
  private db = new Database(); // ❌

  async getUser(id: string) {
    return this.db.find(id);
  }
}
// ✅ Легко тестировать — DI
class UserService {
  constructor(private db: Database) {} // ✅

  async getUser(id: string) {
    return this.db.find(id);
  }
}
// В тестах используем мок
const mockDb = { find: jest.fn() };
const service = new UserService(mockDb);
```

**Малые функции:**

```typescript
// ✅ Легко тестировать — маленькие функции
const validateEmail = (email: string): boolean => /\S+@\S+\.\S+/.test(email);

const validatePassword = (password: string): boolean => password.length >= 8;

const validateUser = (user: User): boolean =>
  validateEmail(user.email) && validatePassword(user.password);

// Каждую функцию тестируем отдельно
```

**Изоляция side effects:**

```typescript
// ✅ Логика отделена от эффектов
const calculateTotal = (items: Item[]): number => items.reduce((sum, item) => sum + item.price, 0);

const saveOrder = async (order: Order): Promise<void> => {
  const total = calculateTotal(order.items); // Чистая функция
  await database.save({ ...order, total }); // Side effect изолирован
};

// Тестируем calculateTotal без БД
test('calculateTotal', () => {
  expect(calculateTotal([{ price: 10 }, { price: 20 }])).toBe(30);
});
```

### 2.2 Признаки нетестируемого кода

**Глобальное состояние:**

```typescript
// ❌ Сложно тестировать
let currentUser: User | null = null;

const getUserName = (): string => currentUser?.name ?? 'Guest'; // Зависит от глобального состояния
```

**Тесно связанный код:**

```typescript
// ❌ Сложно тестировать — всё связано
class OrderProcessor {
  processOrder(order: Order) {
    const validation = new OrderValidator(); // Жёсткая связь
    validation.validate(order);

    const payment = new PaymentService(); // Жёсткая связь
    payment.charge(order);

    const email = new EmailService(); // Жёсткая связь
    email.send(order.user.email, 'Order confirmed');
  }
}
```

**Скрытые зависимости:**

```typescript
// ❌ Сложно тестировать — скрытая зависимость на Date
const isExpired = (expiryDate: Date): boolean => expiryDate < new Date(); // Зависимость от текущего времени

// ✅ Легко тестировать — явная зависимость
const isExpired = (expiryDate: Date, currentDate: Date = new Date()): boolean =>
  expiryDate < currentDate;

test('isExpired', () => {
  const expiry = new Date('2020-01-01');
  const current = new Date('2021-01-01');
  expect(isExpired(expiry, current)).toBe(true);
});
```

### 2.3 Рефакторинг для тестов

**Извлечение зависимостей:**

```typescript
// ❌ До
class UserService {
  async createUser(userData: UserData) {
    const user = new User(userData);
    await database.save(user);
    await emailService.sendWelcome(user.email);
    logger.info(`User created: ${user.id}`);
  }
}

// ✅ После
class UserService {
  constructor(
    private database: Database,
    private emailService: EmailService,
    private logger: Logger
  ) {}

  async createUser(userData: UserData) {
    const user = new User(userData);
    await this.database.save(user);
    await this.emailService.sendWelcome(user.email);
    this.logger.info(`User created: ${user.id}`);
  }
}

// Теперь можно подставить моки в тестах
```

**Разделение логики и эффектов:**

```typescript
// ✅ Чистая логика
const calculateDiscount = (user: User, order: Order): number => {
  if (user.isPremium && order.total > 100) {
    return order.total * 0.2;
  }
  return 0;
};
// ✅ Эффекты отдельно
const applyDiscount = async (user: User, order: Order): Promise<void> => {
  const discount = calculateDiscount(user, order); // Тестируемая логика
  order.discount = discount;
  await database.update(order); // Side effect
};

// Тестируем только логику
test('calculateDiscount', () => {
  const user = { isPremium: true };
  const order = { total: 150 };
  expect(calculateDiscount(user, order)).toBe(30);
});
```

### 2.4 Примеры реальных тестов

**Пример 1: Тестирование чистой функции**

```typescript
// src/utils/calculate.ts
export const calculateTotal = (items: Array<{ price: number }>): number =>
  items.reduce((sum, item) => sum + item.price, 0);

export const calculateTax = (amount: number, taxRate: number): number => amount * taxRate;

export const calculateFinalPrice = (items: Array<{ price: number }>, taxRate: number): number => {
  const subtotal = calculateTotal(items);
  const tax = calculateTax(subtotal, taxRate);
  return subtotal + tax;
};
```

```typescript
// src/utils/calculate.test.ts
import { describe, it, expect } from 'vitest';
import { calculateTotal, calculateTax, calculateFinalPrice } from './calculate';

describe('calculateTotal', () => {
  it('should return 0 for empty array', () => {
    expect(calculateTotal([])).toBe(0);
  });

  it('should calculate total price of items', () => {
    const items = [{ price: 10 }, { price: 20 }, { price: 30 }];
    expect(calculateTotal(items)).toBe(60);
  });

  it('should handle single item', () => {
    expect(calculateTotal([{ price: 42 }])).toBe(42);
  });
});

describe('calculateTax', () => {
  it('should calculate tax correctly', () => {
    expect(calculateTax(100, 0.2)).toBe(20);
  });

  it('should return 0 for 0% tax rate', () => {
    expect(calculateTax(100, 0)).toBe(0);
  });
});

describe('calculateFinalPrice', () => {
  it('should calculate final price with tax', () => {
    const items = [{ price: 100 }];
    const result = calculateFinalPrice(items, 0.2);
    expect(result).toBe(120); // 100 + 20% tax
  });

  it('should handle multiple items with tax', () => {
    const items = [{ price: 50 }, { price: 50 }];
    const result = calculateFinalPrice(items, 0.1);
    expect(result).toBe(110); // 100 + 10% tax
  });
});
```

**Пример 2: Тестирование с моками (Dependency Injection)**

```typescript
// src/services/user-service.ts
interface UserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
}

interface EmailService {
  sendWelcomeEmail(email: string): Promise<void>;
}

export class UserService {
  constructor(
    private repository: UserRepository,
    private emailService: EmailService
  ) {}

  async createUser(userData: { name: string; email: string }): Promise<User> {
    const user: User = {
      id: crypto.randomUUID(),
      ...userData,
      createdAt: new Date(),
    };

    await this.repository.save(user);
    await this.emailService.sendWelcomeEmail(user.email);

    return user;
  }

  async getUser(id: string): Promise<User | null> {
    return this.repository.findById(id);
  }
}
```

```typescript
// src/services/user-service.test.ts
import { describe, it, expect, vi } from 'vitest';
import { UserService } from './user-service';

describe('UserService', () => {
  describe('createUser', () => {
    it('should create user and send welcome email', async () => {
      // Arrange - создаем моки
      const mockRepository = {
        findById: vi.fn(),
        save: vi.fn().mockResolvedValue(undefined),
      };

      const mockEmailService = {
        sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
      };

      const service = new UserService(mockRepository, mockEmailService);

      // Act - выполняем действие
      const result = await service.createUser({
        name: 'John Doe',
        email: 'john@example.com',
      });

      // Assert - проверяем результат
      expect(result).toMatchObject({
        name: 'John Doe',
        email: 'john@example.com',
      });
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);

      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledWith(result);

      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledTimes(1);
      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith('john@example.com');
    });
  });

  describe('getUser', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: '123',
        name: 'John',
        email: 'john@example.com',
        createdAt: new Date(),
      };

      const mockRepository = {
        findById: vi.fn().mockResolvedValue(mockUser),
        save: vi.fn(),
      };

      const mockEmailService = {
        sendWelcomeEmail: vi.fn(),
      };

      const service = new UserService(mockRepository, mockEmailService);

      const result = await service.getUser('123');

      expect(result).toEqual(mockUser);
      expect(mockRepository.findById).toHaveBeenCalledWith('123');
    });

    it('should return null when user not found', async () => {
      const mockRepository = {
        findById: vi.fn().mockResolvedValue(null),
        save: vi.fn(),
      };

      const mockEmailService = {
        sendWelcomeEmail: vi.fn(),
      };

      const service = new UserService(mockRepository, mockEmailService);

      const result = await service.getUser('999');

      expect(result).toBeNull();
    });
  });
});
```

**Пример 3: Тестирование валидации**

```typescript
// src/utils/validation.ts
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= 8;
};

export const validateUser = (user: {
  email: string;
  password: string;
}): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!isValidEmail(user.email)) {
    errors.push('Invalid email format');
  }

  if (!isValidPassword(user.password)) {
    errors.push('Password must be at least 8 characters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
```

```typescript
// src/utils/validation.test.ts
import { describe, it, expect } from 'vitest';
import { isValidEmail, isValidPassword, validateUser } from './validation';

describe('isValidEmail', () => {
  it('should return true for valid email', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
  });

  it('should return false for invalid email', () => {
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('missing@domain')).toBe(false);
    expect(isValidEmail('@domain.com')).toBe(false);
    expect(isValidEmail('user@')).toBe(false);
  });
});

describe('isValidPassword', () => {
  it('should return true for password with 8+ characters', () => {
    expect(isValidPassword('12345678')).toBe(true);
    expect(isValidPassword('verylongpassword')).toBe(true);
  });

  it('should return false for short password', () => {
    expect(isValidPassword('1234567')).toBe(false);
    expect(isValidPassword('')).toBe(false);
  });
});

describe('validateUser', () => {
  it('should validate correct user', () => {
    const result = validateUser({
      email: 'test@example.com',
      password: '12345678',
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should return errors for invalid email', () => {
    const result = validateUser({
      email: 'invalid-email',
      password: '12345678',
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid email format');
  });

  it('should return errors for short password', () => {
    const result = validateUser({
      email: 'test@example.com',
      password: '123',
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must be at least 8 characters');
  });

  it('should return multiple errors', () => {
    const result = validateUser({
      email: 'invalid',
      password: '123',
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
  });
});
```

**Ключевые принципы тестирования:**

1. **AAA pattern**: Arrange (подготовка) → Act (действие) → Assert (проверка)
2. **Один тест = одна проверка**: Каждый тест проверяет один сценарий
3. **Явные имена**: `it('should return null when user not found')` понятнее чем `it('test getUser')`
4. **Изоляция**: Тесты не зависят друг от друга
5. **Моки для зависимостей**: Тестируем только свой код, не внешние сервисы
