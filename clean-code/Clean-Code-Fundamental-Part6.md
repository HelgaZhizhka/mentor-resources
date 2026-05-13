# Дополнительные практики

## 1. Стрелочные функции для методов

**✅ Хорошая практика:**

```typescript
// ✅ В React
const Component = () => {
  const handleClick = () => {
    console.log('Clicked'); // this не нужен
  };

  return <button onClick={handleClick}>Click</button>;
};

// ✅ Для коллбэков
const numbers = [1, 2, 3];
const doubled = numbers.map(n => n * 2);
```

## 2. Осторожно с setTimeout и setInterval

**Проблемы:**

- Не гарантируют точность
- Могут вызывать утечки памяти
- Продолжают работать после размонтирования (React)

**❌ Плохо:**

```typescript
useEffect(() => {
  setInterval(() => {
    fetchData();
  }, 1000);
}, []); // ❌ Утечка памяти — интервал не очищается
```

**✅ Хорошо — очищаем interval:**

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    fetchData();
  }, 1000);

  return () => clearInterval(interval); // ✅ Cleanup
}, [fetchData]);
```

Если `fetchData` создаётся внутри компонента, следите за dependency array. Часто лучше объявить функцию внутри `useEffect` или вынести логику в custom hook.

**✅ Хорошо — polling с `AbortController`:**

```typescript
useEffect(() => {
  const controller = new AbortController();

  const interval = setInterval(() => {
    fetchData({ signal: controller.signal });
  }, 1000);

  return () => {
    controller.abort();
    clearInterval(interval);
  };
}, [fetchData]);
```

`clearInterval` останавливает будущие вызовы, но не отменяет уже начатый `fetch`. Если внутри interval есть запросы, используйте `AbortController`.

**Альтернативы:**

```typescript
// Вместо вложенных setTimeout — async/await + delay
const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const run = async (): Promise<void> => {
  await delay(2000);
  console.log('After 2 seconds');
};
```

**`requestAnimationFrame` — не универсальная замена `setInterval`:**

Используйте `requestAnimationFrame` для анимаций и визуальных обновлений, которые должны быть синхронизированы с repaint браузера.

```typescript
const animate = (): void => {
  updateAnimationFrame();
  requestAnimationFrame(animate);
};

requestAnimationFrame(animate);
```

Для polling/API-запросов лучше использовать `setInterval`/`setTimeout` с cleanup или специализированные инструменты вроде React Query/SWR.

## 3. Event Delegation

**Преимущества:**

- **Производительность** — меньше обработчиков = меньше памяти
- **Динамические элементы** — работает с элементами, добавленными после загрузки
- **Меньше кода** — один обработчик вместо множества
- **Легче поддерживать** — изменения в одном месте

### 3.1 Как использовать Event Delegation

**❌ Плохо — обработчик на каждый элемент**

```javascript
// Проблема: если у нас 1000 кнопок — будет 1000 обработчиков!
const buttons = document.querySelectorAll('.button');

buttons.forEach((button) => {
  button.addEventListener('click', (event) => {
    console.log('Button clicked:', event.target.textContent);
  });
});

// Проблема: динамически добавленные кнопки НЕ будут работать!
const newButton = document.createElement('button');
newButton.className = 'button';
newButton.textContent = 'New Button';
document.body.appendChild(newButton); // Обработчик не сработает!
```

**✅ Хорошо — Event Delegation с безопасной проверкой DOM**

```typescript
// Один обработчик на родительском элементе
const container = document.querySelector('.button-container');

if (!(container instanceof HTMLElement)) {
  throw new Error('Button container not found');
}

container.addEventListener('click', (event) => {
  const target = event.target;

  if (!(target instanceof Element)) {
    return;
  }

  const button = target.closest<HTMLButtonElement>('.button');

  if (!button || !container.contains(button)) {
    return;
  }

  console.log('Button clicked:', button.textContent);
});

// Динамически добавленные кнопки работают автоматически!
const newButton = document.createElement('button');
newButton.className = 'button';
newButton.textContent = 'New Button';
container.appendChild(newButton);
```

### 3.2 Когда НЕ использовать Event Delegation

**Не используйте Event Delegation если:**

1. **Нужна высокая производительность** для одного элемента (например, canvas)
2. **События не всплывают** (`focus`, `blur`, `scroll` — используйте `focusin`, `focusout` вместо)
3. **Логика слишком специфична** для каждого элемента

## 4. Обязательные скобки для if/else/for

**Проблемы без скобок:**

- **Легко ошибиться** при добавлении новой строки
- **Плохая читаемость** — непонятно где начинается/заканчивается блок
- **Возможные баги** — добавил строку, забыл скобки = баг

**❌ Плохо — без скобок**

```javascript
// Проблема: легко ошибиться при изменении
if (user.isActive) console.log('Active user');

// Разработчик добавляет вторую строку — БАГ!
if (user.isActive) console.log('Active user');
sendEmail(user); // выполнится ВСЕГДА! Не зависит от условия!
```

**✅ Хорошо — со скобками**

```javascript
// Всегда используйте скобки, даже для одной строки
if (user.isActive) {
  console.log('Active user');
}

// Теперь добавление новой строки безопасно
if (user.isActive) {
  console.log('Active user');
  sendEmail(user); // выполнится только для активных пользователей
}
```

### 4.2 Настройка ESLint

Добавьте правило в `eslint.config.js`:

```javascript
export default [
  {
    rules: {
      curly: ['error', 'all'],
    },
  },
];
```

## 5. Размер файлов (200-400 строк)

**Проблемы больших файлов (>400 строк):**

- **Сложно найти нужный код** — долгий скроллинг
- **Нарушение Single Responsibility** — файл делает слишком много
- **Сложно поддерживать** — изменения затрагивают много кода
- **Merge conflicts** — несколько людей правят один файл

### 5.2 Рекомендуемые размеры

| Тип файла           | Рекомендуемый размер | Максимальный размер |
| ------------------- | -------------------- | ------------------- |
| **Utility функции** | 50-100 строк         | 200 строк           |
| **React компонент** | 100-200 строк        | 300 строк           |
| **Service/API**     | 100-250 строк        | 400 строк           |
| **Страница/Route**  | 150-300 строк        | 500 строк           |

### 5.3 Как определить, что файл слишком большой?

**Признаки:**

1. **Скроллинг больше 2-3 экранов** — сложно ориентироваться
2. **Больше 5-7 функций/методов** — нужно разделить
3. **Несколько разных ответственностей** — нарушение SRP
4. **Сложно назвать файл** — значит делает слишком много

### 5.4 Пример рефакторинга

**❌ Плохо — файл на 600 строк**

```typescript
// src/components/UserProfile.tsx (600 строк)
export const UserProfile = () => {
  // 1. State management (50 строк)
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  // ... еще 10 состояний

  // 2. API calls (100 строк)
  const fetchUser = async () => {
    /* ... */
  };
  // ... еще 5 функций

  // 3. Handlers (150 строк)
  // ... много кода

  // 4. Rendering (200 строк)
  return <div>{/* Огромная вложенная структура... */}</div>;
}
```

**✅ Хорошо — разделение на модули**

```typescript
// src/components/UserProfile/UserProfile.tsx (150 строк)
import { useUserProfile } from './hooks/useUserProfile';
import { UserInfo } from './components/UserInfo';
import { UserPosts } from './components/UserPosts';

export const UserProfile = () => {
  const { user, posts, isLoading } = useUserProfile();

  if (isLoading) return <Loader />;

  return (
    <div className="user-profile">
      <UserInfo user={user} />
      <UserPosts posts={posts} />
    </div>
  );
}

// src/components/UserProfile/hooks/useUserProfile.ts (100 строк)
export const useUserProfile = () => {
  // State и API calls
}

// src/components/UserProfile/components/UserInfo.tsx (80 строк)
export const UserInfo = ({ user }) => {
  // Компонент информации о пользователе
}
```

### 5.5 Автоматическая проверка размера

**ESLint:**

```javascript
export default [
  {
    rules: {
      'max-lines': ['warn', { max: 400, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['warn', { max: 50, skipBlankLines: true, skipComments: true }],
    },
  },
];
```
