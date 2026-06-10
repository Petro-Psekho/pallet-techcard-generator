const form = document.getElementById('palletForm');
const techCard = document.getElementById('techCard');
const imageInput = document.getElementById('imageInput');
const imageList = document.getElementById('imageList');
const jsonInput = document.getElementById('jsonInput');

let uploadedImages = [];

const fieldLabels = {
  productName: 'Наименование продукта',
  productCode: 'Код / артикул продукта',
  cardVersion: 'Версия техкарты',
  createdDate: 'Дата разработки',
  responsiblePerson: 'Ответственный',
  purpose: 'Назначение / рынок',
  primaryType: 'Тип первичной упаковки',
  primaryLength: 'Длина первичной упаковки, мм',
  primaryWidth: 'Ширина первичной упаковки, мм',
  primaryHeight: 'Высота первичной упаковки, мм',
  unitWeight: 'Вес единицы, кг',
  primaryRequirements: 'Особые требования',
  groupType: 'Тип групповой упаковки',
  groupUnits: 'Единиц в группе',
  groupWeight: 'Вес группы, кг',
  groupLength: 'Длина группы, мм',
  groupWidth: 'Ширина группы, мм',
  groupHeight: 'Высота группы, мм',
  groupDescription: 'Описание укладки',
  unitsPerCase: 'Единиц в ящике',
  caseWeight: 'Вес ящика, кг',
  caseLength: 'Длина ящика, мм',
  caseWidth: 'Ширина ящика, мм',
  caseHeight: 'Высота ящика, мм',
  caseMaterial: 'Марка / тип гофрокартона',
  bctTest: 'BCT / stacking test',
  caseNotes: 'Особенности ящика',
  palletType: 'Тип поддона',
  palletLength: 'Длина поддона, мм',
  palletWidth: 'Ширина поддона, мм',
  palletHeight: 'Высота поддона, мм',
  palletWeight: 'Вес поддона, кг',
  maxPalletHeight: 'Допустимая высота, мм',
  maxPalletWeight: 'Допустимый вес, кг',
  palletRequirements: 'Требования к поддону',
  casesPerLayer: 'Ящиков в слое',
  layersCount: 'Количество слоев',
  occupiedLayerLength: 'Занятая длина слоя, мм',
  occupiedLayerWidth: 'Занятая ширина слоя, мм',
  palletPattern: 'Схема укладки',
  layerFixation: 'Межслойные прокладки / фиксация',
  doubleStacking: 'Double stacking',
  qualityNotes: 'Дополнительные проверки',
  risks: 'Риски',
  limitations: 'Ограничения',
  recommendations: 'Рекомендации'
};

function collectFormData() {
  const formData = new FormData(form);
  const data = {};

  for (const element of form.elements) {
    if (!element.name) continue;

    if (element.type === 'checkbox') {
      data[element.name] = element.checked;
    } else {
      data[element.name] = formData.get(element.name) || '';
    }
  }

  data.images = uploadedImages;
  data.qualityChecks = {
    checkLabeling: form.elements.checkLabeling.checked,
    checkIntegrity: form.elements.checkIntegrity.checked,
    checkDimensions: form.elements.checkDimensions.checked,
    checkWeight: form.elements.checkWeight.checked,
    checkStability: form.elements.checkStability.checked
  };

  return data;
}

function calculatePalletData(data) {
  const casesPerLayer = toNumber(data.casesPerLayer);
  const layersCount = toNumber(data.layersCount);
  const unitsPerCase = toNumber(data.unitsPerCase);
  const caseHeight = toNumber(data.caseHeight);
  const palletHeight = toNumber(data.palletHeight);
  const caseWeight = toNumber(data.caseWeight);
  const palletWeight = toNumber(data.palletWeight);

  const totalCases = multiply(casesPerLayer, layersCount);
  const totalUnits = multiply(totalCases, unitsPerCase);
  const palletHeightWithoutPallet = multiply(caseHeight, layersCount);
  const totalPalletHeight = add(palletHeightWithoutPallet, palletHeight);
  const totalPalletWeight = add(multiply(totalCases, caseWeight), palletWeight);

  return {
    totalCases,
    totalUnits,
    palletHeightWithoutPallet,
    totalPalletHeight,
    totalPalletWeight
  };
}

function validateData(data, calculations) {
  const warnings = [];
  const occupiedLayerLength = toNumber(data.occupiedLayerLength);
  const occupiedLayerWidth = toNumber(data.occupiedLayerWidth);
  const palletLength = toNumber(data.palletLength);
  const palletWidth = toNumber(data.palletWidth);
  const maxPalletHeight = toNumber(data.maxPalletHeight);
  const maxPalletWeight = toNumber(data.maxPalletWeight);

  if (isFilledNumber(occupiedLayerLength) && isFilledNumber(palletLength) && occupiedLayerLength > palletLength) {
    warnings.push('Занятая длина слоя больше длины поддона — возможное нависание груза.');
  }

  if (isFilledNumber(occupiedLayerWidth) && isFilledNumber(palletWidth) && occupiedLayerWidth > palletWidth) {
    warnings.push('Занятая ширина слоя больше ширины поддона — возможное нависание груза.');
  }

  if (isFilledNumber(calculations.totalPalletHeight) && isFilledNumber(maxPalletHeight) && calculations.totalPalletHeight > maxPalletHeight) {
    warnings.push('Общая высота паллеты больше допустимой высоты.');
  }

  if (isFilledNumber(calculations.totalPalletWeight) && isFilledNumber(maxPalletWeight) && calculations.totalPalletWeight > maxPalletWeight) {
    warnings.push('Общий вес паллеты больше допустимого веса.');
  }

  if (data.doubleStacking && data.bctTest !== 'yes') {
    warnings.push('Выбран double stacking, но BCT / stacking test не отмечен как проведенный.');
  }

  return warnings;
}

function renderTechCard(data, calculations, warnings) {
  techCard.innerHTML = `
    <h1 class="card-title">ТЕХНИЧЕСКАЯ КАРТА ПАЛЛЕТИРОВАНИЯ</h1>
    ${renderCardMeta([
      ['Продукт', data.productName],
      ['Версия', data.cardVersion],
      ['Дата', formatDate(data.createdDate)]
    ])}

    ${renderSection('1. Общая информация', [
      ['Наименование продукта', data.productName],
      ['Код / артикул продукта', data.productCode],
      ['Версия техкарты', data.cardVersion],
      ['Дата разработки', formatDate(data.createdDate)],
      ['Ответственный', data.responsiblePerson],
      ['Назначение / рынок', data.purpose]
    ])}

    ${renderSection('2. Исходные данные продукта', [
      ['Тип первичной упаковки', data.primaryType],
      ['Габариты первичной упаковки, мм', dimensions(data.primaryLength, data.primaryWidth, data.primaryHeight)],
      ['Вес единицы, кг', data.unitWeight],
      ['Особые требования', data.primaryRequirements]
    ])}

    ${renderSection('3. Данные по групповой упаковке', [
      ['Тип групповой упаковки / шоу-бокса', data.groupType],
      ['Единиц в группе', data.groupUnits],
      ['Габариты группы, мм', dimensions(data.groupLength, data.groupWidth, data.groupHeight)],
      ['Вес группы, кг', data.groupWeight],
      ['Описание укладки', data.groupDescription]
    ])}

    ${renderSection('4. Данные по транспортному ящику', [
      ['Единиц в ящике', data.unitsPerCase],
      ['Габариты ящика, мм', dimensions(data.caseLength, data.caseWidth, data.caseHeight)],
      ['Вес ящика, кг', data.caseWeight],
      ['Марка / тип гофрокартона', data.caseMaterial],
      ['BCT / stacking test', bctLabel(data.bctTest)],
      ['Особенности ящика', data.caseNotes]
    ])}

    ${renderSection('5. Данные по поддону', [
      ['Тип поддона', data.palletType],
      ['Габариты поддона, мм', dimensions(data.palletLength, data.palletWidth, data.palletHeight)],
      ['Вес поддона, кг', data.palletWeight],
      ['Допустимая высота, мм', data.maxPalletHeight],
      ['Допустимый вес, кг', data.maxPalletWeight],
      ['Требования к поддону', data.palletRequirements]
    ])}

    ${renderSection('6. Схема паллетирования', [
      ['Ящиков в слое', data.casesPerLayer],
      ['Количество слоев', data.layersCount],
      ['Всего ящиков на паллете', formatNumber(calculations.totalCases)],
      ['Всего единиц на паллете', formatNumber(calculations.totalUnits)],
      ['Занятая площадь слоя, мм', dimensions(data.occupiedLayerLength, data.occupiedLayerWidth, '')],
      ['Высота паллеты без поддона, мм', formatNumber(calculations.palletHeightWithoutPallet)],
      ['Общая высота паллеты, мм', formatNumber(calculations.totalPalletHeight)],
      ['Вес паллеты, кг', formatNumber(calculations.totalPalletWeight)],
      ['Схема укладки', data.palletPattern],
      ['Межслойные прокладки / фиксация', data.layerFixation],
      ['Double stacking', data.doubleStacking ? 'Разрешено' : '']
    ])}

    <section class="tech-section">
      <h2>7. Контрольный чек-лист</h2>
      ${renderChecklist([
        ['Проверена маркировка', data.qualityChecks.checkLabeling],
        ['Проверена целостность упаковки', data.qualityChecks.checkIntegrity],
        ['Проверены габариты паллеты', data.qualityChecks.checkDimensions],
        ['Проверен вес паллеты', data.qualityChecks.checkWeight],
        ['Проверена устойчивость паллеты', data.qualityChecks.checkStability]
      ])}
      ${renderSmallTable([['Дополнительные проверки', data.qualityNotes]])}
    </section>

    <section class="tech-section">
      <h2>8. Риски и ограничения</h2>
      ${warnings.length ? renderWarnings(warnings) : ''}
      ${renderSmallTable([
        ['Риски', data.risks],
        ['Ограничения', data.limitations],
        ['Рекомендации', data.recommendations]
      ])}
    </section>

    <section class="tech-section">
      <h2>9. Изображения / приложения</h2>
      ${renderImages(data.images)}
    </section>

    <section class="tech-section">
      <h2>10. Блок подписей</h2>
      <div class="signature-grid">
        <div class="signature-cell">Разработал</div>
        <div class="signature-cell">Проверил</div>
        <div class="signature-cell">Утвердил</div>
        <div class="signature-cell">Дата</div>
      </div>
    </section>
  `;
}

function handleImageUpload(event) {
  const files = Array.from(event.target.files || []);
  const readers = files.map(file => new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve({
      name: file.name,
      type: file.type,
      src: reader.result
    });
    reader.readAsDataURL(file);
  }));

  Promise.all(readers).then(images => {
    uploadedImages = uploadedImages.concat(images);
    renderImageList();
  });
}

function saveToJson() {
  const data = collectFormData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const fileName = `techcard-pallet-${new Date().toISOString().slice(0, 10)}.json`;

  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function loadFromJson(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      restoreFormData(data);
      uploadedImages = Array.isArray(data.images) ? data.images : [];
      renderImageList();
      generateTechCard();
    } catch (error) {
      alert('Не удалось загрузить JSON. Проверьте структуру файла.');
    } finally {
      jsonInput.value = '';
    }
  };
  reader.readAsText(file);
}

function printTechCard() {
  generateTechCard();
  window.print();
}

function generateTechCard() {
  const data = collectFormData();
  const calculations = calculatePalletData(data);
  const warnings = validateData(data, calculations);
  renderTechCard(data, calculations, warnings);
}

function restoreFormData(data) {
  for (const element of form.elements) {
    if (!element.name || !(element.name in data)) continue;

    if (element.type === 'checkbox') {
      element.checked = Boolean(data[element.name]);
    } else {
      element.value = data[element.name] ?? '';
    }
  }
}

function clearForm() {
  form.reset();
  uploadedImages = [];
  imageInput.value = '';
  renderImageList();
  techCard.innerHTML = `
    <div class="empty-state">
      <h2>Preview техкарты</h2>
      <p>Заполните форму и нажмите «Сгенерировать техкарту».</p>
    </div>
  `;
}

function renderImageList() {
  if (!uploadedImages.length) {
    imageList.innerHTML = '<p class="muted">Изображения не загружены.</p>';
    return;
  }

  imageList.innerHTML = uploadedImages.map((image, index) => `
    <div class="image-list-item">
      <img src="${image.src}" alt="${escapeHtml(image.name)}">
      <span>${index + 1}. ${escapeHtml(image.name)}</span>
    </div>
  `).join('');
}

function renderSection(title, rows) {
  return `
    <section class="tech-section">
      <h2>${title}</h2>
      ${renderSmallTable(rows)}
    </section>
  `;
}

function renderCardMeta(rows) {
  const filledRows = rows.filter(([, value]) => isRenderableValue(value));
  if (!filledRows.length) return '';

  return `
    <div class="card-meta">
      ${filledRows.map(([label, value]) => `<div><strong>${escapeHtml(label)}:</strong> ${formatMultiline(value)}</div>`).join('')}
    </div>
  `;
}

function renderSmallTable(rows) {
  const filledRows = rows.filter(([, value]) => isRenderableValue(value));
  if (!filledRows.length) return '';

  return `
    <table class="tech-table">
      <tbody>
        ${filledRows.map(([label, value]) => `
          <tr>
            <th>${escapeHtml(label)}</th>
            <td>${formatMultiline(value)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderWarnings(warnings) {
  return `
    <ul class="warning-list">
      ${warnings.map(warning => `<li>${escapeHtml(warning)}</li>`).join('')}
    </ul>
  `;
}

function renderCheck(label, checked) {
  return `<li>${checked ? '☑' : '☐'} ${escapeHtml(label)}</li>`;
}

function renderChecklist(items) {
  const checkedItems = items.filter(([, checked]) => checked);
  if (!checkedItems.length) return '';

  return `
    <ul class="check-list">
      ${checkedItems.map(([label, checked]) => renderCheck(label, checked)).join('')}
    </ul>
  `;
}

function renderImages(images) {
  if (!images || !images.length) {
    return '';
  }

  return `
    <div class="image-grid">
      ${images.map((image, index) => `
        <figure class="image-card">
          <img src="${image.src}" alt="${escapeHtml(image.name || `Изображение ${index + 1}`)}">
          <figcaption>${index + 1}. ${escapeHtml(image.name || 'Изображение Cape Pack')}</figcaption>
        </figure>
      `).join('')}
    </div>
  `;
}

function dimensions(length, width, height) {
  const parts = [length, width, height].filter(value => value !== '');
  if (!parts.length) return '—';
  return parts.map(value => formatNumber(value)).join(' × ');
}

function bctLabel(value) {
  if (value === 'yes') return 'Проведен / соответствует';
  if (value === 'no') return 'Не проведен';
  return '—';
}

function toNumber(value) {
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function isFilledNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function multiply(first, second) {
  if (!isFilledNumber(first) || !isFilledNumber(second)) return null;
  return first * second;
}

function add(first, second) {
  if (!isFilledNumber(first) && !isFilledNumber(second)) return null;
  return (first || 0) + (second || 0);
}

function formatNumber(value) {
  const number = toNumber(value);
  if (!isFilledNumber(number)) return '—';
  return Number.isInteger(number) ? String(number) : String(Number(number.toFixed(3)));
}

function valueOrDash(value) {
  if (value === true) return 'Да';
  if (value === false) return 'Нет';
  if (value === null || value === undefined || value === '') return '—';
  return escapeHtml(String(value));
}

function isRenderableValue(value) {
  if (value === false || value === null || value === undefined) return false;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed !== '' && trimmed !== '—';
  }
  return true;
}

function formatMultiline(value) {
  const formatted = valueOrDash(value);
  return formatted.replace(/\n/g, '<br>');
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return valueOrDash(value);
  return date.toLocaleDateString('ru-RU');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

document.getElementById('generateBtn').addEventListener('click', generateTechCard);
document.getElementById('clearBtn').addEventListener('click', clearForm);
document.getElementById('printBtn').addEventListener('click', printTechCard);
document.getElementById('saveJsonBtn').addEventListener('click', saveToJson);
imageInput.addEventListener('change', handleImageUpload);
jsonInput.addEventListener('change', loadFromJson);

renderImageList();
