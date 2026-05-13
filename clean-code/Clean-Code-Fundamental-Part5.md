# Продвинутые практики чистого кода

## Принципы чистого кода в архитектурных паттернах

SOLID часто объясняют через классы, но это не значит, что чистая архитектура во frontend обязательно должна быть OOP-heavy. В React те же идеи часто выражаются через маленькие компоненты, custom hooks, композицию, явные зависимости и разделение UI/логики/API.

Используйте SOLID как способ думать о связности и ответственности, а не как требование создавать много классов.

### 1 SOLID Principles

#### S - Single Responsibility Principle (Принцип единственной ответственности)

**Определение:** Каждый модуль, класс или функция должны иметь только одну причину для изменения.

**❌ Плохо — класс делает слишком много:**

```typescript
class User {
  constructor(
    public name: string,
    public email: string
  ) {}

  // Валидация
  validateEmail(): boolean {
    return /\S+@\S+\.\S+/.test(this.email);
  }

  // Сохранение в БД
  save(): void {
    console.log('Saving to database...');
  }

  // Отправка email
  sendWelcomeEmail(): void {
    console.log('Sending email...');
  }

  // Генерация отчёта
  generateReport(): string {
    return `User: ${this.name}, Email: ${this.email}`;
  }
}
```

**Проблема:** `User` отвечает за валидацию, сохранение в БД, отправку email и генерацию отчётов. Если меняется логика email — нужно менять класс `User`.

**✅ Хорошо — каждый класс отвечает за одно:**

```typescript
class User {
  constructor(
    public name: string,
    public email: string
  ) {}
}

class EmailValidator {
  static validate(email: string): boolean {
    return /\S+@\S+\.\S+/.test(email);
  }
}

class UserRepository {
  save(user: User): void {
    console.log('Saving to database...', user);
  }
}

class EmailService {
  sendWelcomeEmail(user: User): void {
    console.log('Sending welcome email to', user.email);
  }
}

class UserReportGenerator {
  generate(user: User): string {
    return `User: ${user.name}, Email: ${user.email}`;
  }
}
```

**Когда применять:**

- Функция делает больше одного действия
- Класс имеет несколько причин для изменения
- Модуль содержит несвязанную логику

#### O - Open/Closed Principle (Принцип открытости/закрытости)

**Определение:** Код должен быть открыт для расширения, но закрыт для модификации.

**❌ Плохо — для добавления нового типа нужно менять функцию:**

```typescript
const calculateArea = (shape: {
  type: string;
  width?: number;
  height?: number;
  radius?: number;
}) => {
  if (shape.type === 'rectangle') {
    return shape.width! * shape.height!;
  } else if (shape.type === 'circle') {
    return Math.PI * shape.radius! ** 2;
  }
  // Для добавления triangle нужно менять эту функцию ❌
  return 0;
};
```

**✅ Хорошо — новые фигуры добавляются без изменения существующего кода:**

```typescript
interface Shape {
  calculateArea(): number;
}

class Rectangle implements Shape {
  constructor(
    private width: number,
    private height: number
  ) {}

  calculateArea(): number {
    return this.width * this.height;
  }
}

class Circle implements Shape {
  constructor(private radius: number) {}

  calculateArea(): number {
    return Math.PI * this.radius ** 2;
  }
}

class Triangle implements Shape {
  constructor(
    private base: number,
    private height: number
  ) {}

  calculateArea(): number {
    return (this.base * this.height) / 2;
  }
}

// Использование
const printArea = (shape: Shape) => {
  console.log(`Area: ${shape.calculateArea()}`);
};
```

**Когда применять:**

- Когда нужно добавлять новую функциональность
- Когда код часто расширяется новыми типами/случаями

**Важно про баланс с YAGNI:** Open/Closed не означает “никогда не менять существующий код” и не требует заранее строить абстракции под все будущие сценарии. Создавайте точки расширения там, где изменения действительно ожидаемы. Если сценарий гипотетический — сначала выберите простое решение.

#### L - Liskov Substitution Principle (Принцип подстановки Барбары Лисков)

**Определение:** Должна быть возможность вместо базового (родительского) типа (класса) подставить любой его подтип (класс-наследник), при этом работа программы не должна измениться.
Подклассы должны полностью заменять базовый класс без изменения ожидаемого поведения.

**❌ Плохо — `Square` нарушает контракт `Rectangle`:**

```typescript
class Rectangle {
  constructor(
    protected width: number,
    protected height: number
  ) {}

  setWidth(width: number): void {
    this.width = width;
  }

  setHeight(height: number): void {
    this.height = height;
  }

  getArea(): number {
    return this.width * this.height;
  }
}

class Square extends Rectangle {
  setWidth(width: number): void {
    this.width = width;
    this.height = width; // ❌ Неожиданное поведение!
  }

  setHeight(height: number): void {
    this.width = height; // ❌ Неожиданное поведение!
    this.height = height;
  }
}

// Проблема:
const resizeRectangle = (rect: Rectangle) => {
  rect.setWidth(5);
  rect.setHeight(10);
  console.log(rect.getArea()); // Ожидаем 50
};

const square = new Square(3, 3);
resizeRectangle(square); // Получим 100, а не 50! ❌
```

**✅ Хорошо — каждый класс независим:**

```typescript
interface Shape {
  getArea(): number;
}

class Rectangle implements Shape {
  constructor(
    private width: number,
    private height: number
  ) {}

  setWidth(width: number): void {
    this.width = width;
  }

  setHeight(height: number): void {
    this.height = height;
  }

  getArea(): number {
    return this.width * this.height;
  }
}

class Square implements Shape {
  constructor(private side: number) {}

  setSide(side: number): void {
    this.side = side;
  }

  getArea(): number {
    return this.side * this.side;
  }
}
```

**Когда применять:**

- При создании иерархии классов
- Когда подкласс изменяет поведение родителя неожиданным образом

#### I - Interface Segregation Principle (Принцип разделения интерфейса)

**Определение:** Не заставляйте классы реализовывать методы, которые им не нужны.

**❌ Плохо — `Printer` вынужден реализовывать методы, которые не поддерживает:**

```typescript
interface Machine {
  print(document: string): void;
  scan(document: string): void;
  fax(document: string): void;
}

class SimplePrinter implements Machine {
  print(document: string): void {
    console.log('Printing:', document);
  }

  scan(document: string): void {
    throw new Error('Scan not supported'); // ❌
  }

  fax(document: string): void {
    throw new Error('Fax not supported'); // ❌
  }
}
```

**✅ Хорошо — интерфейсы разделены:**

```typescript
interface Printer {
  print(document: string): void;
}

interface Scanner {
  scan(document: string): void;
}

interface FaxMachine {
  fax(document: string): void;
}

class SimplePrinter implements Printer {
  print(document: string): void {
    console.log('Printing:', document);
  }
}

class MultiFunctionPrinter implements Printer, Scanner, FaxMachine {
  print(document: string): void {
    console.log('Printing:', document);
  }

  scan(document: string): void {
    console.log('Scanning:', document);
  }

  fax(document: string): void {
    console.log('Faxing:', document);
  }
}
```

**Когда применять:**

- Когда интерфейс слишком большой
- Когда классы вынуждены реализовывать ненужные методы

#### D - Dependency Inversion Principle (Принцип инверсии зависимостей)

**Определение:** Модули высокого уровня не должны зависеть от модулей низкого уровня. Оба должны зависеть от абстракций. Бизнес-логика не должна зависеть от деталей реализации (БД, API). Используйте интерфейсы.

**❌ Плохо — `UserService` жёстко привязан к конкретной БД:**

```typescript
class MySQLDatabase {
  save(data: string): void {
    console.log('Saving to MySQL:', data);
  }
}

class UserService {
  private db = new MySQLDatabase(); // ❌ Жёсткая зависимость

  saveUser(user: string): void {
    this.db.save(user);
  }
}

// Если нужно переключиться на PostgreSQL — придётся менять UserService
```

**✅ Хорошо — зависимость от абстракции:**

```typescript
interface Database {
  save(data: string): void;
}

class MySQLDatabase implements Database {
  save(data: string): void {
    console.log('Saving to MySQL:', data);
  }
}

class PostgreSQLDatabase implements Database {
  save(data: string): void {
    console.log('Saving to PostgreSQL:', data);
  }
}

class UserService {
  constructor(private db: Database) {} // ✅ Зависимость от абстракции

  saveUser(user: string): void {
    this.db.save(user);
  }
}

// Использование
const mysqlService = new UserService(new MySQLDatabase());
const postgresService = new UserService(new PostgreSQLDatabase());
```

**Когда применять:**

- Когда код зависит от конкретных реализаций
- Когда нужна гибкость в выборе реализации (БД, API, сервисы)

**Frontend/React пример без классов:**

```typescript
type FetchUser = (id: string) => Promise<User>;

const createUseUser = (fetchUser: FetchUser) => {
  return (userId: string) => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
      fetchUser(userId).then(setUser);
    }, [fetchUser, userId]);

    return user;
  };
};
```

Идея та же: hook зависит от переданной функции `fetchUser`, а не от конкретного API-клиента внутри себя. На практике часто достаточно проще: вынести API-функцию в отдельный модуль и мокать её в тестах.

### 2 KISS (Keep It Simple, Stupid)

**Определение:** Код должен быть максимально простым. Простое решение всегда лучше сложного.

**Признаки сложного кода:**

- Глубокая вложенность (больше 3 уровней)
- Длинные функции (больше 20-30 строк)
- Сложные условия
- Неочевидная логика

**❌ Плохо — сложная вложенность:**

```typescript
const processUser = (user: User | null) => {
  if (user) {
    if (user.isActive) {
      if (user.hasPermission('admin')) {
        if (user.email) {
          console.log('Admin user with email:', user.email);
        } else {
          console.log('Admin user without email');
        }
      } else {
        console.log('Regular user');
      }
    } else {
      console.log('Inactive user');
    }
  } else {
    console.log('No user');
  }
};
```

**✅ Хорошо — early return упрощает код:**

```typescript
const processUser = (user: User | null): void => {
  if (!user) {
    console.log('No user');
    return;
  }

  if (!user.isActive) {
    console.log('Inactive user');
    return;
  }

  if (!user.hasPermission('admin')) {
    console.log('Regular user');
    return;
  }

  if (!user.email) {
    console.log('Admin user without email');
    return;
  }

  console.log('Admin user with email:', user.email);
};
```

**Как упрощать код:**

1. **Early return** — выходить из функции как можно раньше
2. **Извлечение методов** — выносить сложную логику в отдельные функции
3. **Избегать глубокой вложенности** — максимум 2-3 уровня
4. **Использовать подходящие методы** — `map`, `filter`, `find`, `some`, `reduce` или `for...of`, если это читается проще

### 3 DRY (Don't Repeat Yourself)

**Определение:** Не повторяйся. Каждый фрагмент знания должен иметь единственное, недвусмысленное представление в системе.

**❌ Плохо — дублирование логики:**

```typescript
const calculatePriceWithTax = (price: number): number => {
  const tax = price * 0.2;
  return price + tax;
};

const calculateTotalPrice = (items: Array<{ price: number }>): number => {
  let total = 0;
  items.forEach((item) => {
    const tax = item.price * 0.2; // ❌ Дублирование
    total += item.price + tax;
  });
  return total;
};

const getProductPrice = (product: Product): number => {
  const tax = product.price * 0.2; // ❌ Дублирование
  return product.price + tax;
};
```

**✅ Хорошо — единый источник логики:**

```typescript
const TAX_RATE = 0.2;

const calculateTax = (price: number): number => price * TAX_RATE;

const calculatePriceWithTax = (price: number): number => price + calculateTax(price);

const calculateTotalPrice = (items: Array<{ price: number }>): number =>
  items.reduce((total, item) => total + calculatePriceWithTax(item.price), 0);

const getProductPrice = (product: Product): number => calculatePriceWithTax(product.price);
```

**Правило трёх (Rule of Three):**

- Первый раз — пишем код
- Второй раз — дублируем (пока терпимо)
- Третий раз — **рефакторим и выносим в функцию**

**Когда повторение допустимо:**

- Код похож, но выполняет **разные задачи**
- Объединение усложнит понимание
- Разные контексты использования

### 4 YAGNI (You Aren't Gonna Need It)

**Определение:** Не пишите код "на будущее" — добавляйте функциональность только когда она реально нужна.

**❌ Плохо — over-engineering:**

```typescript
// Добавляем абстракцию "на будущее", хотя сейчас только один способ оплаты
interface PaymentStrategy {
  pay(amount: number): void;
}

class CreditCardPayment implements PaymentStrategy {
  pay(amount: number): void {
    console.log('Paying with credit card:', amount);
  }
}

class PayPalPayment implements PaymentStrategy {
  pay(amount: number): void {
    console.log('Paying with PayPal:', amount);
  }
}

class CryptoPayment implements PaymentStrategy {
  pay(amount: number): void {
    console.log('Paying with crypto:', amount);
  }
}

class PaymentProcessor {
  constructor(private strategy: PaymentStrategy) {}

  processPayment(amount: number): void {
    this.strategy.pay(amount);
  }
}

// Но в реальности используется только:
const processor = new PaymentProcessor(new CreditCardPayment());
```

**✅ Хорошо — начинаем с простого:**

```typescript
// Пока нужна только оплата картой
const processPayment = (amount: number): void => {
  console.log('Paying with credit card:', amount);
};

// Когда появится второй способ — тогда и добавим абстракцию
```

**Как определить, что реально нужно:**

1. Есть ли **конкретное требование** прямо сейчас?
2. Будет ли это использоваться **в ближайшем спринте**?
3. Усложняет ли код **без явной пользы**?

**Баланс между YAGNI и расширяемостью:**

- YAGNI не значит "писать плохой код"
- Код должен быть **чистым и модульным**
- Но **не добавляйте абстракции заранее**

### 5 Separation of Concerns (Разделение ответственности)

**Определение:** Разделяйте код по ответственности: логика отображения, бизнес-логика и данные должны быть отдельно.

**Уровни разделения:**

1. **UI (View)** — отображение
2. **Logic (Business Logic)** — бизнес-логика
3. **Data (Model/Repository)** — работа с данными

**❌ Плохо — всё в одном компоненте:**

```typescript
const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/user')
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setLoading(false);
      });
  }, []);

  const isAdmin = user?.role === 'admin';
  const fullName = `${user?.firstName} ${user?.lastName}`;

  return (
    <div>
      {loading && <p>Loading...</p>}
      {user && (
        <div>
          <h1>{fullName}</h1>
          {isAdmin && <span>Admin</span>}
        </div>
      )}
    </div>
  );
};
```

**✅ Хорошо — логика разделена:**

```typescript
// 1. Data Layer (API)
// isUser — type guard для проверки структуры ответа
const fetchUser = async (): Promise<User> => {
  const response = await fetch('/api/user');
  const data: unknown = await response.json();

  if (!isUser(data)) {
    throw new Error('Invalid user response');
  }

  return data;
};

// 2. Business Logic (Hook)
const useUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchUser().then(data => {
      setUser(data);
      setLoading(false);
    });
  }, []);

  return { user, loading };
};

// 3. Business Logic (Utils)
const getUserFullName = (user: User): string =>
  `${user.firstName} ${user.lastName}`;

const isUserAdmin = (user: User): boolean =>
  user.role === 'admin';

// 4. UI Layer (Component)
const UserProfile = () => {
  const { user, loading } = useUser();

  if (loading) return <p>Loading...</p>;
  if (!user) return null;

  return (
    <div>
      <h1>{getUserFullName(user)}</h1>
      {isUserAdmin(user) && <span>Admin</span>}
    </div>
  );
};
```

### 6 Composition over Inheritance (Композиция вместо наследования)

**Определение:** Предпочитайте композицию (объединение поведений) наследованию.

**Проблемы глубокого наследования:**

- Жёсткая связь между классами
- Сложно изменить поведение
- Проблема "diamond problem"
- Нарушение LSP

**❌ Плохо — жёсткая иерархия:**

```typescript
class Animal {
  eat() {
    console.log('Eating');
  }
}

class FlyingAnimal extends Animal {
  fly() {
    console.log('Flying');
  }
}

class SwimmingAnimal extends Animal {
  swim() {
    console.log('Swimming');
  }
}

// Проблема: что делать с уткой, которая умеет И летать, И плавать? ❌
```

**✅ Хорошо — композиция:**

```typescript
// Behaviour objects
const canFly = {
  fly() {
    console.log('Flying');
  },
};

const canSwim = {
  swim() {
    console.log('Swimming');
  },
};

const canWalk = {
  walk() {
    console.log('Walking');
  },
};

// Compose behaviours
const createDuck = (name: string) => ({
  name,
  ...canFly,
  ...canSwim,
  ...canWalk,
});

const createFish = (name: string) => ({
  name,
  ...canSwim,
});

const duck = createDuck('Donald');
duck.fly(); // Flying
duck.swim(); // Swimming
duck.walk(); // Walking
```

### 7 Fail Fast (Быстрый отказ)

**Определение:** Проверяйте ошибки в начале функции и сразу выбрасывайте исключение.

**❌ Плохо — проверка в конце:**

```typescript
const processOrder = (order: Order) => {
  // Долгие вычисления...
  const total = calculateTotal(order.items);
  const shipping = calculateShipping(order.address);
  const tax = calculateTax(total);

  // Проверка только в конце ❌
  if (!order.items.length) {
    throw new Error('Order is empty');
  }

  return total + shipping + tax;
};
```

**✅ Хорошо — Guard clauses в начале:**

```typescript
const processOrder = (order: Order): number => {
  // Проверки в начале ✅
  if (!order) {
    throw new Error('Order is required');
  }

  if (!order.items || order.items.length === 0) {
    throw new Error('Order must contain at least one item');
  }

  if (!order.address) {
    throw new Error('Shipping address is required');
  }

  // Основная логика
  const total = calculateTotal(order.items);
  const shipping = calculateShipping(order.address);
  const tax = calculateTax(total);

  return total + shipping + tax;
};
```

**Практики Fail Fast:**

1. **Guard clauses** — проверки на входе
2. **Валидация параметров** — сразу после получения
3. **Ранний return** — выходим при ошибке
4. **Явные исключения** — throw с понятным сообщением
