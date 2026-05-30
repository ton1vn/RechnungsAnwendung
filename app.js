const STORAGE_KEY = "blumenhaus-rechnung";
const DEFAULT_PRODUCTS = [
  "Blumenstrauß",
  "Topfpflanzen",
  "Schnittblumen",
  "Gesteck",
  "Blumendekoration",
  "Lieferung",
  "Pflege und Service"
];

const DEFAULT_CUSTOMERS = [
  {
    company: "Arbeiter-Samariter-Bund",
    extra: "Landesverband Berlin e.V.",
    street: "Am Köllnischen Park 1",
    zip: "10179",
    city: "Berlin",
    taxType: "none",
    taxId: ""
  }
];

const state = loadState();

const fields = {
  customerSelect: document.querySelector("#customerSelect"),
  customerCompany: document.querySelector("#customerCompany"),
  customerExtra: document.querySelector("#customerExtra"),
  customerStreet: document.querySelector("#customerStreet"),
  customerZip: document.querySelector("#customerZip"),
  customerCity: document.querySelector("#customerCity"),
  customerTaxType: document.querySelector("#customerTaxType"),
  customerTaxId: document.querySelector("#customerTaxId"),
  invoiceNumber: document.querySelector("#invoiceNumber"),
  invoiceDate: document.querySelector("#invoiceDate"),
  invoiceCity: document.querySelector("#invoiceCity"),
  taxRate: document.querySelector("#taxRate"),
  lineItems: document.querySelector("#lineItems"),
  productOptions: document.querySelector("#productOptions"),
  newProduct: document.querySelector("#newProduct")
};

const preview = {
  customer: document.querySelector("#previewCustomer"),
  date: document.querySelector("#previewDate"),
  title: document.querySelector("#previewTitle"),
  lines: document.querySelector("#previewLines"),
  net: document.querySelector("#netTotal"),
  tax: document.querySelector("#taxTotal"),
  gross: document.querySelector("#grossTotal")
};

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    return JSON.parse(saved);
  }

  const today = new Date();
  return {
    customers: DEFAULT_CUSTOMERS,
    products: DEFAULT_PRODUCTS,
    invoice: {
      number: invoiceNumberFromDate(today),
      date: toInputDate(today),
      city: "Berlin",
      taxRate: 7,
      customer: DEFAULT_CUSTOMERS[0],
      lines: [
        {
          quantity: 4,
          unit: "Stück",
          description: "Blumenstrauß",
          deliveryDate: toInputDate(today),
          unitPrice: 12
        }
      ]
    }
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function invoiceNumberFromDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}.${month}.01`;
}

function toInputDate(date) {
  return date.toISOString().slice(0, 10);
}

function parseNumber(value) {
  const normalized = String(value).replace(",", ".");
  const number = Number.parseFloat(normalized);
  return Number.isFinite(number) ? number : 0;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR"
  }).format(value);
}

function formatDate(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${day}.${month}.${year}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function customerLabel(customer) {
  return [customer.company, customer.extra].filter(Boolean).join(" - ");
}

function renderCustomerOptions() {
  fields.customerSelect.innerHTML = '<option value="">Neuen Kunden eingeben</option>';
  state.customers.forEach((customer, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = customerLabel(customer) || `Kunde ${index + 1}`;
    fields.customerSelect.append(option);
  });
}

function renderProductOptions() {
  fields.productOptions.innerHTML = "";
  state.products.forEach((product) => {
    const option = document.createElement("option");
    option.value = product;
    fields.productOptions.append(option);
  });
}

function fillForm() {
  const { invoice } = state;
  fields.customerCompany.value = invoice.customer.company || "";
  fields.customerExtra.value = invoice.customer.extra || "";
  fields.customerStreet.value = invoice.customer.street || "";
  fields.customerZip.value = invoice.customer.zip || "";
  fields.customerCity.value = invoice.customer.city || "";
  fields.customerTaxType.value = invoice.customer.taxType || "none";
  fields.customerTaxId.value = invoice.customer.taxId || "";
  fields.invoiceNumber.value = invoice.number || "";
  fields.invoiceDate.value = invoice.date || "";
  fields.invoiceCity.value = invoice.city || "Berlin";
  fields.taxRate.value = invoice.taxRate ?? 7;
  updateCustomerTaxField();
}

function readCustomerFromForm() {
  return {
    company: fields.customerCompany.value.trim(),
    extra: fields.customerExtra.value.trim(),
    street: fields.customerStreet.value.trim(),
    zip: fields.customerZip.value.trim(),
    city: fields.customerCity.value.trim(),
    taxType: fields.customerTaxType.value,
    taxId: fields.customerTaxId.value.trim()
  };
}

function updateCustomerTaxField() {
  const hasTaxId = fields.customerTaxType.value !== "none";
  fields.customerTaxId.disabled = !hasTaxId;
  fields.customerTaxId.placeholder = hasTaxId ? "z. B. DE123456789" : "keine Angabe";
}

function syncInvoiceFromForm() {
  state.invoice.customer = readCustomerFromForm();
  state.invoice.number = fields.invoiceNumber.value.trim();
  state.invoice.date = fields.invoiceDate.value;
  state.invoice.city = fields.invoiceCity.value.trim() || "Berlin";
  state.invoice.taxRate = parseNumber(fields.taxRate.value);
}

function renderLines() {
  fields.lineItems.innerHTML = "";
  state.invoice.lines.forEach((line, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="pos">${index + 1}</td>
      <td><input type="number" min="0" step="1" data-field="quantity" data-index="${index}" value="${escapeHtml(line.quantity ?? 1)}"></td>
      <td>
        <select data-field="unit" data-index="${index}">
          ${["Stück", "Bund", "Pauschal", "Std."].map((unit) => `<option value="${unit}" ${unit === line.unit ? "selected" : ""}>${unit}</option>`).join("")}
        </select>
      </td>
      <td><input list="productOptions" data-field="description" data-index="${index}" value="${escapeHtml(line.description || "")}"></td>
      <td><input type="date" data-field="deliveryDate" data-index="${index}" value="${escapeHtml(line.deliveryDate || "")}"></td>
      <td><input type="number" min="0" step="0.01" data-field="unitPrice" data-index="${index}" value="${escapeHtml(line.unitPrice ?? 0)}"></td>
      <td data-line-total="${index}">${formatCurrency((line.quantity || 0) * (line.unitPrice || 0))}</td>
      <td><button class="remove-line" type="button" data-remove="${index}" aria-label="Zeile entfernen">×</button></td>
    `;
    fields.lineItems.append(tr);
  });
}

function renderPreview() {
  syncInvoiceFromForm();
  const customerLines = [
    state.invoice.customer.company,
    state.invoice.customer.extra,
    state.invoice.customer.street,
    [state.invoice.customer.zip, state.invoice.customer.city].filter(Boolean).join(" "),
    customerTaxLine(state.invoice.customer)
  ].filter(Boolean);

  preview.customer.textContent = customerLines.join("\n");
  preview.date.textContent = `${state.invoice.city} den ${formatDate(state.invoice.date)}`;
  preview.title.textContent = `Rechnung ${state.invoice.number || ""}`.trim();
  preview.lines.innerHTML = "";

  let grossTotal = 0;
  state.invoice.lines.forEach((line, index) => {
    const quantity = parseNumber(line.quantity);
    const unitPrice = parseNumber(line.unitPrice);
    const total = quantity * unitPrice;
    grossTotal += total;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${quantity}</td>
      <td>${line.unit || ""}</td>
      <td>${line.description || ""}</td>
      <td>${formatDate(line.deliveryDate)}</td>
      <td>${formatCurrency(unitPrice)}</td>
      <td>${formatCurrency(total)}</td>
    `;
    preview.lines.append(tr);
  });

  const taxRate = parseNumber(state.invoice.taxRate);
  const netTotal = grossTotal / (1 + taxRate / 100);
  const taxTotal = grossTotal - netTotal;
  preview.net.textContent = formatCurrency(netTotal);
  preview.tax.textContent = formatCurrency(taxTotal);
  preview.gross.textContent = formatCurrency(grossTotal);
  document.querySelector("#taxTotal").parentElement.querySelector("dt").textContent = `MWST % (${taxRate}%)`;
  saveState();
}

function customerTaxLine(customer) {
  if (!customer.taxId || customer.taxType === "none") return "";
  const labels = {
    taxNumber: "StNr.:",
    vatId: "USt.ID:"
  };
  return `${labels[customer.taxType] || ""} ${customer.taxId}`.trim();
}

function updateLineTotal(index) {
  const line = state.invoice.lines[index];
  const totalCell = fields.lineItems.querySelector(`[data-line-total="${index}"]`);
  if (totalCell) {
    totalCell.textContent = formatCurrency(parseNumber(line.quantity) * parseNumber(line.unitPrice));
  }
}

function addLine() {
  state.invoice.lines.push({
    quantity: 1,
    unit: "Stück",
    description: state.products[0] || "",
    deliveryDate: state.invoice.date,
    unitPrice: 0
  });
  renderLines();
  renderPreview();
}

function resetInvoice() {
  const today = new Date();
  state.invoice = {
    number: invoiceNumberFromDate(today),
    date: toInputDate(today),
    city: "Berlin",
    taxRate: 7,
    customer: {},
    lines: [
      {
        quantity: 1,
        unit: "Stück",
        description: state.products[0] || "",
        deliveryDate: toInputDate(today),
        unitPrice: 0
      }
    ]
  };
  fields.customerSelect.value = "";
  fillForm();
  renderLines();
  renderPreview();
}

function saveCustomer() {
  syncInvoiceFromForm();
  const customer = state.invoice.customer;
  if (!customer.company && !customer.street) return;

  const existingIndex = state.customers.findIndex((item) =>
    item.company.toLowerCase() === customer.company.toLowerCase() &&
    item.street.toLowerCase() === customer.street.toLowerCase()
  );

  if (existingIndex >= 0) {
    state.customers[existingIndex] = customer;
    renderCustomerOptions();
    fields.customerSelect.value = String(existingIndex);
  } else {
    state.customers.push(customer);
    renderCustomerOptions();
    fields.customerSelect.value = String(state.customers.length - 1);
  }

  saveState();
}

function saveProduct() {
  const product = fields.newProduct.value.trim();
  if (!product) return;
  const exists = state.products.some((item) => item.toLowerCase() === product.toLowerCase());
  if (!exists) {
    state.products.push(product);
    state.products.sort((a, b) => a.localeCompare(b, "de"));
  }
  fields.newProduct.value = "";
  renderProductOptions();
  saveState();
}

function bindEvents() {
  document.querySelector("#addLine").addEventListener("click", addLine);
  document.querySelector("#resetInvoice").addEventListener("click", resetInvoice);
  document.querySelector("#printInvoice").addEventListener("click", () => window.print());
  document.querySelector("#saveCustomer").addEventListener("click", saveCustomer);
  document.querySelector("#saveProduct").addEventListener("click", saveProduct);

  fields.customerSelect.addEventListener("change", () => {
    const selected = state.customers[Number(fields.customerSelect.value)];
    if (!selected) return;
    state.invoice.customer = { ...selected };
    fillForm();
    renderPreview();
  });

  [
    fields.customerCompany,
    fields.customerExtra,
    fields.customerStreet,
    fields.customerZip,
    fields.customerCity,
    fields.customerTaxType,
    fields.customerTaxId,
    fields.invoiceNumber,
    fields.invoiceDate,
    fields.invoiceCity,
    fields.taxRate
  ].forEach((field) => field.addEventListener("input", renderPreview));

  fields.customerTaxType.addEventListener("change", () => {
    updateCustomerTaxField();
    renderPreview();
  });

  fields.lineItems.addEventListener("input", (event) => {
    const target = event.target;
    const index = Number(target.dataset.index);
    const field = target.dataset.field;
    if (!field) return;
    const value = field === "quantity" || field === "unitPrice" ? parseNumber(target.value) : target.value;
    state.invoice.lines[index][field] = value;
    updateLineTotal(index);
    renderPreview();
  });

  fields.lineItems.addEventListener("click", (event) => {
    const removeIndex = event.target.dataset.remove;
    if (removeIndex === undefined) return;
    state.invoice.lines.splice(Number(removeIndex), 1);
    if (state.invoice.lines.length === 0) addLine();
    renderLines();
    renderPreview();
  });
}

renderCustomerOptions();
renderProductOptions();
fillForm();
renderLines();
renderPreview();
bindEvents();
