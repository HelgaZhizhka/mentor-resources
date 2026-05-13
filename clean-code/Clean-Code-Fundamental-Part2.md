# Рефакторинг и организация кода

> **Примечание:** Основы чистого кода (именование, функции, комментарии) описаны в [Части 1](Clean-Code-Fundamental-Part1.md). Эта часть углубляется в рефакторинг и организацию кода.

## 1. Code Smells (Признаки плохого кода)

### 1.1 Duplicated Code (Дублирование)

**Признаки:**

- Copy-paste код
- Одинаковая логика в разных местах
- Похожие функции

**❌ Плохо:**

```typescript
const calculateEmployeeSalary = (employee: Employee): number => {
  const baseSalary = employee.baseSalary;
  const bonus = employee.bonus || 0;
  const tax = (baseSalary + bonus) * 0.2;
  return baseSalary + bonus - tax;
};

const calculateContractorPayment = (contractor: Contractor): number => {
  const basePay = contractor.basePay;
  const bonus = contractor.bonus || 0;
  const tax = (basePay + bonus) * 0.2;
  return basePay + bonus - tax;
};
```

**✅ Хорошо — Extract Method:**

```typescript
const calculateNetPayment = (basePay: number, bonus: number = 0): number => {
  const grossPay = basePay + bonus;
  const tax = grossPay * 0.2;
  return grossPay - tax;
};

const calculateEmployeeSalary = (employee: Employee): number =>
  calculateNetPayment(employee.baseSalary, employee.bonus);

const calculateContractorPayment = (contractor: Contractor): number =>
  calculateNetPayment(contractor.basePay, contractor.bonus);
```

### 1.2 Long Method (Длинная функция)

**Признаки:**

- Функция больше 20-30 строк
- Трудно понять с первого взгляда
- Несколько уровней абстракции

### 1.3 Large Class (Большой класс)

**Признаки:**

- Класс делает слишком много
- Много методов и свойств
- God Object anti-pattern

**❌ Плохо:**

```typescript
class User {
  // Properties
  id: string;
  name: string;
  email: string;

  // Database operations
  save() {}
  update() {}
  delete() {}

  // Email operations
  sendWelcomeEmail() {}
  sendPasswordResetEmail() {}

  // Authentication
  login() {}
  logout() {}
  resetPassword() {}

  // Validation
  validateEmail() {}
  validatePassword() {}

  // Reporting
  generateReport() {}
  exportToPDF() {}
}
```

**✅ Хорошо — разделение ответственности:**

```typescript
class User {
  constructor(
    public id: string,
    public name: string,
    public email: string
  ) {}
}

class UserRepository {
  save(user: User) {}
  update(user: User) {}
  delete(userId: string) {}
}

class UserEmailService {
  sendWelcomeEmail(user: User) {}
  sendPasswordResetEmail(user: User) {}
}

class UserAuth {
  login(email: string, password: string) {}
  logout(userId: string) {}
  resetPassword(userId: string) {}
}

class UserValidator {
  validateEmail(email: string) {}
  validatePassword(password: string) {}
}

class UserReportGenerator {
  generate(user: User) {}
  exportToPDF(user: User) {}
}
```

### 1.4 Long Parameter List

> Подробнее см. [Часть 1, раздел 2.2 - Параметры функции](Clean-Code-Fundamental-Part1.md#22-параметры-функции)

**Признаки:**

- Функция принимает более 3 параметров
- Трудно запомнить порядок параметров
- Высокий риск ошибки при вызове

**❌ Плохо:**

```typescript
function createUser(
  firstName: string,
  lastName: string,
  email: string,
  age: number,
  address: string,
  phone: string
) {
  // ...
}

// Легко перепутать порядок
createUser('John', 'Doe', 'john@example.com', 30, '123 St', '+123456');
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
}

function createUser(params: CreateUserParams): User {
  const { firstName, lastName, email, age, address, phone } = params;
  // ...
}

// Понятно и безопасно
createUser({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  age: 30,
  address: '123 St',
  phone: '+123456',
});
```

### 1.5 Magic Numbers и Magic Strings

**❌ Плохо:**

```typescript
const calculatePrice = (price: number) => {
  if (price > 100) {
    return price * 0.9; // ❌ Что такое 0.9?
  }
  return price;
};

if (user.role === 'admin') {
  // ❌ Magic string
  // ...
}

setTimeout(() => {
  // ...
}, 3600000); // ❌ Что такое 3600000?
```

**✅ Хорошо:**

```typescript
const DISCOUNT_THRESHOLD = 100;
const DISCOUNT_RATE = 0.9;

const calculatePrice = (price: number): number => {
  if (price > DISCOUNT_THRESHOLD) {
    return price * DISCOUNT_RATE;
  }
  return price;
};

const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest',
} as const;

if (user.role === USER_ROLES.ADMIN) {
  // ...
}

const ONE_HOUR_MS = 60 * 60 * 1000;

setTimeout(() => {
  // ...
}, ONE_HOUR_MS);
```

### 1.6 Dead Code (Мёртвый код)

**Признаки:**

- Неиспользуемые функции
- Закомментированный код
- Unreachable code

**❌ Плохо:**

```typescript
const processUser = (user: User) => {
  // const oldProcessUser = (user: User) => {
  //   // старая логика
  // };

  if (user.isActive) {
    return activateUser(user);
  } else {
    return deactivateUser(user);
    console.log('This will never execute'); // ❌ Unreachable
  }
};

const unusedFunction = () => {
  // ❌ Никогда не вызывается
};
```

**✅ Хорошо — удаляем:**

```typescript
const processUser = (user: User) => {
  if (user.isActive) {
    return activateUser(user);
  }

  return deactivateUser(user);
};

// unusedFunction удалена
```

**Как безопасно удалять:**

1. Поиск всех упоминаний (Ctrl+Shift+F)
2. Git history всегда хранит старую версию

### 1.8 Primitive Obsession

**Проблема:** Использование примитивов вместо объектов.

**❌ Плохо:**

```typescript
const sendEmail = (
  to: string,
  subject: string,
  body: string,
  priority: number, // ❌ Что такое 1, 2, 3?
  retryCount: number
) => {
  // ...
};

sendEmail('user@example.com', 'Hello', 'Body', 2, 3);
```

**✅ Хорошо — Value Objects:**

```typescript
enum EmailPriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
}

interface Email {
  to: string;
  subject: string;
  body: string;
  priority: EmailPriority;
  retryCount: number;
}

const sendEmail = (email: Email): void => {
  // ...
};

sendEmail({
  to: 'user@example.com',
  subject: 'Hello',
  body: 'Body',
  priority: EmailPriority.NORMAL,
  retryCount: 3,
});
```

### 1.9 Switch Statements

`switch` сам по себе не является плохой практикой. Он становится smell, когда один и тот же набор условий дублируется в разных местах или постоянно расширяется при добавлении новых вариантов.

**❌ Плохо — простой switch можно заменить словарём:**

```typescript
const getAnimalSound = (animal: string): string => {
  switch (animal) {
    case 'dog':
      return 'woof';
    case 'cat':
      return 'meow';
    case 'cow':
      return 'moo';
    default:
      return 'unknown';
  }
};
```

**✅ Хорошо — объект (dictionary):**

```typescript
const ANIMAL_SOUNDS: Record<string, string> = {
  dog: 'woof',
  cat: 'meow',
  cow: 'moo',
};

const getAnimalSound = (animal: string): string => ANIMAL_SOUNDS[animal] ?? 'unknown';
```

**✅ Или полиморфизм:**

```typescript
interface Animal {
  makeSound(): string;
}

class Dog implements Animal {
  makeSound(): string {
    return 'woof';
  }
}

class Cat implements Animal {
  makeSound(): string {
    return 'meow';
  }
}

const animal: Animal = new Dog();
console.log(animal.makeSound()); // woof
```

**Когда switch ОК:**

- Работа с discriminated unions в TypeScript
- Reducers и state machines
- Нужна exhaustive-проверка всех вариантов
- Сложная логика в каждой ветке
- Fall-through behavior нужен и явно задокументирован
- Работа с диапазонами

### 1.10 Shotgun Surgery

**Проблема:** Одно изменение требует правок во многих местах.

**❌ Плохо:**

```typescript
// В 10 разных файлах:
const TAX_RATE = 0.2;

// Если нужно изменить налог — правим 10 файлов ❌
```

**✅ Хорошо — централизация:**

```typescript
// config/tax.ts
export const TAX_RATE = 0.2;

// Во всех файлах:
import { TAX_RATE } from './config/tax';

// Теперь изменение в одном месте ✅
```

## 2. Организация кода

### 2.1 Форматирование

**Отступы:**

- **2 пробела** (рекомендуется) или 4 пробела
- **НЕ табы** (проблемы на разных системах)
  **Длина строки:**
- **80-120 символов** максимум
- Переносить длинные строки

```typescript
// ❌ Плохо — слишком длинная строка
const message = `This is a very long message that should be split into multiple lines to improve readability and maintain code quality standards`;

// ✅ Хорошо
const message =
  `This is a very long message that should be split ` +
  `into multiple lines to improve readability ` +
  `and maintain code quality standards`;

// ✅ Или template literal
const message = `
  This is a very long message that should be split
  into multiple lines to improve readability
  and maintain code quality standards
`.trim();
```

**Пустые строки для группировки:**

```typescript
// ✅ Группировка логических блоков
const processUser = (user: User) => {
  // Валидация
  if (!user) throw new Error('User required');
  if (!user.email) throw new Error('Email required');

  // Вычисления
  const age = calculateAge(user.birthDate);
  const discount = calculateDiscount(user);

  // Сохранение
  database.save({ ...user, age, discount });
  cache.invalidate(user.id);

  return user;
};
```

**Вертикальное расстояние:**

```typescript
// ❌ Плохо — всё слипшееся
const foo = () => {};
const bar = () => {};
const baz = () => {};

// ✅ Хорошо — разделено пустыми строками
const foo = () => {
  // ...
};

const bar = () => {
  // ...
};

const baz = () => {
  // ...
};
```

### 2.2 Порядок кода

**В классах:**

```typescript
class UserService {
  // 1. Статические свойства
  private static instance: UserService;

  // 2. Приватные свойства
  private readonly repository: UserRepository;

  // 3. Публичные свойства
  public users: User[] = [];

  // 4. Конструктор
  constructor(repository: UserRepository) {
    this.repository = repository;
  }

  // 5. Статические методы
  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService(new UserRepository());
    }
    return UserService.instance;
  }

  // 6. Публичные методы
  public async getUser(id: string): Promise<User> {
    return this.repository.findById(id);
  }

  // 7. Приватные методы
  private validateUser(user: User): boolean {
    return !!user.email;
  }
}
```

**В модулях (файлах):**

```typescript
// 1. Импорты (внешние библиотеки)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 2. Импорты (внутренние модули)
import { Button } from '@/components/button';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils/date';

// 3. Импорты (стили)
import styles from './styles.module.css';

// 4. Типы и интерфейсы
interface UserProfileProps {
  userId: string;
}

// 5. Константы
const MAX_RETRIES = 3;

// 6. Главная функция/компонент
export const UserProfile = ({ userId }: UserProfileProps) => {
  // ...
};
```

**Связанные функции рядом:**

```typescript
// ✅ Хорошо — связанные функции рядом
const validateEmail = (email: string): boolean => /\S+@\S+\.\S+/.test(email);

const validatePassword = (password: string): boolean => password.length >= 8;

const validateUser = (user: User): boolean =>
  validateEmail(user.email) && validatePassword(user.password);
```

### 2.3 Порядок импортов:

```typescript
// 1. Node.js встроенные модули
import fs from 'fs';
import path from 'path';

// 2. Внешние библиотеки
import React from 'react';
import { useQuery } from '@tanstack/react-query';

// 3. Алиасы проекта (@/)
import { Button } from '@/components/button';

import { useAuth } from '@/hooks/useAuth';

// 4. Относительные импорты (родительские директории)
import { formatDate } from '../../utils/date';
import { UserType } from '../types';

// 5. Относительные импорты (текущая директория)
import { UserCard } from './user-card';
import styles from './styles.module.css';
```

**Группировка с пустыми строками:**

```typescript
// ✅ Хорошо — группы разделены
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/button';
import { useAuth } from '@/hooks/useAuth';

import styles from './styles.module.css';
```

Используйте eslint плагин для форматирования импортов eslint-plugin-import.

**Избегать barrel exports где не нужно:**

```typescript
// ❌ Плохо — barrel export для всего
// components/index.ts
export * from './button';
export * from './input';
export * from './card';
// ... 50+ компонентов

// Проблема: сложнее анализировать зависимости, возможны циклы и проблемы с tree-shaking/code splitting
import { Button } from '@/components';

// ✅ Хорошо — прямые импорты
import { Button } from '@/components/button';
import { Input } from '@/components/input';
```

**Когда barrel exports полезны:**

- Небольшое количество экспортов (5-10)
- Логически связанная группа
- Публичное API библиотеки
- Локальный `index.ts` внутри папки компонента, если он не превращается в глобальный barrel для всего проекта

**Важно:** современные bundlers умеют tree-shaking, поэтому barrel export не всегда “загружает всё”. Реальные риски чаще в другом: циклические зависимости, медленнее TypeScript/IDE resolution, хуже code splitting и менее прозрачные зависимости.
