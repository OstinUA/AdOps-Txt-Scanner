/**
 * @typedef {Object} ScanResult
 * @property {string} domain Original user input domain string.
 * @property {string} status Human-readable scan status.
 * @property {number} lines Count of valid DIRECT/RESELLER records.
 * @property {string} url Resolved URL used for the result, or "-" when unresolved.
 * @property {"valid"|"empty"|"error"} cssClass CSS status class used in table rendering.
 */

function normalizeDomain(raw) {
  return raw.trim()
    .replace(/^["']|["']$/g, '')
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/$/, '')
    .split('/')[0]
    .toLowerCase();
}

function buildProbeUrls(domain, fileType) {
  return [
    `https://${domain}/${fileType}`,
    `https://www.${domain}/${fileType}`,
    `http://${domain}/${fileType}`,
    `http://www.${domain}/${fileType}`
  ];
}

async function checkSingleFile(domain, fileType) {
  const urls = buildProbeUrls(domain, fileType);

  for (const url of urls) {
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 7000);
      const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
      clearTimeout(tid);

      if (res.status === 200) {
        const text = await res.text();
        if (text.toLowerCase().includes('<html') || text.toLowerCase().includes('<!doctype')) {
          continue;
        }
        const validLines = countValidLines(text);
        return {
          status: validLines > 0 ? 'Valid' : 'Empty File',
          lines: validLines,
          url
        };
      }
    } catch {
    }
  }

  return {
    status: 'Error',
    lines: 0,
    url: '-'
  };
}

function countValidLines(content) {
  let count = 0;
  const cleanContent = content.replace(/\uFEFF/g, '');
  const lines = cleanContent.split(/\r?\n/);

  for (const line of lines) {
    const clean = line.split('#')[0].trim();
    if (!clean) continue;

    const parts = clean.split(',').map(p => p.trim());
    if (parts.length >= 3) {
      const type = parts[2].toUpperCase().replace(/[^A-Z]/g, '');
      if (type === 'DIRECT' || type === 'RESELLER') {
        count++;
      }
    }
  }

  return count;
}

function initPopup() {
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const modeToggleBtn = document.getElementById('modeToggleBtn');
  const standardModeView = document.getElementById('standardModeView');
  const bulkModeView = document.getElementById('bulkModeView');
  const csvBulkModeView = document.getElementById('csvBulkModeView');

  const checkBtn = document.getElementById('checkBtn');
  const stopBtn = document.getElementById('stopBtn');
  const loadFileBtn = document.getElementById('loadFileBtn');
  const loadCsvBtn = document.getElementById('loadCsvBtn');
  const fileInput = document.getElementById('fileInput');
  const csvFileInput = document.getElementById('csvFileInput');
  const downloadBtn = document.getElementById('downloadBtn');
  const domainInput = document.getElementById('domainList');
  const fileTypeSelect = document.getElementById('fileTypeSelect');
  const tableBody = document.querySelector('#resultsTable tbody');
  const statusText = document.getElementById('statusText');
  const progressText = document.getElementById('progressText');

  const bulkLoadFileBtn = document.getElementById('bulkLoadFileBtn');
  const bulkFileInput = document.getElementById('bulkFileInput');
  const bulkFileTypeSelect = document.getElementById('bulkFileTypeSelect');
  const bulkCheckBtn = document.getElementById('bulkCheckBtn');
  const bulkStopBtn = document.getElementById('bulkStopBtn');
  const bulkDownloadBtn = document.getElementById('bulkDownloadBtn');
  const bulkFileStatus = document.getElementById('bulkFileStatus');
  const bulkProgressValue = document.getElementById('bulkProgressValue');
  const bulkTimeValue = document.getElementById('bulkTimeValue');

  const csvBulkFileInput = document.getElementById('csvBulkFileInput');
  const csvBulkLoadBtn = document.getElementById('csvBulkLoadBtn');
  const csvBulkCheckBtn = document.getElementById('csvBulkCheckBtn');
  const csvBulkStopBtn = document.getElementById('csvBulkStopBtn');
  const csvBulkDownloadBtn = document.getElementById('csvBulkDownloadBtn');
  const csvBulkFileStatus = document.getElementById('csvBulkFileStatus');
  const csvBulkProgress = document.getElementById('csvBulkProgress');
  const csvBulkTime = document.getElementById('csvBulkTime');

  let results = [];
  let isScanning = false;
  let currentTheme = localStorage.getItem('theme') || 'light';
  let modeIndex = 0;

  let bulkLines = [];
  let bulkTimerInterval = null;
  let bulkStartTime = 0;
  let bulkResultsArray = [];

  let csvBulkEntries = [];
  let csvBulkResultsArray = [];
  let csvBulkTimerInterval = null;
  let csvBulkStartTime = 0;

  applyTheme(currentTheme);
  updateThemeBtnText(currentTheme);
  setModeByIndex(modeIndex);

  modeToggleBtn.addEventListener('click', () => {
    if (isScanning) return;
    modeIndex = (modeIndex + 1) % 3;
    setModeByIndex(modeIndex);
  });

  function setModeByIndex(index) {
    standardModeView.style.display = index === 0 ? 'block' : 'none';
    bulkModeView.style.display = index === 1 ? 'block' : 'none';
    csvBulkModeView.style.display = index === 2 ? 'block' : 'none';

    if (index === 0) {
      modeToggleBtn.innerText = 'Bulk Mode';
    } else if (index === 1) {
      modeToggleBtn.innerText = 'CSV Bulk Mode';
    } else {
      modeToggleBtn.innerText = 'Standard Mode';
    }
  }

  function updateThemeBtnText(theme) {
    themeToggleBtn.innerText = theme === 'light' ? 'Dark Theme' : 'Light Theme';
  }

  function handleThemeToggle() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', currentTheme);
    applyTheme(currentTheme);
    updateThemeBtnText(currentTheme);
  }
  themeToggleBtn.addEventListener('click', handleThemeToggle);

  loadFileBtn.addEventListener('click', () => fileInput.click());
  loadCsvBtn.addEventListener('click', () => csvFileInput.click());

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      domainInput.value = event.target.result;
      const count = domainInput.value.split('\n').map(l => l.trim()).filter(l => l).length;
      statusText.innerText = `Loaded ${count} domains from file`;
      fileInput.value = '';
    };
    reader.readAsText(file);
  });

  csvFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = String(event.target.result || '');
      const rows = content.split(/\r?\n/);
      const domainSet = new Set();

      rows.forEach((row) => {
        if (!row.trim()) return;
        const firstColumn = row.split(/[;,]/)[0] || '';
        const cleaned = firstColumn.replace(/^["']|["']$/g, '');
        const normalized = normalizeDomain(cleaned);
        if (normalized) domainSet.add(normalized);
      });

      const domains = Array.from(domainSet);
      domainInput.value = domains.join('\n');
      statusText.innerText = `Loaded ${domains.length} domains from CSV`;
      csvFileInput.value = '';
    };
    reader.readAsText(file);
  });

  stopBtn.addEventListener('click', () => {
    isScanning = false;
    statusText.innerText = 'Stopping after current batch...';
    stopBtn.disabled = true;
  });

  async function handleCheckClick() {
    const text = domainInput.value;
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    const fileType = fileTypeSelect.value;

    if (lines.length === 0) {
      statusText.innerText = 'List is empty!';
      return;
    }

    isScanning = true;
    modeToggleBtn.disabled = true;
    results = [];
    tableBody.innerHTML = '';
    downloadBtn.style.display = 'none';

    checkBtn.style.display = 'none';
    stopBtn.style.display = 'block';
    stopBtn.disabled = false;
    loadFileBtn.disabled = true;
    loadCsvBtn.disabled = true;
    domainInput.disabled = true;
    fileTypeSelect.disabled = true;

    let completed = 0;
    progressText.innerText = `0/${lines.length}`;

    const batchSize = 10;

    for (let i = 0; i < lines.length; i += batchSize) {
      if (!isScanning) {
        statusText.innerText = 'Stopped by user';
        break;
      }

      const batch = lines.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(domain => checkDomainSmart(domain, fileType)));

      batchResults.forEach(res => {
        addResultToTable(res, tableBody);
        results.push(res);
        completed++;
      });

      progressText.innerText = `${completed}/${lines.length}`;

      if (isScanning && (i + batchSize < lines.length)) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    if (isScanning) statusText.innerText = 'Completed!';

    isScanning = false;
    modeToggleBtn.disabled = false;
    checkBtn.style.display = 'block';
    stopBtn.style.display = 'none';
    loadFileBtn.disabled = false;
    loadCsvBtn.disabled = false;
    domainInput.disabled = false;
    fileTypeSelect.disabled = false;

    if (results.length > 0) downloadBtn.style.display = 'block';
  }

  function handleDownloadClick() {
    let csv = 'File URL,Status,Lines\n';
    results.forEach(r => {
      const urlForCsv = r.url !== '-' ? r.url : r.domain;
      csv += `${urlForCsv},${r.status},${r.lines}\n`;
    });
    triggerDownload(csv, 'checker_results.csv');
  }

  checkBtn.addEventListener('click', handleCheckClick);
  downloadBtn.addEventListener('click', handleDownloadClick);

  bulkLoadFileBtn.addEventListener('click', () => bulkFileInput.click());

  bulkFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      bulkLines = event.target.result.split('\n').map(l => l.trim()).filter(l => l);
      bulkFileStatus.innerText = `File loaded: ${bulkLines.length} domains ready.`;
      bulkProgressValue.innerText = `0 / ${bulkLines.length}`;
      bulkTimeValue.innerText = '00:00';
      bulkCheckBtn.disabled = bulkLines.length === 0;
      bulkDownloadBtn.style.display = 'none';
      bulkFileInput.value = '';
    };
    reader.readAsText(file);
  });

  function updateBulkTimer() {
    const diff = Math.floor((Date.now() - bulkStartTime) / 1000);
    const m = String(Math.floor(diff / 60)).padStart(2, '0');
    const s = String(diff % 60).padStart(2, '0');
    bulkTimeValue.innerText = `${m}:${s}`;
  }

  bulkStopBtn.addEventListener('click', () => {
    isScanning = false;
    bulkStopBtn.disabled = true;
    bulkFileStatus.innerText = 'Stopping after current batch...';
  });

  async function handleBulkCheckClick() {
    const fileType = bulkFileTypeSelect.value;
    const total = bulkLines.length;

    if (total === 0) return;

    isScanning = true;
    modeToggleBtn.disabled = true;
    bulkResultsArray = ['File URL,Status,Lines'];
    bulkDownloadBtn.style.display = 'none';

    bulkCheckBtn.style.display = 'none';
    bulkStopBtn.style.display = 'block';
    bulkStopBtn.disabled = false;
    bulkLoadFileBtn.disabled = true;
    bulkFileTypeSelect.disabled = true;

    bulkFileStatus.innerText = 'Processing...';
    bulkProgressValue.innerText = `0 / ${total}`;

    bulkStartTime = Date.now();
    bulkTimerInterval = setInterval(updateBulkTimer, 1000);

    let completed = 0;
    const batchSize = 15;

    for (let i = 0; i < total; i += batchSize) {
      if (!isScanning) {
        bulkFileStatus.innerText = 'Stopped by user.';
        break;
      }

      const batch = bulkLines.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(domain => checkDomainSmart(domain, fileType)));

      batchResults.forEach(res => {
        const urlForCsv = res.url !== '-' ? res.url : res.domain;
        bulkResultsArray.push(`${urlForCsv},${res.status},${res.lines}`);
        completed++;
      });

      bulkProgressValue.innerText = `${completed} / ${total}`;

      if (isScanning && (i + batchSize < total)) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    clearInterval(bulkTimerInterval);

    if (isScanning) {
      bulkFileStatus.innerText = 'Completed successfully!';
    }

    isScanning = false;
    modeToggleBtn.disabled = false;
    bulkCheckBtn.style.display = 'block';
    bulkStopBtn.style.display = 'none';
    bulkLoadFileBtn.disabled = false;
    bulkFileTypeSelect.disabled = false;

    if (bulkResultsArray.length > 1) {
      bulkDownloadBtn.style.display = 'block';
    }
  }

  bulkCheckBtn.addEventListener('click', handleBulkCheckClick);

  bulkDownloadBtn.addEventListener('click', () => {
    const csvContent = bulkResultsArray.join('\n');
    triggerDownload(csvContent, 'bulk_checker_results.csv');
  });

  csvBulkLoadBtn.addEventListener('click', () => csvBulkFileInput.click());

  csvBulkFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = String(event.target.result || '');
      const rows = text.split(/\r?\n/).map(row => row.trim()).filter(Boolean);

      const parsed = [];
      let startIndex = 0;

      if (rows.length > 0 && /(domain|url|site|website)/i.test(rows[0])) {
        startIndex = 1;
      }

      const dedupeMap = new Map();

      for (let i = startIndex; i < rows.length; i++) {
        const row = rows[i];
        const firstColumn = (row.split(/[;,]/)[0] || '').trim();
        if (!firstColumn) continue;

        const normalized = normalizeDomain(firstColumn);
        if (!normalized) continue;

        if (!dedupeMap.has(normalized)) {
          dedupeMap.set(normalized, firstColumn.replace(/^["']|["']$/g, ''));
        }
      }

      dedupeMap.forEach((rawOriginal, normalizedDomain) => {
        parsed.push({ rawOriginal, normalizedDomain });
      });

      csvBulkEntries = parsed;
      csvBulkResultsArray = ['Original Domain,ads.txt,app-ads.txt'];
      csvBulkFileStatus.innerText = `File loaded: ${csvBulkEntries.length} domains ready.`;
      csvBulkProgress.innerText = `0 / ${csvBulkEntries.length}`;
      csvBulkTime.innerText = '00:00';
      csvBulkCheckBtn.disabled = csvBulkEntries.length === 0;
      csvBulkDownloadBtn.style.display = 'none';
      csvBulkFileInput.value = '';
    };
    reader.readAsText(file);
  });

  function updateCsvBulkTimer() {
    const diff = Math.floor((Date.now() - csvBulkStartTime) / 1000);
    const m = String(Math.floor(diff / 60)).padStart(2, '0');
    const s = String(diff % 60).padStart(2, '0');
    csvBulkTime.innerText = `${m}:${s}`;
  }

  csvBulkStopBtn.addEventListener('click', () => {
    isScanning = false;
    csvBulkStopBtn.disabled = true;
    csvBulkFileStatus.innerText = 'Stopping after current batch...';
  });

  csvBulkCheckBtn.addEventListener('click', async () => {
    const total = csvBulkEntries.length;
    if (total === 0) return;

    isScanning = true;
    modeToggleBtn.disabled = true;
    csvBulkResultsArray = ['Original Domain,ads.txt,app-ads.txt'];

    csvBulkCheckBtn.style.display = 'none';
    csvBulkStopBtn.style.display = 'block';
    csvBulkStopBtn.disabled = false;
    csvBulkLoadBtn.disabled = true;
    csvBulkDownloadBtn.style.display = 'none';

    csvBulkFileStatus.innerText = 'Processing...';
    csvBulkProgress.innerText = `0 / ${total}`;

    csvBulkStartTime = Date.now();
    csvBulkTimerInterval = setInterval(updateCsvBulkTimer, 1000);

    const batchSize = 10;
    let completed = 0;

    for (let i = 0; i < total; i += batchSize) {
      if (!isScanning) {
        csvBulkFileStatus.innerText = 'Stopped by user.';
        break;
      }

      const batch = csvBulkEntries.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (entry) => {
          const [adsResult, appAdsResult] = await Promise.all([
            checkSingleFile(entry.normalizedDomain, 'ads.txt'),
            checkSingleFile(entry.normalizedDomain, 'app-ads.txt')
          ]);

          return {
            original: entry.rawOriginal,
            ads: adsResult.status,
            appAds: appAdsResult.status
          };
        })
      );

      batchResults.forEach((row) => {
        csvBulkResultsArray.push(`${escapeCsvCell(row.original)},${escapeCsvCell(row.ads)},${escapeCsvCell(row.appAds)}`);
        completed++;
      });

      csvBulkProgress.innerText = `${completed} / ${total}`;
      updateCsvBulkTimer();

      if (isScanning && (i + batchSize < total)) {
        await new Promise(r => setTimeout(r, 50));
      }
    }

    clearInterval(csvBulkTimerInterval);

    if (isScanning) {
      csvBulkFileStatus.innerText = 'Completed successfully!';
    }

    isScanning = false;
    modeToggleBtn.disabled = false;
    csvBulkCheckBtn.style.display = 'block';
    csvBulkStopBtn.style.display = 'none';
    csvBulkLoadBtn.disabled = false;

    if (csvBulkResultsArray.length > 1) {
      csvBulkDownloadBtn.style.display = 'block';
    }
  });

  csvBulkDownloadBtn.addEventListener('click', () => {
    triggerDownload(csvBulkResultsArray.join('\n'), 'csv_bulk_results.csv');
  });

  function triggerDownload(content, filename) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function escapeCsvCell(value) {
    const str = String(value ?? '');
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  async function checkDomainSmart(rawDomain, fileType) {
    if (fileType === 'url') {
      const exactUrl = /^(https?:\/\/)/i.test(rawDomain) ? rawDomain : `https://${rawDomain}`;
      try {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 7000);
        const res = await fetch(exactUrl, { signal: ctrl.signal, cache: 'no-store' });
        clearTimeout(tid);

        if (res.status === 200) {
          const text = await res.text();
          if (text.toLowerCase().includes('<html') || text.toLowerCase().includes('<!doctype')) {
            throw new Error('HTML content');
          }
          const validLines = countValidLines(text);
          return {
            domain: rawDomain,
            status: validLines > 0 ? 'Valid' : 'Empty File',
            lines: validLines,
            url: exactUrl,
            cssClass: validLines > 0 ? 'valid' : 'empty'
          };
        }
      } catch {
      }

      return {
        domain: rawDomain,
        status: 'Error',
        lines: 0,
        url: '-',
        cssClass: 'error'
      };
    }

    const normalizedDomain = normalizeDomain(rawDomain);

    if (!normalizedDomain) {
      return {
        domain: rawDomain,
        status: 'Error',
        lines: 0,
        url: '-',
        cssClass: 'error'
      };
    }

    if (fileType === 'both') {
      const [adsSettled, appAdsSettled] = await Promise.allSettled([
        checkSingleFile(normalizedDomain, 'ads.txt'),
        checkSingleFile(normalizedDomain, 'app-ads.txt')
      ]);

      const adsResult = adsSettled.status === 'fulfilled' ? adsSettled.value : { status: 'Error', lines: 0, url: '-' };
      const appAdsResult = appAdsSettled.status === 'fulfilled' ? appAdsSettled.value : { status: 'Error', lines: 0, url: '-' };

      const status = `ads: ${adsResult.status}${adsResult.status === 'Valid' ? ` (${adsResult.lines})` : ''} / app-ads: ${appAdsResult.status}${appAdsResult.status === 'Valid' ? ` (${appAdsResult.lines})` : ''}`;
      const totalLines = adsResult.lines + appAdsResult.lines;

      let cssClass = 'error';
      if (adsResult.status === 'Valid' || appAdsResult.status === 'Valid') {
        cssClass = 'valid';
      } else if (adsResult.status === 'Empty File' && appAdsResult.status === 'Empty File') {
        cssClass = 'empty';
      }

      const resolvedUrl = adsResult.url !== '-' ? adsResult.url : (appAdsResult.url !== '-' ? appAdsResult.url : '-');

      return {
        domain: rawDomain,
        status,
        lines: totalLines,
        url: resolvedUrl,
        cssClass
      };
    }

    const single = await checkSingleFile(normalizedDomain, fileType);

    return {
      domain: rawDomain,
      status: single.status,
      lines: single.lines,
      url: single.url,
      cssClass: single.status === 'Valid' ? 'valid' : (single.status === 'Empty File' ? 'empty' : 'error')
    };
  }

  function addResultToTable(res, tableBodyElement) {
    const tr = document.createElement('tr');
    const urlCell = res.url !== '-'
      ? `<a href="${res.url}" target="_blank">${res.url}</a>`
      : `<span class="domain-fallback">${res.domain}</span>`;

    tr.innerHTML = `
      <td class="col-url">${urlCell}</td>
      <td class="col-status ${res.cssClass}">${res.status}</td>
      <td class="col-lines">${res.lines}</td>
    `;
    tableBodyElement.appendChild(tr);
  }

  function applyTheme(theme) {
    document.body.classList.toggle('dark', theme === 'dark');
  }
}

document.addEventListener('DOMContentLoaded', initPopup);
