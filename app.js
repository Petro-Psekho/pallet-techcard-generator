const form = document.getElementById('palletForm');
const techCard = document.getElementById('techCard');
const imageInput = document.getElementById('imageInput');
const imageList = document.getElementById('imageList');
const primaryImageInput = document.getElementById('primaryImageInput');
const primaryImageList = document.getElementById('primaryImageList');
const groupImageInput = document.getElementById('groupImageInput');
const groupImageList = document.getElementById('groupImageList');
const caseImageInput = document.getElementById('caseImageInput');
const caseImageList = document.getElementById('caseImageList');
const palletPatternImageInput = document.getElementById('palletPatternImageInput');
const palletPatternImageList = document.getElementById('palletPatternImageList');
const jsonInput = document.getElementById('jsonInput');

let uploadedImages = [];
let primaryImages = [];
let groupImages = [];
let caseImages = [];
let palletPatternImages = [];

const imageGroups = {
  general: {
    getImages: () => uploadedImages,
    setImages: images => { uploadedImages = images; },
    render: renderImageList,
    input: imageInput
  },
  primary: {
    getImages: () => primaryImages,
    setImages: images => { primaryImages = images; },
    render: renderPrimaryImageList,
    input: primaryImageInput
  },
  group: {
    getImages: () => groupImages,
    setImages: images => { groupImages = images; },
    render: renderGroupImageList,
    input: groupImageInput
  },
  case: {
    getImages: () => caseImages,
    setImages: images => { caseImages = images; },
    render: renderCaseImageList,
    input: caseImageInput
  },
  palletPattern: {
    getImages: () => palletPatternImages,
    setImages: images => { palletPatternImages = images; },
    render: renderPalletPatternImageList,
    input: palletPatternImageInput
  }
};

const fieldLabels = {
  productName: 'Наименование продукта',
  productCode: 'Код / артикул продукта',
  cardVersion: 'Версия техкарты',
  createdDate: 'Дата разработки',
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
  data.primaryImages = primaryImages;
  data.groupImages = groupImages;
  data.caseImages = caseImages;
  data.palletPatternImages = palletPatternImages;
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
  const primaryRows = [
    ['Тип первичной упаковки', data.primaryType],
    ['Габариты первичной упаковки, мм', dimensions(data.primaryLength, data.primaryWidth, data.primaryHeight)],
    ['Вес единицы, кг', data.unitWeight],
    ['Особые требования', data.primaryRequirements],
    ['Фото первичной упаковки', data.primaryImages.length ? 'Загружены' : '']
  ];
  const groupRows = [
    ['Тип групповой упаковки / шоу-бокса', data.groupType],
    ['Единиц в группе', data.groupUnits],
    ['Габариты группы, мм', dimensions(data.groupLength, data.groupWidth, data.groupHeight)],
    ['Вес группы, кг', data.groupWeight],
    ['Описание укладки', data.groupDescription],
    ['Фото групповой упаковки / шоу-бокса', data.groupImages.length ? 'Загружены' : '']
  ];
  const caseRows = [
    ['Единиц в ящике', data.unitsPerCase],
    ['Габариты ящика, мм', dimensions(data.caseLength, data.caseWidth, data.caseHeight)],
    ['Вес ящика, кг', data.caseWeight],
    ['Марка / тип гофрокартона', data.caseMaterial],
    ['BCT / stacking test', bctLabel(data.bctTest)],
    ['Особенности ящика', data.caseNotes],
    ['Фото транспортного ящика', data.caseImages.length ? 'Загружены' : '']
  ];
  const palletRows = [
    ['Ящиков в слое', data.casesPerLayer],
    ['Количество слоев', data.layersCount],
    ['Всего ящиков на паллете', formatNumber(calculations.totalCases)],
    ['Всего единиц на паллете', formatNumber(calculations.totalUnits)],
    ['Занятая площадь слоя, мм', dimensions(data.occupiedLayerLength, data.occupiedLayerWidth, '')],
    ['Высота паллеты без поддона, мм', formatNumber(calculations.palletHeightWithoutPallet)],
    ['Общая высота паллеты, мм', formatNumber(calculations.totalPalletHeight)],
    ['Вес паллеты, кг', formatNumber(calculations.totalPalletWeight)],
    ['Схема укладки', data.palletPattern],
    ['Фото схемы укладки', data.palletPatternImages.length ? 'Загружены' : ''],
    ['Межслойные прокладки / фиксация', data.layerFixation],
    ['Double stacking', data.doubleStacking ? 'Разрешено' : '']
  ];
  const checklistRows = [
    ['Проверена маркировка', data.qualityChecks.checkLabeling],
    ['Проверена целостность упаковки', data.qualityChecks.checkIntegrity],
    ['Проверены габариты паллеты', data.qualityChecks.checkDimensions],
    ['Проверен вес паллеты', data.qualityChecks.checkWeight],
    ['Проверена устойчивость паллеты', data.qualityChecks.checkStability],
    ['Дополнительные проверки', data.qualityNotes]
  ];
  const risksRows = [
    ['Предупреждения', warnings.length ? warnings.join('\n') : ''],
    ['Риски', data.risks],
    ['Ограничения', data.limitations],
    ['Рекомендации', data.recommendations]
  ];
  const imageRows = [['Изображения', data.images.length ? 'Загружены' : '']];

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
      ['Назначение / рынок', data.purpose]
    ])}

    ${renderSection('2. Исходные данные продукта', primaryRows, renderImages(data.primaryImages, 'Фото первичной упаковки'), primaryRows)}

    ${renderSection('3. Данные по групповой упаковке', groupRows, renderImages(data.groupImages, 'Фото групповой упаковки'), groupRows)}

    ${renderSection('4. Данные по транспортному ящику', caseRows, renderImages(data.caseImages, 'Фото транспортного ящика'), caseRows)}

    ${renderSection('5. Данные по поддону', [
      ['Тип поддона', data.palletType],
      ['Габариты поддона, мм', dimensions(data.palletLength, data.palletWidth, data.palletHeight)],
      ['Вес поддона, кг', data.palletWeight],
      ['Допустимая высота, мм', data.maxPalletHeight],
      ['Допустимый вес, кг', data.maxPalletWeight],
      ['Требования к поддону', data.palletRequirements]
    ])}

    ${renderSection('6. Схема паллетирования', palletRows, renderImages(data.palletPatternImages, 'Фото схемы укладки'), palletRows)}

    <section class="tech-section">
      ${renderTechSectionHeading('7. Контрольный чек-лист', calculateRowsProgress(checklistRows))}
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
      ${renderTechSectionHeading('8. Риски и ограничения', calculateRowsProgress(risksRows))}
      ${warnings.length ? renderWarnings(warnings) : ''}
      ${renderSmallTable([
        ['Риски', data.risks],
        ['Ограничения', data.limitations],
        ['Рекомендации', data.recommendations]
      ])}
    </section>

    <section class="tech-section">
      ${renderTechSectionHeading('9. Изображения / приложения', calculateRowsProgress(imageRows))}
      ${renderImages(data.images, 'Изображение')}
    </section>

    <section class="tech-section">
      ${renderTechSectionHeading('10. Блок подписей', null)}
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
  readImagesFromInput(event.target).then(images => {
    uploadedImages = uploadedImages.concat(images);
    renderImageList();
    updateSectionProgress();
  });
}

function handlePrimaryImageUpload(event) {
  readImagesFromInput(event.target).then(images => {
    primaryImages = primaryImages.concat(images);
    renderPrimaryImageList();
    updateSectionProgress();
  });
}

function handleGroupImageUpload(event) {
  readImagesFromInput(event.target).then(images => {
    groupImages = groupImages.concat(images);
    renderGroupImageList();
    updateSectionProgress();
  });
}

function handleCaseImageUpload(event) {
  readImagesFromInput(event.target).then(images => {
    caseImages = caseImages.concat(images);
    renderCaseImageList();
    updateSectionProgress();
  });
}

function handlePalletPatternImageUpload(event) {
  readImagesFromInput(event.target).then(images => {
    palletPatternImages = palletPatternImages.concat(images);
    renderPalletPatternImageList();
    updateSectionProgress();
  });
}

function readImagesFromInput(input) {
  const files = Array.from(input.files || []);
  const readers = files.map(file => new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve({
      name: file.name,
      type: file.type,
      src: reader.result
    });
    reader.readAsDataURL(file);
  }));

  return Promise.all(readers);
}

function saveToJson() {
  const data = collectFormData();
  const productCode = String(data.productCode || '').trim();
  const productName = String(data.productName || '').trim();

  if (!productCode) {
    alert('Заполните поле «Код / артикул продукта» перед сохранением JSON.');
    form.elements.productCode.focus();
    return;
  }

  if (!productName) {
    alert('Заполните поле «Наименование продукта» перед сохранением JSON.');
    form.elements.productName.focus();
    return;
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const fileName = `${sanitizeFileName(productCode)}_${sanitizeFileName(productName)}.json`;

  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function sanitizeFileName(value) {
  return value
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-')
    .replace(/\s+/g, '_')
    .replace(/-+/g, '-')
    .replace(/^[-_.]+|[-_.]+$/g, '') || 'techcard';
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
      primaryImages = Array.isArray(data.primaryImages) ? data.primaryImages : [];
      groupImages = Array.isArray(data.groupImages) ? data.groupImages : [];
      caseImages = Array.isArray(data.caseImages) ? data.caseImages : [];
      palletPatternImages = Array.isArray(data.palletPatternImages) ? data.palletPatternImages : [];
      renderImageList();
      renderPrimaryImageList();
      renderGroupImageList();
      renderCaseImageList();
      renderPalletPatternImageList();
      updateSectionProgress();
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
  primaryImages = [];
  groupImages = [];
  caseImages = [];
  palletPatternImages = [];
  imageInput.value = '';
  primaryImageInput.value = '';
  groupImageInput.value = '';
  caseImageInput.value = '';
  palletPatternImageInput.value = '';
  renderImageList();
  renderPrimaryImageList();
  renderGroupImageList();
  renderCaseImageList();
  renderPalletPatternImageList();
  updateSectionProgress();
  techCard.innerHTML = `
    <div class="empty-state">
      <h2>Preview техкарты</h2>
      <p>Заполните форму и нажмите «Сгенерировать техкарту».</p>
    </div>
  `;
}

function initSectionProgress() {
  form.querySelectorAll('fieldset').forEach(fieldset => {
    const legend = fieldset.querySelector('legend');
    if (!legend || legend.querySelector('.section-progress')) return;

    const title = legend.textContent.trim();
    legend.innerHTML = `
      <span>${escapeHtml(title)}</span>
      <span class="section-progress" aria-label="Заполнено 0 процентов">0%</span>
    `;
  });

  updateSectionProgress();
}

function updateSectionProgress() {
  form.querySelectorAll('fieldset').forEach(fieldset => {
    const progress = fieldset.querySelector('.section-progress');
    if (!progress) return;

    const controls = Array.from(fieldset.querySelectorAll('input, select, textarea'))
      .filter(control => control.type !== 'file');
    const sectionImageFields = getSectionImageFieldsCount(fieldset);
    const totalFields = controls.length + sectionImageFields;
    const filledFields = controls.filter(isControlFilled).length
      + getFilledSectionImageFieldsCount(fieldset);
    const percent = totalFields ? Math.round((filledFields / totalFields) * 100) : 0;

    progress.textContent = `${percent}%`;
    progress.setAttribute('aria-label', `Заполнено ${percent} процентов`);
    progress.classList.toggle('complete', percent === 100);
  });
}

function isControlFilled(control) {
  if (control.type === 'checkbox') return control.checked;
  return String(control.value || '').trim() !== '';
}

function getSectionImageFieldsCount(fieldset) {
  let count = 0;
  if (fieldset.contains(imageInput)) count += 1;
  if (fieldset.contains(primaryImageInput)) count += 1;
  if (fieldset.contains(groupImageInput)) count += 1;
  if (fieldset.contains(caseImageInput)) count += 1;
  if (fieldset.contains(palletPatternImageInput)) count += 1;
  return count;
}

function getFilledSectionImageFieldsCount(fieldset) {
  let count = 0;
  if (fieldset.contains(imageInput) && uploadedImages.length) count += 1;
  if (fieldset.contains(primaryImageInput) && primaryImages.length) count += 1;
  if (fieldset.contains(groupImageInput) && groupImages.length) count += 1;
  if (fieldset.contains(caseImageInput) && caseImages.length) count += 1;
  if (fieldset.contains(palletPatternImageInput) && palletPatternImages.length) count += 1;
  return count;
}

function renderImageList() {
  renderInputImageList(imageList, uploadedImages, 'Изображения не загружены.', 'general');
}

function renderPrimaryImageList() {
  renderInputImageList(primaryImageList, primaryImages, 'Фото первичной упаковки не загружены.', 'primary');
}

function renderGroupImageList() {
  renderInputImageList(groupImageList, groupImages, 'Фото групповой упаковки не загружены.', 'group');
}

function renderCaseImageList() {
  renderInputImageList(caseImageList, caseImages, 'Фото транспортного ящика не загружены.', 'case');
}

function renderPalletPatternImageList() {
  renderInputImageList(palletPatternImageList, palletPatternImages, 'Фото схемы укладки не загружены.', 'palletPattern');
}

function renderInputImageList(container, images, emptyText, groupKey) {
  if (!images.length) {
    container.innerHTML = `<p class="muted">${escapeHtml(emptyText)}</p>`;
    return;
  }

  container.innerHTML = images.map((image, index) => `
    <div class="image-list-item">
      <img src="${image.src}" alt="${escapeHtml(image.name)}">
      <span>${index + 1}. ${escapeHtml(image.name)}</span>
      <button type="button" class="remove-image-button" data-image-group="${groupKey}" data-image-index="${index}" aria-label="Удалить ${escapeHtml(image.name)}">Удалить</button>
    </div>
  `).join('');
}

function removeImage(groupKey, imageIndex) {
  const group = imageGroups[groupKey];
  if (!group) return;

  const images = group.getImages().filter((_, index) => index !== imageIndex);
  group.setImages(images);
  group.input.value = '';
  group.render();
  updateSectionProgress();

  if (!techCard.querySelector('.empty-state')) {
    generateTechCard();
  }
}

function handleImageListClick(event) {
  const button = event.target.closest('.remove-image-button');
  if (!button) return;

  removeImage(button.dataset.imageGroup, Number(button.dataset.imageIndex));
}

function renderSection(title, rows, extraHtml = '', progressRows = rows) {
  return `
    <section class="tech-section">
      ${renderTechSectionHeading(title, calculateRowsProgress(progressRows))}
      ${renderSmallTable(rows)}
      ${extraHtml}
    </section>
  `;
}

function renderTechSectionHeading(title, percent) {
  const progress = percent === null ? '' : `<span class="tech-section-progress">${percent}%</span>`;
  return `<h2><span>${escapeHtml(title)}</span>${progress}</h2>`;
}

function calculateRowsProgress(rows) {
  if (!rows.length) return 0;
  const filledRows = rows.filter(([, value]) => isRenderableValue(value));
  return Math.round((filledRows.length / rows.length) * 100);
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

function renderImages(images, fallbackCaption = 'Изображение') {
  if (!images || !images.length) {
    return '';
  }

  return `
    <div class="image-grid">
      ${images.map((image, index) => `
        <figure class="image-card">
          <img src="${image.src}" alt="${escapeHtml(image.name || `Изображение ${index + 1}`)}">
          <figcaption>${index + 1}. ${escapeHtml(image.name || fallbackCaption)}</figcaption>
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
primaryImageInput.addEventListener('change', handlePrimaryImageUpload);
groupImageInput.addEventListener('change', handleGroupImageUpload);
caseImageInput.addEventListener('change', handleCaseImageUpload);
palletPatternImageInput.addEventListener('change', handlePalletPatternImageUpload);
imageList.addEventListener('click', handleImageListClick);
primaryImageList.addEventListener('click', handleImageListClick);
groupImageList.addEventListener('click', handleImageListClick);
caseImageList.addEventListener('click', handleImageListClick);
palletPatternImageList.addEventListener('click', handleImageListClick);
jsonInput.addEventListener('change', loadFromJson);
form.addEventListener('input', updateSectionProgress);
form.addEventListener('change', updateSectionProgress);

renderImageList();
renderPrimaryImageList();
renderGroupImageList();
renderCaseImageList();
renderPalletPatternImageList();
initSectionProgress();
