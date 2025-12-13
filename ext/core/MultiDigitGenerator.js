// ext/core/MultiDigitGenerator.js - Генератор многозначных примеров
//
// Поддерживает:
// - UnifiedSimpleRule (Просто)
// - BrothersRule (Братья - через 5)
// - FriendsRule (Друзья - через 10) - С ПЕРЕНОСАМИ!

/**
 * MultiDigitGenerator - класс-обёртка для генерации многозначных примеров.
 * 
 * Принимает любое правило (SimpleRule, BrothersRule, FriendsRule...) и применяет
 * его к каждому разряду, формируя многозначные числа.
 * 
 * КЛЮЧЕВЫЕ ОСОБЕННОСТИ:
 * 1. Каждый разряд живёт по правилам базового правила (физика абакуса)
 * 2. Использует ВЫБРАННЫЕ в настройках цифры (selectedDigits из config)
 * 3. Поддержка переменной разрядности (+389-27+164)
 * 4. 🆕 Для FriendsRule: обработка ПЕРЕНОСОВ между разрядами!
 * 
 * РЕЖИМЫ РАБОТЫ:
 * 
 * Для всех правил (Просто, Братья, Друзья):
 *   - Каждый шаг = многозначное число (+21, -34, +89)
 *   - Цифры генерируются для каждого разряда
 *   - Для Друзей: автоматические переносы при переходе через 10
 * 
 * ОГРАНИЧЕНИЯ:
 *   - Круглые числа (+10, +20...): вероятность 15%, макс 1 на пример
 *   - Ответы могут быть любой разрядности, но не превышают выбранную
 */

export class MultiDigitGenerator {
  /**
   * @param {Class} RuleClass - класс правила (UnifiedSimpleRule, BrothersRule, FriendsRule)
   * @param {number} maxDigitCount - максимальное количество разрядов (2-9)
   * @param {Object} config - конфигурация
   */
  constructor(RuleClass, maxDigitCount, config = {}) {
    // Создаём экземпляр базового правила с теми же настройками
    this.baseRule = new RuleClass(config);
    
    // 🆕 Определяем тип правила для специальной обработки
    this.isFriendsRule = RuleClass.name === 'FriendsRule' || this.baseRule.name === 'Друзья';
    this.isBrothersRule = RuleClass.name === 'BrothersRule' || this.baseRule.name === 'Братья';
    
    // ВАЖНО: Количество разрядов в ПРИМЕРЕ (что показываем пользователю)
    this.displayDigitCount = Math.max(1, Math.min(9, maxDigitCount));
    
    // ВАЖНО: Абакус всегда на 1 разряд БОЛЬШЕ для переноса!
    this.maxDigitCount = this.displayDigitCount + 1;
    
    console.log(`📊 Разрядность: пример=${this.displayDigitCount}, абакус=${this.maxDigitCount}`);
    
    this.config = {
      ...config,
      maxDigitCount: this.maxDigitCount,
      
      // Режим переменной разрядности (переключатель в UI)
      variableDigitCounts: config.variableDigitCounts ?? false,
      
      // Вероятность повторяющихся цифр (+22, +33) - редко!
      duplicateDigitProbability: 0.1,
      
      // Максимум нулевых разрядов в примере
      maxZeroDigits: 1,
      
      // 🆕 КРУГЛЫЕ ЧИСЛА (+10, +20, -30...):
      // Вероятность генерации круглого числа - 15%
      roundNumberProbability: 0.15,
      // Максимум 1 круглое число на весь пример
      maxRoundNumbersPerExample: 1,
      
      // Счётчики
      _duplicatesUsed: 0,
      _zeroDigitsUsed: 0,
      _roundNumbersUsed: 0
    };
    
    // Имя для логов
    const ruleType = this.isFriendsRule ? 'Friends' : (this.isBrothersRule ? 'Brothers' : 'Simple');
    this.name = `${this.baseRule.name} (Multi-Digit ${this.displayDigitCount}, ${ruleType})`;
    
    const selectedDigits = this.baseRule.config?.selectedDigits || [];
    
    console.log(`🔢 MultiDigitGenerator создан:
  Базовое правило: ${this.baseRule.name}
  Тип: ${ruleType}
  Разрядность примера: ${this.displayDigitCount}
  Разрядность абакуса: ${this.maxDigitCount} (+1 для переноса)
  Выбранные цифры: [${selectedDigits.join(', ')}]
  Переменная разрядность: ${this.config.variableDigitCounts}
  🆕 Режим Friends (с переносами): ${this.isFriendsRule}`);
  }

  /**
   * Генерирует начальное состояние - массив нулей
   */
  generateStartState() {
    return Array(this.maxDigitCount).fill(0);
  }

  /**
   * Генерирует количество шагов
   */
  generateStepsCount() {
    return this.baseRule.generateStepsCount();
  }

  /**
   * Главный метод генерации примера
   */
  generateExample() {
    // 🆕 Для FriendsRule используем специальную логику с переносами
    if (this.isFriendsRule) {
      return this._generateFriendsExample();
    }
    
    // Для Простой и Братья - стандартная логика
    return this._generateStandardExample();
  }

  /**
   * 🆕 Генерация примера для FriendsRule (с переносами!)
   * 
   * Генерирует МНОГОЗНАЧНЫЕ числа (+23, -45), где в каждом разряде
   * может применяться правило Friends с переносом.
   */
  _generateFriendsExample() {
    let states = this.generateStartState();
    const stepsCount = this.generateStepsCount();
    const steps = [];
    
    console.log(`🤝 Генерация Friends примера: ${stepsCount} шагов, ${this.displayDigitCount} разрядов`);
    
    // Сбрасываем все счётчики
    this.config._duplicatesUsed = 0;
    this.config._zeroDigitsUsed = 0;
    this.config._roundNumbersUsed = 0;
    
    let attempts = 0;
    const maxAttempts = 1000;
    let friendStepsCount = 0; // Счётчик шагов с хотя бы одним Friend-переходом
    
    while (steps.length < stepsCount && attempts < maxAttempts) {
      attempts++;
      const isFirst = steps.length === 0;
      
      // Генерируем МНОГОЗНАЧНОЕ число
      const result = this._generateFriendsMultiDigitAction(states, isFirst, steps);
      
      if (!result) {
        if (attempts % 100 === 0) {
          console.warn(`⚠️ Попытка ${attempts}: не удалось сгенерировать шаг`);
        }
        continue;
      }
      
      const { value, sign, digits, hasFriend, friendPositions } = result;
      
      // Применяем действие к состояниям С УЧЁТОМ ПЕРЕНОСОВ
      const newStates = this._applyFriendsDigits(states, result);
      
      if (!newStates) {
        continue;
      }
      
      // Проверяем валидность состояний
      let valid = true;
      for (let i = 0; i < this.displayDigitCount; i++) {
        if (newStates[i] < 0 || newStates[i] > 9) {
          valid = false;
          break;
        }
      }
      
      if (!valid) {
        continue;
      }
      
      // Проверка круглых чисел
      if (this._isRoundNumber(value)) {
        if (this.config._roundNumbersUsed >= this.config.maxRoundNumbersPerExample) {
          continue;
        }
        if (Math.random() > this.config.roundNumberProbability) {
          continue;
        }
        this.config._roundNumbersUsed++;
      }
      
      if (hasFriend) {
        friendStepsCount++;
      }
      
      const displayValue = sign * value;
      
      steps.push({
        action: displayValue,
        states: [...newStates],
        digits: digits,
        hasFriend: hasFriend,
        friendPositions: friendPositions
      });
      
      states = newStates;
      
      const signStr = displayValue >= 0 ? '+' : '';
      console.log(`  ✅ Шаг ${steps.length}/${stepsCount}: ${signStr}${displayValue}${hasFriend ? ' (FRIEND!)' : ''}, состояния: [${states.slice(0, this.displayDigitCount).join(', ')}]`);
    }
    
    // Валидация: должен быть хотя бы один Friend-шаг!
    if (friendStepsCount === 0 && attempts < maxAttempts - 100) {
      console.warn(`⚠️ Пример не содержит Friend-шагов! Перегенерация...`);
      return this._generateFriendsExample();
    }
    
    console.log(`✅ Friends пример готов: ${steps.length} шагов, ${friendStepsCount} с Friend-переходами`);
    
    return {
      start: this.generateStartState(),
      steps,
      answer: [...states]
    };
  }

  /**
   * 🆕 Генерирует многозначное число для FriendsRule
   * Возвращает объект с информацией о Friend-переходах в каждом разряде
   */
  _generateFriendsMultiDigitAction(states, isFirst, previousSteps) {
    const maxAttempts = 50;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Собираем доступные действия для каждого разряда
      const actionsPerPosition = [];
      
      for (let pos = 0; pos < this.displayDigitCount; pos++) {
        const currentState = states[pos];
        const isFirstForDigit = isFirst && (pos === this.displayDigitCount - 1); // Только старший разряд
        
        // Для FriendsRule передаём fullState!
        const availableActions = this.baseRule.getAvailableActions(
          currentState,
          isFirstForDigit || currentState === 0,
          pos,
          states,
          previousSteps
        );
        
        if (!availableActions || availableActions.length === 0) {
          actionsPerPosition[pos] = [{ value: 0, isFriend: false }];
        } else {
          actionsPerPosition[pos] = availableActions.map(a => {
            if (typeof a === 'object') {
              return a;
            }
            return { value: a, isFriend: false };
          });
        }
      }
      
      // Определяем возможные знаки
      const possibleSigns = new Set();
      for (const actions of actionsPerPosition) {
        for (const action of actions) {
          const val = action.value ?? action;
          if (val > 0) possibleSigns.add(1);
          if (val < 0) possibleSigns.add(-1);
        }
      }
      
      if (possibleSigns.size === 0) continue;
      
      // Выбираем знак с учётом баланса
      const signs = Array.from(possibleSigns);
      const usedStates = states.slice(0, this.displayDigitCount);
      const avgState = usedStates.reduce((sum, s) => sum + s, 0) / this.displayDigitCount;
      
      // Приоритизация знака
      if (avgState >= 7 && possibleSigns.has(-1)) {
        signs.sort((a, b) => a - b); // Минус первым
      } else if (avgState <= 2 && possibleSigns.has(1) && !isFirst) {
        signs.sort((a, b) => b - a); // Плюс первым
      } else {
        // Случайный порядок
        for (let i = signs.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [signs[i], signs[j]] = [signs[j], signs[i]];
        }
      }
      
      for (const targetSign of signs) {
        const digits = [];
        const friendPositions = [];
        let hasFriend = false;
        let success = true;
        
        for (let pos = 0; pos < this.displayDigitCount; pos++) {
          const actions = actionsPerPosition[pos];
          
          // Фильтруем по знаку
          let filtered = actions.filter(a => {
            const val = a.value ?? a;
            return Math.sign(val) === targetSign || val === 0;
          });
          
          if (filtered.length === 0) {
            // Нет действий нужного знака - пробуем 0
            digits[pos] = { value: 0, isFriend: false };
            continue;
          }
          
          // Для первого шага старший разряд не может быть 0 или отрицательным
          if (isFirst && pos === this.displayDigitCount - 1) {
            filtered = filtered.filter(a => (a.value ?? a) > 0);
            if (filtered.length === 0) {
              success = false;
              break;
            }
          }
          
          // Выбираем случайное действие
          const chosen = filtered[Math.floor(Math.random() * filtered.length)];
          digits[pos] = chosen;
          
          if (chosen.isFriend) {
            hasFriend = true;
            friendPositions.push(pos);
          }
        }
        
        if (!success) continue;
        
        // Проверяем что есть хоть одно ненулевое значение
        const hasNonZero = digits.some(d => (d.value ?? d) !== 0);
        if (!hasNonZero) continue;
        
        // Проверяем что старший разряд не ноль
        const highestDigit = digits[this.displayDigitCount - 1];
        if ((highestDigit.value ?? highestDigit) === 0) continue;
        
        // Считаем итоговое значение
        let value = 0;
        for (let pos = 0; pos < this.displayDigitCount; pos++) {
          const d = digits[pos].value ?? digits[pos];
          value += Math.abs(d) * Math.pow(10, pos);
        }
        
        // Проверяем что применение не нарушит границы
        const testStates = this._applyFriendsDigits(states, { digits, hasFriend });
        if (!testStates) continue;
        
        let allValid = true;
        for (let i = 0; i < this.displayDigitCount; i++) {
          if (testStates[i] < 0 || testStates[i] > 9) {
            allValid = false;
            break;
          }
        }
        if (!allValid) continue;
        
        return {
          value,
          sign: targetSign,
          digits,
          hasFriend,
          friendPositions
        };
      }
    }
    
    return null;
  }

  /**
   * 🆕 Применяет массив действий (digits) к состояниям с учётом Friend-переносов
   */
  _applyFriendsDigits(states, result) {
    const newStates = [...states];
    const digits = result.digits;
    
    for (let pos = 0; pos < this.displayDigitCount; pos++) {
      const action = digits[pos];
      
      if (!action) continue;
      
      if (typeof action === 'object' && action.isFriend && action.formula) {
        // Friend-переход с переносом
        for (const part of action.formula) {
          if (Math.abs(part.val) === 10) {
            // Перенос в следующий разряд
            const carryValue = part.op === '+' ? 1 : -1;
            const nextPos = pos + 1;
            
            if (nextPos < this.maxDigitCount) {
              newStates[nextPos] += carryValue;
            } else {
              return null; // Нет места для переноса
            }
          } else {
            // Действие в текущем разряде
            const digitValue = part.op === '+' ? part.val : -part.val;
            newStates[pos] += digitValue;
          }
        }
      } else {
        // Простое действие
        const value = action.value ?? action;
        newStates[pos] += value;
      }
    }
    
    return newStates;
  }
    
    // Валидация: должен быть хотя бы один Friend-шаг!
    if (friendStepsCount === 0) {
      console.warn(`⚠️ Пример не содержит Friend-шагов! Перегенерация...`);
      if (attempts < maxAttempts - 50) {
        return this._generateFriendsExample(); // Рекурсивная перегенерация
      }
    }
    
    console.log(`✅ Friends пример готов: ${steps.length} шагов, ${friendStepsCount} Friend-переходов`);
    
    return {
      start: this.generateStartState(),
      steps,
      answer: [...states]
    };
  }

  /**
   * Стандартная генерация (для Просто и Братья)
   */
  _generateStandardExample() {
    const states = this.generateStartState();
    const stepsCount = this.generateStepsCount();
    const steps = [];
    
    console.log(`🎯 Генерация стандартного примера: ${stepsCount} шагов, разрядов: ${this.displayDigitCount}`);
    
    // Сбрасываем все счётчики для нового примера
    this.config._duplicatesUsed = 0;
    this.config._zeroDigitsUsed = 0;
    this.config._roundNumbersUsed = 0;
    
    let attempts = 0;
    const maxTotalAttempts = 1000;
    
    while (steps.length < stepsCount && attempts < maxTotalAttempts) {
      attempts++;
      const isFirst = steps.length === 0;
      
      const multiDigitAction = this._generateMultiDigitAction(states, isFirst, steps);
      
      if (!multiDigitAction) {
        if (attempts % 50 === 0) {
          console.warn(`⚠️ Попытка ${attempts}: не удалось сгенерировать шаг ${steps.length + 1}`);
        }
        continue;
      }
      
      const newStates = [...states];
      for (let pos = 0; pos < this.displayDigitCount; pos++) {
        const digitAction = multiDigitAction.digits[pos] || 0;
        newStates[pos] += digitAction;
      }
      
      let allValid = true;
      for (let pos = 0; pos < this.displayDigitCount; pos++) {
        if (newStates[pos] < 0 || newStates[pos] > 9) {
          allValid = false;
          break;
        }
      }
      
      if (!allValid) continue;
      
      steps.push({
        action: multiDigitAction.sign * multiDigitAction.value,
        states: [...newStates],
        digits: multiDigitAction.digits
      });
      
      for (let pos = 0; pos < this.displayDigitCount; pos++) {
        states[pos] = newStates[pos];
      }
      
      console.log(`  ✅ Шаг ${steps.length}/${stepsCount}: ${multiDigitAction.sign > 0 ? '+' : ''}${multiDigitAction.value}, состояния: [${states.slice(0, this.displayDigitCount).join(', ')}]`);
    }
    
    return {
      start: this.generateStartState(),
      steps,
      answer: [...states]
    };
  }

  /**
   * Генерирует одно многозначное число (для Просто и Братья)
   */
  _generateMultiDigitAction(states, isFirst, previousSteps) {
    const maxAttempts = 100;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const digitCount = this._chooseDigitCount(isFirst);
        const result = this._generateDigits(states, digitCount, isFirst, previousSteps);
        
        if (!result) continue;
        
        if (this._validateMultiDigitAction(result, states, isFirst)) {
          return result;
        }
      } catch (error) {
        if (attempt % 20 === 0) {
          console.warn(`  Попытка ${attempt}: ${error.message}`);
        }
      }
    }
    
    return null;
  }

  /**
   * Выбирает количество разрядов для текущего числа
   */
  _chooseDigitCount(isFirst) {
    if (isFirst) {
      return this.displayDigitCount;
    }
    
    if (!this.config.variableDigitCounts) {
      return this.displayDigitCount;
    }
    
    const minDigits = Math.max(1, this.displayDigitCount - 1);
    const maxDigits = this.displayDigitCount;
    
    if (minDigits === maxDigits) {
      return maxDigits;
    }
    
    const weights = [];
    for (let i = minDigits; i <= maxDigits; i++) {
      weights.push({ count: i, weight: i });
    }
    
    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const w of weights) {
      random -= w.weight;
      if (random <= 0) {
        return w.count;
      }
    }
    
    return maxDigits;
  }

  /**
   * Генерирует цифры для каждого разряда (для Просто и Братья)
   */
  _generateDigits(states, digitCount, isFirst, previousSteps) {
    const allowDuplicates = Math.random() < this.config.duplicateDigitProbability
      && this.config._duplicatesUsed < 1;
    
    const actionsPerPosition = [];
    
    for (let pos = 0; pos < this.displayDigitCount; pos++) {
      const currentState = states[pos];
      const isFirstForDigit = (currentState === 0);
      
      // 🔧 Правильный вызов в зависимости от типа правила
      let availableActions;
      if (this.isBrothersRule) {
        availableActions = this.baseRule.getAvailableActions(
          currentState,
          isFirstForDigit,
          previousSteps
        );
      } else {
        availableActions = this.baseRule.getAvailableActions(
          currentState,
          isFirstForDigit,
          pos
        );
      }
      
      if (!availableActions || availableActions.length === 0) {
        actionsPerPosition[pos] = [];
        continue;
      }
      
      const actions = [];
      for (const action of availableActions) {
        const value = this._getActionValue(action);
        if (value !== 0) {
          actions.push(value);
        }
      }
      
      actionsPerPosition[pos] = actions;
    }
    
    const hasAnyActions = actionsPerPosition.some(arr => arr.length > 0);
    if (!hasAnyActions) {
      return null;
    }
    
    // Определяем возможные знаки
    const possibleSigns = new Set();
    for (const actions of actionsPerPosition) {
      for (const action of actions) {
        if (action > 0) possibleSigns.add(1);
        if (action < 0) possibleSigns.add(-1);
      }
    }
    
    if (possibleSigns.size === 0) {
      return null;
    }
    
    // Приоритизация знаков
    let preferredSign = null;
    const usedStates = states.slice(0, this.displayDigitCount);
    const avgState = usedStates.reduce((sum, s) => sum + s, 0) / this.displayDigitCount;
    
    if (avgState >= 7.5 && possibleSigns.has(-1)) {
      preferredSign = -1;
    } else if (avgState <= 1.5 && possibleSigns.has(1) && !isFirst) {
      preferredSign = 1;
    } else if (previousSteps.length >= 2) {
      const lastSign = Math.sign(previousSteps[previousSteps.length - 1].action);
      const prevSign = Math.sign(previousSteps[previousSteps.length - 2].action);
      if (lastSign === prevSign && lastSign !== 0) {
        preferredSign = -lastSign;
      }
    }
    
    const signs = Array.from(possibleSigns);
    if (preferredSign !== null && signs.includes(preferredSign)) {
      const index = signs.indexOf(preferredSign);
      if (index > -1) signs.splice(index, 1);
      signs.unshift(preferredSign);
    } else {
      for (let i = signs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [signs[i], signs[j]] = [signs[j], signs[i]];
      }
    }
    
    for (const targetSign of signs) {
      const digits = Array(this.maxDigitCount).fill(0);
      const usedDigits = new Set();
      let success = true;
      
      for (let pos = 0; pos < this.displayDigitCount; pos++) {
        const actions = actionsPerPosition[pos];
        if (!actions || actions.length === 0) continue;
        
        let filtered = actions.filter(a => Math.sign(a) === targetSign);
        
        if (isFirst && pos === this.displayDigitCount - 1 && filtered.length === 0 && targetSign < 0) {
          success = false;
          break;
        }
        
        if (filtered.length === 0) continue;
        
        if (!allowDuplicates) {
          const unique = filtered.filter(a => !usedDigits.has(Math.abs(a)));
          if (unique.length > 0) filtered = unique;
        }
        
        const chosen = filtered[Math.floor(Math.random() * filtered.length)];
        digits[pos] = chosen;
        usedDigits.add(Math.abs(chosen));
      }
      
      if (!success) continue;
      
      const hasNonZero = digits.some(d => d !== 0);
      if (!hasNonZero) continue;
      
      const actualDigitCount = digitCount || this.displayDigitCount;
      const highestDigit = digits[actualDigitCount - 1];
      if (highestDigit === 0) continue;
      
      let value = 0;
      let finalSign = 0;
      
      for (let pos = 0; pos < this.displayDigitCount; pos++) {
        const d = digits[pos];
        if (d !== 0) {
          value += Math.abs(d) * Math.pow(10, pos);
          if (finalSign === 0) finalSign = Math.sign(d);
        }
      }
      
      return {
        value,
        sign: finalSign,
        digits,
        digitCount,
        usedDigits: Array.from(usedDigits)
      };
    }
    
    return null;
  }

  /**
   * Валидация многозначного числа
   */
  _validateMultiDigitAction(result, states, isFirst) {
    const { digits, value } = result;
    
    if (value === 0) return false;
    
    // === ПРОВЕРКА НУЛЕВЫХ РАЗРЯДОВ ===
    const usedDigits = digits.slice(0, this.displayDigitCount);
    const zeroCount = usedDigits.filter(d => d === 0).length;
    if (zeroCount > 0 && zeroCount >= this.displayDigitCount - 1) {
      if (this.config._zeroDigitsUsed >= this.config.maxZeroDigits) {
        return false;
      }
      this.config._zeroDigitsUsed++;
    }
    
    // === 🆕 ПРОВЕРКА КРУГЛЫХ ЧИСЕЛ (+10, +20, -30...) ===
    const isRoundNumber = this._isRoundNumber(value);
    if (isRoundNumber) {
      // Уже использовали максимум круглых чисел?
      if (this.config._roundNumbersUsed >= this.config.maxRoundNumbersPerExample) {
        console.log(`  ⛔ Отклоняем круглое число ${value}: лимит исчерпан`);
        return false;
      }
      
      // Проверяем вероятность (15%)
      if (Math.random() > this.config.roundNumberProbability) {
        console.log(`  ⛔ Отклоняем круглое число ${value}: не прошло вероятность ${this.config.roundNumberProbability * 100}%`);
        return false;
      }
      
      // Принимаем круглое число
      this.config._roundNumbersUsed++;
      console.log(`  ✅ Принято круглое число ${value} (${this.config._roundNumbersUsed}/${this.config.maxRoundNumbersPerExample})`);
    }
    
    // === ПРОВЕРКА ВАЛИДНОСТИ СОСТОЯНИЙ ===
    for (let pos = 0; pos < this.displayDigitCount; pos++) {
      const newState = states[pos] + digits[pos];
      if (newState < 0 || newState > 9) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * 🆕 Проверяет, является ли число круглым (кратным 10)
   * Круглые числа: 10, 20, 30, 100, 110, 200...
   * НЕ круглые: 11, 23, 45, 101, 123...
   */
  _isRoundNumber(value) {
    const absValue = Math.abs(value);
    return absValue >= 10 && absValue % 10 === 0;
  }

  /**
   * Извлекает числовое значение из действия
   */
  _getActionValue(action) {
    if (typeof action === 'object' && action !== null) {
      return action.value ?? 0;
    }
    return action;
  }

  /**
   * Применяет действие к состоянию
   */
  applyAction(state, action) {
    // 🆕 Обработка шага с digits (из Friends и Standard генерации)
    if (typeof action === 'object' && action.digits) {
      const newState = [...state];
      
      for (let pos = 0; pos < this.displayDigitCount; pos++) {
        const digit = action.digits[pos];
        
        if (!digit) continue;
        
        // 🆕 Friends: digit может быть объектом с formula
        if (typeof digit === 'object' && digit.isFriend && digit.formula) {
          // Применяем формулу Friends с переносом
          for (const part of digit.formula) {
            if (Math.abs(part.val) === 10) {
              // Перенос
              const carryValue = part.op === '+' ? 1 : -1;
              const nextPos = pos + 1;
              if (nextPos < this.maxDigitCount) {
                newState[nextPos] += carryValue;
              }
            } else {
              // Действие в текущем разряде
              const digitValue = part.op === '+' ? part.val : -part.val;
              newState[pos] += digitValue;
            }
          }
        } else if (typeof digit === 'object') {
          // Объект с value
          newState[pos] += (digit.value ?? 0);
        } else {
          // Простое число
          newState[pos] += digit;
        }
      }
      
      return newState;
    }
    
    // Стандартная обработка числа
    const actionValue = typeof action === 'object' ? action.action : action;
    const absValue = Math.abs(actionValue);
    const sign = Math.sign(actionValue);
    const digits = this._numberToDigits(absValue);
    
    const newState = [...state];
    for (let pos = 0; pos < this.maxDigitCount; pos++) {
      newState[pos] += sign * (digits[pos] || 0);
    }
    return newState;
  }

  /**
   * Раскладывает число на разряды
   */
  _numberToDigits(num) {
    const digits = [];
    let n = Math.abs(num);
    
    for (let i = 0; i < this.maxDigitCount; i++) {
      digits.push(n % 10);
      n = Math.floor(n / 10);
    }
    
    return digits;
  }

  /**
   * Преобразует состояние в число
   */
  stateToNumber(state) {
    if (!Array.isArray(state)) return 0;
    
    let result = 0;
    for (let i = 0; i < this.displayDigitCount && i < state.length; i++) {
      result += state[i] * Math.pow(10, i);
    }
    
    return result;
  }

  /**
   * Проверяет валидность состояния
   */
  isValidState(state) {
    if (!Array.isArray(state)) return false;
    return state.every(digit => digit >= 0 && digit <= 9);
  }

  /**
   * Форматирует действие для UI
   */
  formatAction(action) {
    const value = typeof action === 'object' ? action.value : action;
    return value >= 0 ? `+${value}` : `${value}`;
  }

  /**
   * Валидация готового примера
   */
  validateExample(example) {
    const { start, steps, answer } = example;
    
    // 1. Старт должен быть массивом нулей
    if (!Array.isArray(start) || start.some(s => s !== 0)) {
      console.error('❌ MultiDigit: стартовое состояние должно быть [0,0,...]');
      return false;
    }
    
    // 2. Проверяем каждый шаг
    let currentStates = [...start];
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      // Первый шаг должен быть положительным
      if (i === 0 && step.action < 0) {
        console.error('❌ MultiDigit: первый шаг должен быть положительным');
        return false;
      }
      
      // Применяем шаг
      currentStates = this.applyAction(currentStates, step);
      
      // Проверяем валидность
      if (!this.isValidState(currentStates)) {
        console.error(`❌ MultiDigit: шаг ${i + 1} привёл к невалидному состоянию`);
        return false;
      }
    }
    
    // 3. Финальное состояние
    const finalNumber = this.stateToNumber(currentStates);
    const answerNumber = this.stateToNumber(answer);
    
    if (finalNumber !== answerNumber) {
      console.error(`❌ MultiDigit: финал ${finalNumber} ≠ ответ ${answerNumber}`);
      return false;
    }
    
    // 🆕 4. Для FriendsRule: проверяем наличие Friend-шагов
    if (this.isFriendsRule) {
      const friendSteps = steps.filter(s => s.hasFriend || s.isFriend);
      if (friendSteps.length === 0) {
        console.error('❌ MultiDigit Friends: нет шагов с формулой Friends!');
        return false;
      }
      console.log(`✅ MultiDigit Friends: ${friendSteps.length} Friend-шагов`);
    }
    
    console.log(`✅ MultiDigit: пример валиден (${steps.length} шагов, финал ${finalNumber})`);
    return true;
  }
}
