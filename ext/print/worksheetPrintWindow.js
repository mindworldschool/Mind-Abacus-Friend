// ext/print/worksheetPrintWindow.js
//
// Открывает новое окно с разметкой листа примеров для печати в виде таблицы.
// Использует данные из ext/print/worksheetGenerator.js → getCurrentWorksheet().
//
// Структура на листе:
//   - шапка с логотипом и полями Name / Date / Group / Level;
//   - таблица с 5 столбцами + 1 левый столбец для нумерации строк;
//   - верхняя строка таблицы: номера примеров (1-5) жирным, серый фон;
//   - левая колонка: нумерация строк (1, 2, 3...) сверху вниз;
//   - количество строк динамическое, зависит от settings.actions.count;
//   - 2 пустые строки для ответа;
//   - отдельная таблица ответов: только номера примеров и одна строка для ответа.

import { t, getCurrentLanguage } from "../../core/i18n.js";
import { getCurrentWorksheet } from "./worksheetGenerator.js";
import { state } from "../../core/state.js";

const EXAMPLES_PER_TABLE = 5; // 5 примеров на таблицу

/**
 * Открыть окно с листом примеров для печати.
 *
 * @param {Object} [options]
 * @param {boolean} [options.autoPrint=true]  - сразу вызвать print() после загрузки
 */
export function openWorksheetPrintWindow(options = {}) {
  const { autoPrint = true } = options;

  // ✅ ВСЕГДА генерируем свежий worksheet для печати
  // Это гарантирует что используются актуальные данные
  console.log('[Print] Генерация свежего worksheet для печати...');

  const worksheet = getCurrentWorksheet();

  if (!worksheet || !Array.isArray(worksheet.examples) || worksheet.examples.length === 0) {
    alert(t("printSheet.emptyWorksheet"));
    return;
  }

  console.log('[Print] Worksheet загружен:', {
    version: worksheet.version,
    examplesCount: worksheet.examples.length,
    firstExampleSteps: worksheet.examples[0]?.steps?.length
  });

  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    alert(t("printSheet.popupBlocked"));
    return;
  }

  const { examples, showAnswers, settings } = worksheet;

  // Получаем количество действий из настроек (для совместимости)
  const settingsActionsCount = getActionsCount(settings);

  // Вычисляем РЕАЛЬНОЕ максимальное количество шагов из всех примеров
  const actualMaxSteps = Math.max(
    ...examples.map(ex => ex.steps ? ex.steps.length : 0),
    settingsActionsCount  // Используем настройки как минимум
  );

  // Используем реальное количество шагов для генерации таблиц
  const actionsCount = actualMaxSteps;

  const language = getCurrentLanguage();
  const mode = state.settings.mode || "abacus";
  const texts = getPrintTexts(mode);

  // Получаем абсолютный URL для лого
  const logoUrl = new URL("../../assets/logo.png", import.meta.url).href;
  const totalExamples = examples.length;
  const worksheetPages = chunkExamples(examples, EXAMPLES_PER_TABLE);

  const doc = printWindow.document;

  // --- Базовый HTML-каркас
  doc.write(`<!DOCTYPE html>
<html lang="${escapeHtml(language)}">
<head>
  <meta charset="UTF-8" />
  <title> </title>
  <style>
    /* Параметры страницы для PDF-печати */
    @page {
      size: A4 portrait;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      font-family: Arial, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 11pt;
      color: #222;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }

    .page {
      width: 210mm;
      background: white;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      padding: 10mm 10mm;
      margin-bottom: 10mm;
    }

    .page.page-break {
      page-break-before: always;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 4mm;
      padding-bottom: 2mm;
    }

    .page-header__left {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 8mm;
      flex: 1;
    }

    .page-header__logo {
      display: flex;
      align-items: center;
    }

    .page-header__logo img {
      height: 40px;
      width: auto;
    }

    .page-header__title {
      display: flex;
      flex-direction: column;
      gap: 1mm;
    }

    .page-title-main {
      font-size: 14pt;
      font-weight: 600;
    }

    .page-title-sub {
      font-size: 9pt;
      color: #666;
    }

    .page-header__fields {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2mm;
      font-size: 9pt;
      min-width: 72mm;
      margin-left: 8mm;
    }

    .field-row {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 2mm;
      align-items: center;
    }

    .field-label {
      white-space: nowrap;
      font-weight: 500;
    }

    .field-line {
      border-bottom: 1px solid #999;
      height: 5mm;
    }

    /* Таблица примеров */
    .examples-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 5mm;
      font-family: Arial, sans-serif;
      page-break-inside: avoid;
      table-layout: fixed;
    }

    .examples-table th,
    .examples-table td {
      border: 1px solid #333;
      padding: 6px 4px;
      text-align: center;
      vertical-align: middle;
      height: 32px;
    }

    /* Левый столбец для нумерации строк */
    .examples-table__row-header {
      background: #e0e0e0;
      font-weight: 600;
      width: 30px;
      min-width: 30px;
    }

    /* Верхняя строка с номерами примеров */
    .examples-table__col-header {
      background: #e0e0e0;
      font-weight: 700;
      font-size: 13pt;
      min-width: 80px;
    }

    /* Ячейки с нумерацией строк */
    .examples-table__row-no {
      background: #f5f5f5;
      font-weight: 500;
      font-size: 10pt;
      width: 30px;
      min-width: 30px;
    }

    /* Ячейки с числами примеров */
    .examples-table__cell {
      font-size: 13pt;
      font-weight: 600;
      line-height: 1.1;
    }

    /* Пустые ячейки для ответов */
    .examples-table__answer-cell {
      background: white;
    }

    /* Таблица ответов */
    .answers-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10mm;
      font-family: Arial, sans-serif;
      page-break-inside: avoid;
      table-layout: fixed;
    }

    .answers-table th,
    .answers-table td {
      border: 1px solid #333;
      padding: 10px 6px;
      text-align: center;
      vertical-align: middle;
    }

    .answers-table__col-header {
      background: #e0e0e0;
      font-weight: 700;
      font-size: 16pt;
      padding: 10px;
    }

    .answers-table__answer-cell {
      background: white;
      min-height: 50px;
      padding: 15px 6px;
      font-size: 14pt;
      font-weight: 600;
    }

    .answers-table__row-header--empty {
      background: #e0e0e0;
      width: 30px;
      min-width: 30px;
    }

    .page-break {
      page-break-before: always;
    }

    @media print {
      @page {
        size: A4;
        margin: 0;
      }

      body {
        margin: 0;
        padding: 0;
        background: white;
      }

      .page {
        width: 100%;
        min-height: auto;
        box-shadow: none;
        margin: 0;
        padding: 10mm 10mm;
      }

      .page.page-break {
        page-break-before: always;
      }

      .examples-table__col-header {
        font-size: 12pt;
      }

      .examples-table__cell {
        font-size: 12pt;
      }

      .answers-table__col-header {
        font-size: 12pt;
      }
    }
  </style>
</head>
<body>
`);

  // Генерируем таблицы примеров
  // Определяем, сколько таблиц можно разместить на одном листе
  // Если действий мало (≤ 10), помещаем 2 таблицы на лист, иначе - по 1 таблице
  const tablesPerPage = actionsCount <= 10 ? 2 : 1;

  // Группируем таблицы по страницам
  for (let groupIndex = 0; groupIndex < worksheetPages.length; groupIndex += tablesPerPage) {
    const isFirstGroup = groupIndex === 0;
    const tablesInGroup = worksheetPages.slice(groupIndex, groupIndex + tablesPerPage);

    // Открываем контейнер страницы и добавляем шапку
    doc.write(`
      <div class="page${!isFirstGroup ? ' page-break' : ''}">
        <div class="page-header">
          <div class="page-header__left">
            <div class="page-header__logo">
              <img src="${logoUrl}" alt="MindWorld School" />
            </div>
            <div class="page-header__title">
              <span class="page-title-main">${escapeHtml(texts.title)}</span>
              <span class="page-title-sub">${escapeHtml(texts.subtitle)}</span>
            </div>
          </div>

          <div class="page-header__fields">
            <div class="field-row">
              <span class="field-label">${escapeHtml(texts.fieldName)}</span>
              <span class="field-line"></span>
            </div>
            <div class="field-row">
              <span class="field-label">${escapeHtml(texts.fieldDate)}</span>
              <span class="field-line"></span>
            </div>
          </div>
        </div>
    `);

    // Генерируем таблицы для этой группы
    tablesInGroup.forEach((pageExamples) => {
      // Вычисляем РЕАЛЬНОЕ максимальное количество шагов из примеров на этой странице
      const maxStepsOnPage = Math.max(
        ...pageExamples.filter(ex => ex).map(ex => ex.steps ? ex.steps.length : 0),
        actionsCount  // Используем actionsCount как минимум
      );

      doc.write(`
        <table class="examples-table">
          <thead>
            <tr>
              <th class="examples-table__row-header"></th>
      `);

      // Заголовки столбцов (номера примеров) - всегда 5 столбцов
      for (let col = 0; col < EXAMPLES_PER_TABLE; col++) {
        const ex = pageExamples[col];
        if (ex) {
          doc.write(`<th class="examples-table__col-header">${ex.index}</th>`);
        } else {
          doc.write(`<th class="examples-table__col-header"></th>`);
        }
      }

      doc.write(`
            </tr>
          </thead>
          <tbody>
      `);

      // Строки с числами (используем РЕАЛЬНОЕ количество шагов)
      for (let row = 0; row < maxStepsOnPage; row++) {
        doc.write(`<tr>`);

        // Номер строки в левой колонке
        doc.write(`<td class="examples-table__row-no">${row + 1}</td>`);

        // Ячейки с числами для каждого примера - всегда 5 столбцов
        for (let col = 0; col < EXAMPLES_PER_TABLE; col++) {
          const ex = pageExamples[col];
          const stepData = ex && ex.steps && ex.steps[row];

          // ✅ Используем функцию formatStepForPrint для поддержки Simple, Brothers и Friends
          const step = formatStepForPrint(stepData);

          // 🐛 ВРЕМЕННАЯ ОТЛАДКА: показываем тип данных прямо в ячейке
          let debugInfo = '';
          if (row === 0 && col === 0) {
            const type = typeof stepData;
            const hasStep = stepData && typeof stepData === 'object' ? stepData.step : 'no';
            debugInfo = `<br><small style="color:red;">type:${type} step:${hasStep}</small>`;
          }

          doc.write(`<td class="examples-table__cell">${escapeHtml(step)}${debugInfo}</td>`);
        }

        doc.write(`</tr>`);
      }

      // Две пустые строки для ответов - всегда 5 столбцов
      for (let i = 0; i < 2; i++) {
        doc.write(`<tr>`);
        doc.write(`<td class="examples-table__row-no"></td>`);

        for (let col = 0; col < EXAMPLES_PER_TABLE; col++) {
          doc.write(`<td class="examples-table__answer-cell"></td>`);
        }

        doc.write(`</tr>`);
      }

      doc.write(`
          </tbody>
        </table>
      `);
    });

    // Закрываем контейнер страницы
    doc.write(`
      </div>
    `);
  }

  // Таблица ответов (если включено)
  if (showAnswers) {
    // Для ответов стараемся разместить все таблицы на одном листе
    // Только если таблиц очень много (больше 6), разбиваем на листы по 6 таблиц
    const answersTablesPerPage = 6;

    for (let groupIndex = 0; groupIndex < worksheetPages.length; groupIndex += answersTablesPerPage) {
      const tablesInGroup = worksheetPages.slice(groupIndex, groupIndex + answersTablesPerPage);

      // Открываем контейнер страницы для ответов и добавляем шапку
      doc.write(`
        <div class="page page-break">
          <div class="page-header">
            <div class="page-header__left">
              <div class="page-header__logo">
                <img src="${logoUrl}" alt="MindWorld School" />
              </div>
              <div class="page-header__title">
                <span class="page-title-main">${escapeHtml(texts.answersTitle)}</span>
                <span class="page-title-sub">${escapeHtml(texts.answersSubtitle)}</span>
              </div>
            </div>

            <div class="page-header__fields">
              <div class="field-row">
                <span class="field-label">${escapeHtml(texts.fieldName)}</span>
                <span class="field-line"></span>
              </div>
              <div class="field-row">
                <span class="field-label">${escapeHtml(texts.fieldDate)}</span>
                <span class="field-line"></span>
              </div>
            </div>
          </div>
      `);

      // Генерируем таблицы с ответами для этой группы
      tablesInGroup.forEach((pageExamples) => {
        doc.write(`
          <table class="answers-table">
            <thead>
              <tr>
        `);

        // Заголовки с номерами примеров - всегда 5 столбцов
        for (let col = 0; col < EXAMPLES_PER_TABLE; col++) {
          const ex = pageExamples[col];
          if (ex) {
            doc.write(`<th class="answers-table__col-header">${ex.index}</th>`);
          } else {
            doc.write(`<th class="answers-table__col-header"></th>`);
          }
        }

        doc.write(`
              </tr>
            </thead>
            <tbody>
              <tr>
        `);

        // Ячейки с ответами - всегда 5 столбцов
        for (let col = 0; col < EXAMPLES_PER_TABLE; col++) {
          const ex = pageExamples[col];
          if (ex) {
            doc.write(`<td class="answers-table__answer-cell">${safeNumber(ex.answer)}</td>`);
          } else {
            doc.write(`<td class="answers-table__answer-cell"></td>`);
          }
        }

        doc.write(`
              </tr>
            </tbody>
          </table>
        `);
      });

      // Закрываем контейнер страницы ответов
      doc.write(`
        </div>
      `);
    }
  }

  doc.write(`
</body>
</html>
`);
  doc.close();

  // Небольшая задержка, чтобы браузер успел отрисовать, затем auto-print
  if (autoPrint) {
    printWindow.focus();
    printWindow.setTimeout(() => {
      printWindow.print();
    }, 100);
  }
}

/**
 * Получить количество действий из настроек
 */
function getActionsCount(settings) {
  if (settings && settings.actions && typeof settings.actions.count === 'number') {
    return settings.actions.count;
  }
  return 5; // По умолчанию 5 действий
}

function getPrintTexts(mode) {
  const modeText = mode === "mental"
    ? t("printSheet.modeMental")
    : t("printSheet.modeAbacus");

  return {
    title: `${t("printSheet.title")} (${modeText})`,
    subtitle: t("printSheet.subtitle"),
    answersTitle: `${t("printSheet.answersTitle")} (${modeText})`,
    answersSubtitle: t("printSheet.answersSubtitle"),
    fieldName: t("printSheet.fieldName"),
    fieldDate: t("printSheet.fieldDate"),
    fieldGroup: t("printSheet.fieldGroup"),
    fieldLevel: t("printSheet.fieldLevel")
  };
}

function chunkExamples(list, size) {
  const pages = [];

  for (let i = 0; i < list.length; i += size) {
    pages.push(list.slice(i, i + size));
  }

  return pages;
}

/**
 * Защита от XSS — экранируем спецсимволы в строках.
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Корректно отображаем числа, даже если прилетела строка/NaN.
 */
function safeNumber(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";
  return String(num);
}

/**
 * Форматирует шаг для печати, поддерживая Simple, Brothers и Friends.
 * ✅ Fallback для Friends без поля step (обратная совместимость)
 */
function formatStepForPrint(stepData) {
  // Пустой шаг
  if (!stepData) return '';

  // Simple - строка вида "+3", "-7"
  if (typeof stepData !== 'object') {
    return String(stepData);
  }

  // Brothers/Friends - объекты с полем step
  if (stepData.step) {
    return stepData.step;
  }

  // ✅ FALLBACK для Friends без поля step (старые данные)
  if (stepData.isFriend && stepData.action !== undefined) {
    const sign = stepData.action >= 0 ? '+' : '';
    return `${sign}${stepData.action}`;
  }

  // Другие случаи - пустая строка
  return '';
}
