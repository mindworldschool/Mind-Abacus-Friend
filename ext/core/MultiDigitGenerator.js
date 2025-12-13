// ext/core/MultiDigitGenerator.js - Генератор многозначных примеров
//
// Поддерживает:
// - UnifiedSimpleRule (Просто)
// - BrothersRule (Братья - через 5)
// - FriendsRule (Друзья - через 10) - С ПЕРЕНОСАМИ!

/**
 * MultiDigitGenerator - класс-обёртка для генерации многозначных примеров.
 * 
 * КЛЮЧЕВЫЕ ОСОБЕННОСТИ:
 * 1. Каждый разряд живёт по правилам базового правила (физика абакуса)
 * 2. Использует ВЫБРАННЫЕ в настройках цифры (selectedDigits из config)
 * 3. Поддержка переменной разрядности (+389-27+164)
 * 4. Для FriendsRule: обработка ПЕРЕНОСОВ между разрядами!
 * 
 * ОГРАНИЧЕНИЯ:
 *   - Круглые числа (+10, +20...): вероятность 15%, макс 1 на пример
 *   - Ответы могут быть любой разрядности, но не превышают выбранную
 */

export class MultiDigitGenerator {
  constructor(RuleClass, maxDigitCount, config = {}) {
    this.baseRule = new RuleClass(config);
    
    // Определяем тип правила
    this.isFriendsRule = RuleClass.name === 'FriendsRule' || this.baseRule.name === 'Друзья';
    this.isBrothersRule = RuleClass.name === 'BrothersRule' || this.baseRule.name === 'Братья';
    this.isSimpleRule = RuleClass.name === 'UnifiedSimpleRule' || 
                        this.baseRule.name === 'Просто' || 
                        (!this.isFriendsRule && !this.isBrothersRule);
    
    // Количество разрядов
    this.displayDigitCount = Math.max(1, Math.min(9, maxDigitCount));
    this.maxDigitCount = this.displayDigitCount + 1; // +1 для переноса
    
    console.log(`📊 Разрядность: пример=${this.displayDigitCount}, абакус=${this.maxDigitCount}`);
    
    this.config = {
      ...config,
      maxDigitCount: this.maxDigitCount,
      variableDigitCounts: config.variableDigitCounts || false,
      duplicateDigitProbability: 0.1,
      maxZeroDigits: 1,
      roundNumberProbability: 0.15,
      maxRoundNumbersPerExample: 1,
      _duplicatesUsed: 0,
      _zeroDigitsUsed: 0,
      _roundNumbersUsed: 0
    };
    
    const ruleType = this.isFriendsRule ? 'Friends' : (this.isBrothersRule ? 'Brothers' : 'Simple');
    this.name = `${this.baseRule.name} (Multi-Digit ${this.displayDigitCount}, ${ruleType})`;
    
    const selectedDigits = this.baseRule.config?.selectedDigits || [];
    
    console.log(`🔢 MultiDigitGenerator создан:
  Базовое правило: ${this.baseRule.name}
  Тип: ${ruleType}
  Разрядность примера: ${this.displayDigitCount}
  Выбранные цифры: [${selectedDigits.join(', ')}]
  isFriends: ${this.isFriendsRule}, isBrothers: ${this.isBrothersRule}, isSimple: ${this.isSimpleRule}`);
  }

  generateStartState() {
    return Array(this.maxDigitCount).fill(0);
  }

  generateStepsCount() {
    return this.baseRule.generateStepsCount();
  }

  generateExample() {
    if (this.isFriendsRule) {
      return this._generateFriendsExample();
    }
    return this._generateStandardExample();
  }

  // ========== FRIENDS ГЕНЕРАЦИЯ ==========
  
  _generateFriendsExample() {
    let states = this.generateStartState();
    const stepsCount = this.generateStepsCount();
    const steps = [];
    
    console.log(`🤝 Генерация Friends примера: ${stepsCount} шагов, ${this.displayDigitCount} разрядов`);
    
    this.config._duplicatesUsed = 0;
    this.config._zeroDigitsUsed = 0;
    this.config._roundNumbersUsed = 0;
    
    let attempts = 0;
    const maxAttempts = 1000;
    let friendStepsCount = 0;
    
    while (steps.length < stepsCount && attempts < maxAttempts) {
      attempts++;
      const isFirst = steps.length === 0;
      
      const result = this._generateFriendsMultiDigitAction(states, isFirst, steps);
      
      if (!result) {
        continue;
      }
      
      const { value, sign, digits, hasFriend } = result;
      
      // Применяем действие
      const newStates = this._applyFriendsDigits(states, digits);
      
      if (!newStates) {
        continue;
      }
      
      // Проверяем валидность
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
        hasFriend: hasFriend
      });
      
      states = newStates;
      
      const signStr = displayValue >= 0 ? '+' : '';
      console.log(`  ✅ Шаг ${steps.length}/${stepsCount}: ${signStr}${displayValue}${hasFriend ? ' (FRIEND!)' : ''}`);
    }
    
    // Перегенерация если нет Friend-шагов
    if (friendStepsCount === 0 && attempts < maxAttempts - 100) {
      console.warn(`⚠️ Нет Friend-шагов! Перегенерация...`);
      return this._generateFriendsExample();
    }
    
    console.log(`✅ Friends пример готов: ${steps.length} шагов, ${friendStepsCount} Friend-переходов`);
    
    return {
      start: this.generateStartState(),
      steps,
      answer: [...states]
    };
  }

  _generateFriendsMultiDigitAction(states, isFirst, previousSteps) {
    const maxAttempts = 50;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const actionsPerPosition = [];
      
      for (let pos = 0; pos < this.displayDigitCount; pos++) {
        const currentState = states[pos];
        const isFirstForDigit = currentState === 0;
        
        const availableActions = this.baseRule.getAvailableActions(
          currentState,
          isFirstForDigit,
          pos,
          states,
          previousSteps
        );
        
        if (!availableActions || availableActions.length === 0) {
          actionsPerPosition[pos] = [{ value: 0, isFriend: false }];
        } else {
          actionsPerPosition[pos] = availableActions.map(a => {
            if (typeof a === 'object') return a;
            return { value: a, isFriend: false };
          });
        }
      }
      
      // Определяем знаки
      const possibleSigns = new Set();
      for (const actions of actionsPerPosition) {
        for (const action of actions) {
          const val = action.value !== undefined ? action.value : action;
          if (val > 0) possibleSigns.add(1);
          if (val < 0) possibleSigns.add(-1);
        }
      }
      
      if (possibleSigns.size === 0) continue;
      
      // Приоритизация знака
      const signs = Array.from(possibleSigns);
      const avgState = states.slice(0, this.displayDigitCount).reduce((s, v) => s + v, 0) / this.displayDigitCount;
      
      if (avgState >= 7 && possibleSigns.has(-1)) {
        signs.sort((a, b) => a - b);
      } else if (avgState <= 2 && possibleSigns.has(1) && !isFirst) {
        signs.sort((a, b) => b - a);
      } else {
        for (let i = signs.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [signs[i], signs[j]] = [signs[j], signs[i]];
        }
      }
      
      for (const targetSign of signs) {
        const digits = [];
        let hasFriend = false;
        let success = true;
        
        for (let pos = 0; pos < this.displayDigitCount; pos++) {
          const actions = actionsPerPosition[pos];
          
          let filtered = actions.filter(a => {
            const val = a.value !== undefined ? a.value : a;
            return Math.sign(val) === targetSign || val === 0;
          });
          
          if (filtered.length === 0) {
            digits[pos] = { value: 0, isFriend: false };
            continue;
          }
          
          // Первый шаг - старший разряд должен быть > 0
          if (isFirst && pos === this.displayDigitCount - 1) {
            filtered = filtered.filter(a => {
              const val = a.value !== undefined ? a.value : a;
              return val > 0;
            });
            if (filtered.length === 0) {
              success = false;
              break;
            }
          }
          
          const chosen = filtered[Math.floor(Math.random() * filtered.length)];
          digits[pos] = chosen;
          
          if (chosen.isFriend) {
            hasFriend = true;
          }
        }
        
        if (!success) continue;
        
        // Проверка на ненулевое значение
        const hasNonZero = digits.some(d => {
          const val = d.value !== undefined ? d.value : d;
          return val !== 0;
        });
        if (!hasNonZero) continue;
        
        // Старший разряд не ноль
        const highestVal = digits[this.displayDigitCount - 1]?.value !== undefined 
          ? digits[this.displayDigitCount - 1].value 
          : digits[this.displayDigitCount - 1];
        if (highestVal === 0) continue;
        
        // Считаем значение
        let value = 0;
        for (let pos = 0; pos < this.displayDigitCount; pos++) {
          const d = digits[pos]?.value !== undefined ? digits[pos].value : digits[pos];
          value += Math.abs(d) * Math.pow(10, pos);
        }
        
        // Тестируем применение
        const testStates = this._applyFriendsDigits(states, digits);
        if (!testStates) continue;
        
        let allValid = true;
        for (let i = 0; i < this.displayDigitCount; i++) {
          if (testStates[i] < 0 || testStates[i] > 9) {
            allValid = false;
            break;
          }
        }
        if (!allValid) continue;
        
        return { value, sign: targetSign, digits, hasFriend };
      }
    }
    
    return null;
  }

  _applyFriendsDigits(states, digits) {
    const newStates = [...states];
    
    for (let pos = 0; pos < this.displayDigitCount; pos++) {
      const action = digits[pos];
      if (!action) continue;
      
      if (typeof action === 'object' && action.isFriend && action.formula) {
        for (const part of action.formula) {
          if (Math.abs(part.val) === 10) {
            const carryValue = part.op === '+' ? 1 : -1;
            const nextPos = pos + 1;
            if (nextPos < this.maxDigitCount) {
              newStates[nextPos] += carryValue;
            } else {
              return null;
            }
          } else {
            const digitValue = part.op === '+' ? part.val : -part.val;
            newStates[pos] += digitValue;
          }
        }
      } else if (typeof action === 'object') {
        newStates[pos] += (action.value || 0);
      } else {
        newStates[pos] += action;
      }
    }
    
    return newStates;
  }

  // ========== СТАНДАРТНАЯ ГЕНЕРАЦИЯ (Просто, Братья) ==========
  
  _generateStandardExample() {
    const states = this.generateStartState();
    const stepsCount = this.generateStepsCount();
    const steps = [];
    
    console.log(`🎯 Генерация стандартного примера: ${stepsCount} шагов`);
    
    this.config._duplicatesUsed = 0;
    this.config._zeroDigitsUsed = 0;
    this.config._roundNumbersUsed = 0;
    
    let attempts = 0;
    const maxAttempts = 1000;
    
    while (steps.length < stepsCount && attempts < maxAttempts) {
      attempts++;
      const isFirst = steps.length === 0;
      
      const result = this._generateMultiDigitAction(states, isFirst, steps);
      
      if (!result) continue;
      
      const newStates = [...states];
      for (let pos = 0; pos < this.displayDigitCount; pos++) {
        newStates[pos] += (result.digits[pos] || 0);
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
        action: result.sign * result.value,
        states: [...newStates],
        digits: result.digits
      });
      
      for (let pos = 0; pos < this.displayDigitCount; pos++) {
        states[pos] = newStates[pos];
      }
      
      console.log(`  ✅ Шаг ${steps.length}: ${result.sign > 0 ? '+' : ''}${result.value}`);
    }
    
    return {
      start: this.generateStartState(),
      steps,
      answer: [...states]
    };
  }

  _generateMultiDigitAction(states, isFirst, previousSteps) {
    const maxAttempts = 100;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const digitCount = this._chooseDigitCount(isFirst);
      const result = this._generateDigits(states, digitCount, isFirst, previousSteps);
      
      if (!result) continue;
      
      if (this._validateMultiDigitAction(result, states, isFirst)) {
        return result;
      }
    }
    
    return null;
  }

  _chooseDigitCount(isFirst) {
    if (isFirst || !this.config.variableDigitCounts) {
      return this.displayDigitCount;
    }
    
    const minDigits = Math.max(1, this.displayDigitCount - 1);
    const maxDigits = this.displayDigitCount;
    
    if (minDigits === maxDigits) return maxDigits;
    
    return Math.random() < 0.7 ? maxDigits : minDigits;
  }

  _generateDigits(states, digitCount, isFirst, previousSteps) {
    const allowDuplicates = Math.random() < this.config.duplicateDigitProbability;
    
    const actionsPerPosition = [];
    
    for (let pos = 0; pos < this.displayDigitCount; pos++) {
      const currentState = states[pos];
      const isFirstForDigit = (currentState === 0);
      
      let availableActions;
      
      // Разные правила имеют разные сигнатуры getAvailableActions
      try {
        if (this.isBrothersRule) {
          // BrothersRule: (currentState, isFirst, previousSteps)
          availableActions = this.baseRule.getAvailableActions(currentState, isFirstForDigit, previousSteps);
        } else if (this.isFriendsRule) {
          // FriendsRule: (currentState, isFirst, position, fullState, previousSteps)
          availableActions = this.baseRule.getAvailableActions(currentState, isFirstForDigit, pos, states, previousSteps);
        } else {
          // UnifiedSimpleRule: (currentState, isFirst) или (currentState, isFirst, previousSteps)
          availableActions = this.baseRule.getAvailableActions(currentState, isFirstForDigit, previousSteps);
        }
      } catch (e) {
        // Fallback на простой вызов
        availableActions = this.baseRule.getAvailableActions(currentState, isFirstForDigit);
      }
      
      if (!availableActions || availableActions.length === 0) {
        actionsPerPosition[pos] = [];
        continue;
      }
      
      const actions = [];
      for (const action of availableActions) {
        const value = this._getActionValue(action);
        if (value !== 0) actions.push(value);
      }
      
      actionsPerPosition[pos] = actions;
    }
    
    const hasAnyActions = actionsPerPosition.some(arr => arr.length > 0);
    if (!hasAnyActions) return null;
    
    // Знаки
    const possibleSigns = new Set();
    for (const actions of actionsPerPosition) {
      for (const action of actions) {
        if (action > 0) possibleSigns.add(1);
        if (action < 0) possibleSigns.add(-1);
      }
    }
    
    if (possibleSigns.size === 0) return null;
    
    const signs = Array.from(possibleSigns);
    for (let i = signs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [signs[i], signs[j]] = [signs[j], signs[i]];
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
      
      if (digits[digitCount - 1] === 0) continue;
      
      let value = 0;
      let finalSign = 0;
      
      for (let pos = 0; pos < this.displayDigitCount; pos++) {
        const d = digits[pos];
        if (d !== 0) {
          value += Math.abs(d) * Math.pow(10, pos);
          if (finalSign === 0) finalSign = Math.sign(d);
        }
      }
      
      return { value, sign: finalSign, digits, digitCount };
    }
    
    return null;
  }

  _validateMultiDigitAction(result, states, isFirst) {
    const { digits, value } = result;
    
    if (value === 0) return false;
    
    // Круглые числа
    if (this._isRoundNumber(value)) {
      if (this.config._roundNumbersUsed >= this.config.maxRoundNumbersPerExample) {
        return false;
      }
      if (Math.random() > this.config.roundNumberProbability) {
        return false;
      }
      this.config._roundNumbersUsed++;
    }
    
    // Валидность состояний
    for (let pos = 0; pos < this.displayDigitCount; pos++) {
      const newState = states[pos] + digits[pos];
      if (newState < 0 || newState > 9) {
        return false;
      }
    }
    
    return true;
  }

  _isRoundNumber(value) {
    const absValue = Math.abs(value);
    return absValue >= 10 && absValue % 10 === 0;
  }

  _getActionValue(action) {
    if (typeof action === 'object' && action !== null) {
      return action.value !== undefined ? action.value : 0;
    }
    return action;
  }

  // ========== ОБЩИЕ МЕТОДЫ ==========

  applyAction(state, action) {
    if (typeof action === 'object' && action.digits) {
      const newState = [...state];
      
      for (let pos = 0; pos < this.displayDigitCount; pos++) {
        const digit = action.digits[pos];
        if (!digit) continue;
        
        if (typeof digit === 'object' && digit.isFriend && digit.formula) {
          for (const part of digit.formula) {
            if (Math.abs(part.val) === 10) {
              const carryValue = part.op === '+' ? 1 : -1;
              const nextPos = pos + 1;
              if (nextPos < this.maxDigitCount) {
                newState[nextPos] += carryValue;
              }
            } else {
              const digitValue = part.op === '+' ? part.val : -part.val;
              newState[pos] += digitValue;
            }
          }
        } else if (typeof digit === 'object') {
          newState[pos] += (digit.value || 0);
        } else {
          newState[pos] += digit;
        }
      }
      
      return newState;
    }
    
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

  _numberToDigits(num) {
    const digits = [];
    let n = Math.abs(num);
    
    for (let i = 0; i < this.maxDigitCount; i++) {
      digits.push(n % 10);
      n = Math.floor(n / 10);
    }
    
    return digits;
  }

  stateToNumber(state) {
    if (!Array.isArray(state)) return 0;
    
    let result = 0;
    for (let i = 0; i < this.displayDigitCount && i < state.length; i++) {
      result += state[i] * Math.pow(10, i);
    }
    
    return result;
  }

  isValidState(state) {
    if (!Array.isArray(state)) return false;
    return state.every(digit => digit >= 0 && digit <= 9);
  }

  formatAction(action) {
    const value = typeof action === 'object' ? action.value : action;
    return value >= 0 ? `+${value}` : `${value}`;
  }

  validateExample(example) {
    const { start, steps, answer } = example;
    
    if (!Array.isArray(start) || start.some(s => s !== 0)) {
      console.error('❌ MultiDigit: стартовое состояние должно быть [0,0,...]');
      return false;
    }
    
    let currentStates = [...start];
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      if (i === 0 && step.action < 0) {
        console.error('❌ MultiDigit: первый шаг должен быть положительным');
        return false;
      }
      
      currentStates = this.applyAction(currentStates, step);
      
      if (!this.isValidState(currentStates)) {
        console.error(`❌ MultiDigit: шаг ${i + 1} невалиден`);
        return false;
      }
    }
    
    const finalNumber = this.stateToNumber(currentStates);
    const answerNumber = this.stateToNumber(answer);
    
    if (finalNumber !== answerNumber) {
      console.error(`❌ MultiDigit: финал ${finalNumber} ≠ ответ ${answerNumber}`);
      return false;
    }
    
    if (this.isFriendsRule) {
      const friendSteps = steps.filter(s => s.hasFriend);
      if (friendSteps.length === 0) {
        console.error('❌ MultiDigit Friends: нет Friend-шагов!');
        return false;
      }
    }
    
    console.log(`✅ MultiDigit: пример валиден`);
    return true;
  }
}
