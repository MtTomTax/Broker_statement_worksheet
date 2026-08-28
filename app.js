// ============================================================
// Montana Broker Statement Adjustment Worksheet
// Calculation logic mirrors the original spreadsheet formulas
// exactly (see README for the formula-to-code map).
//
// No client data is ever written to localStorage, sessionStorage,
// cookies, or any network request — everything lives only in the
// in-memory `state` object below and disappears on reload or when
// "New worksheet" is clicked. That's deliberate, for confidentiality.
// ============================================================

/** @type {{
 *  client: {name:string, year:string, preparer:string, date:string},
 *  step1: {box3: string},
 *  step2: {ref: string, rows: Array<{fund:string, total:string, pct:string, direct:string}>},
 *  step3: {rows: Array<{fund:string, total:string, capGain:string, pct:string, direct:string}>},
 *  step4: {ref: string, rows: Array<{fund:string, total:string, capGain:string, pct:string, direct:string}>}
 * }}
 */
let state = defaultState();

function defaultState() {
  return {
    client: { name: "", year: "", preparer: "", date: "" },
    step1: { box3: "" },
    step2: { ref: "", rows: [blankRow2(), blankRow2()] },
    step3: { rows: [blankRow3(), blankRow3()] },
    step4: { ref: "", rows: [blankRow3(), blankRow3()] },
  };
}
function blankRow2() { return { fund: "", total: "", pct: "", direct: "" }; }
function blankRow3() { return { fund: "", total: "", capGain: "", pct: "", direct: "" }; }

// ---------- number helpers ----------
const num = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
const hasVal = (v) => v !== "" && v !== null && v !== undefined;
const fmt = (n) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtSigned = (n) => (n < 0 ? "-$" + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : fmt(n));

// ============================================================
// Calculations — each mirrors a named cell/formula in the sheet
// ============================================================

function calcStep1() {
  const box3 = num(state.step1.box3);
  return { subtraction: box3 }; // F10 = F7
}

function calcStep2() {
  const ref = num(state.step2.ref); // F8
  const rows = state.step2.rows.map((r) => {
    // E_i = IF(D<>"", D, IF(C<>"", B*C, 0))
    let calc;
    if (hasVal(r.direct)) calc = num(r.direct);
    else if (hasVal(r.pct)) calc = num(r.total) * (num(r.pct) / 100);
    else calc = 0;
    return { ...r, calc };
  });
  const totalB = rows.reduce((s, r) => s + num(r.total), 0); // B21
  const totalE = rows.reduce((s, r) => s + r.calc, 0); // E21
  const matches = Math.round((totalB - ref) * 100) / 100 === 0; // A22 check
  const addition = ref - totalE; // F24
  return { rows, totalB, totalE, matches, addition, ref };
}

function calcStep3() {
  const rows = state.step3.rows.map((r) => {
    // D_i = IF(B<>"", B - IF(C<>"",C,0), "")
    const div = hasVal(r.total) ? num(r.total) - num(r.capGain || 0) : "";
    // G_i = IF(F<>"", F, IF(AND(D<>"",E<>""), D*E, 0))
    let usInterest;
    if (hasVal(r.direct)) usInterest = num(r.direct);
    else if (div !== "" && hasVal(r.pct)) usInterest = div * (num(r.pct) / 100);
    else usInterest = 0;
    return { ...r, div, usInterest };
  });
  const totalB = rows.reduce((s, r) => s + num(r.total), 0);
  const totalC = rows.reduce((s, r) => s + num(r.capGain), 0);
  const totalD = rows.reduce((s, r) => s + (r.div === "" ? 0 : r.div), 0);
  const totalG = rows.reduce((s, r) => s + r.usInterest, 0);
  return { rows, totalB, totalC, totalD, totalG, subtraction: totalG };
}

function calcStep4() {
  const ref = num(state.step4.ref); // F9
  const rows = state.step4.rows.map((r) => {
    const div = hasVal(r.total) ? num(r.total) - num(r.capGain || 0) : "";
    let calc;
    if (hasVal(r.direct)) calc = num(r.direct);
    else if (div !== "" && hasVal(r.pct)) calc = div * (num(r.pct) / 100);
    else calc = 0;
    return { ...r, div, calc };
  });
  const totalB = rows.reduce((s, r) => s + num(r.total), 0);
  const totalC = rows.reduce((s, r) => s + num(r.capGain), 0);
  const totalD = rows.reduce((s, r) => s + (r.div === "" ? 0 : r.div), 0);
  const totalG = rows.reduce((s, r) => s + r.calc, 0);
  const matches = Math.round((totalB - ref) * 100) / 100 === 0;
  const addition = ref - totalG;
  return { rows, totalB, totalC, totalD, totalG, matches, addition, ref };
}

// ============================================================
// Rendering
// ============================================================

function renderAll() {
  renderLetterhead();
  renderStep1();
  renderStep2();
  renderStep3();
  renderStep4();
  renderSummary();
}

function renderLetterhead() {
  $("#clientName").value = state.client.name;
  $("#taxYear").value = state.client.year;
  $("#preparer").value = state.client.preparer;
  $("#date").value = state.client.date;
}

function renderStep1() {
  $("#s1-box3").value = state.step1.box3;
  const r = calcStep1();
  $("#s1-result").textContent = fmt(r.subtraction);
}

function renderStep2() {
  $("#s2-ref").value = state.step2.ref;
  const tbody = $("#s2-rows");
  tbody.innerHTML = "";
  const r = calcStep2();
  r.rows.forEach((row, i) => {
    tbody.appendChild(fundRow2(row, i, "s2", r.rows.length > 1));
  });
  $("#s2-total-b").textContent = fmt(r.totalB);
  $("#s2-total-e").textContent = fmt(r.totalE);
  $("#s2-result").textContent = fmt(r.addition);

  const check = $("#s2-check");
  if (!hasVal(state.step2.ref) && r.totalB === 0) {
    check.textContent = "";
    check.className = "check-msg";
  } else if (r.matches) {
    check.textContent = "✓ Fund totals match the Box 8 reference total above.";
    check.className = "check-msg ok";
  } else {
    check.textContent = "⚠ Fund totals do not match the Box 8 reference total — double-check your entries.";
    check.className = "check-msg warn";
  }
}

function renderStep3() {
  const tbody = $("#s3-rows");
  tbody.innerHTML = "";
  const r = calcStep3();
  r.rows.forEach((row, i) => {
    tbody.appendChild(fundRowCapGain(row, i, "s3", r.rows.length > 1));
  });
  $("#s3-total-b").textContent = fmt(r.totalB);
  $("#s3-total-c").textContent = fmt(r.totalC);
  $("#s3-total-d").textContent = fmt(r.totalD);
  $("#s3-total-g").textContent = fmt(r.totalG);
  $("#s3-result").textContent = fmt(r.subtraction);
}

function renderStep4() {
  $("#s4-ref").value = state.step4.ref;
  const tbody = $("#s4-rows");
  tbody.innerHTML = "";
  const r = calcStep4();
  r.rows.forEach((row, i) => {
    tbody.appendChild(fundRowCapGain(row, i, "s4", r.rows.length > 1));
  });
  $("#s4-total-b").textContent = fmt(r.totalB);
  $("#s4-total-c").textContent = fmt(r.totalC);
  $("#s4-total-d").textContent = fmt(r.totalD);
  $("#s4-total-g").textContent = fmt(r.totalG);
  $("#s4-result").textContent = fmt(r.addition);

  const check = $("#s4-check");
  if (!hasVal(state.step4.ref) && r.totalB === 0) {
    check.textContent = "";
    check.className = "check-msg";
  } else if (r.matches) {
    check.textContent = "✓ Fund totals match the Box 12 reference total above.";
    check.className = "check-msg ok";
  } else {
    check.textContent = "⚠ Fund totals do not match the Box 12 reference total — double-check your entries.";
    check.className = "check-msg warn";
  }
}

function renderSummary() {
  $("#summary-client").textContent = "Client: " + (state.client.name || "—") +
    (state.client.year ? "  ·  Tax year " + state.client.year : "");
  $("#sum-box3").textContent = fmt(calcStep1().subtraction);
  $("#sum-box8").textContent = fmt(calcStep2().addition);
  $("#sum-div1a").textContent = fmt(calcStep3().subtraction);
  $("#sum-box12").textContent = fmt(calcStep4().addition);
}

// ---------- row builders ----------

function orDividerCell() {
  const td = document.createElement("td");
  td.className = "col-or";
  td.textContent = "or";
  return td;
}

function fundRow2(row, idx, prefix, removable) {
  const tr = document.createElement("tr");

  tr.appendChild(cellInput("text", row.fund, (v) => (state[stepKey(prefix)].rows[idx].fund = v), "Fund name"));
  tr.appendChild(cellInput("number", row.total, (v) => (state[stepKey(prefix)].rows[idx].total = v)));
  tr.appendChild(cellInput("number", row.pct, (v) => (state[stepKey(prefix)].rows[idx].pct = v), "e.g. 15"));
  tr.appendChild(orDividerCell());
  tr.appendChild(cellInput("number", row.direct, (v) => (state[stepKey(prefix)].rows[idx].direct = v)));

  const calcTd = document.createElement("td");
  calcTd.className = "col-money col-calc-cell";
  calcTd.textContent = fmt(row.calc);
  tr.appendChild(calcTd);

  tr.appendChild(removeCell(prefix, idx, removable));
  return tr;
}

// Shared by Step 3 and Step 4 — both tables have the same 9-column shape:
// fund, total distribution, capital gain to subtract, dividend distributions
// (calculated), a %, an "or" divider, an optional direct $, a final
// calculated $, remove.
function fundRowCapGain(row, idx, prefix, removable) {
  const tr = document.createElement("tr");
  const key = stepKey(prefix);
  const pctHint = prefix === "s3" ? "e.g. 40" : "e.g. 15";
  const finalValue = prefix === "s3" ? row.usInterest : row.calc;

  tr.appendChild(cellInput("text", row.fund, (v) => (state[key].rows[idx].fund = v), "Fund name"));
  tr.appendChild(cellInput("number", row.total, (v) => (state[key].rows[idx].total = v)));
  tr.appendChild(cellInput("number", row.capGain, (v) => (state[key].rows[idx].capGain = v)));

  const divTd = document.createElement("td");
  divTd.className = "col-money col-calc-cell";
  divTd.textContent = row.div === "" ? "—" : fmt(row.div);
  tr.appendChild(divTd);

  tr.appendChild(cellInput("number", row.pct, (v) => (state[key].rows[idx].pct = v), pctHint));
  tr.appendChild(orDividerCell());
  tr.appendChild(cellInput("number", row.direct, (v) => (state[key].rows[idx].direct = v)));

  const calcTd = document.createElement("td");
  calcTd.className = "col-money col-calc-cell";
  calcTd.textContent = fmt(finalValue);
  tr.appendChild(calcTd);

  tr.appendChild(removeCell(prefix, idx, removable));
  return tr;
}

function cellInput(type, value, onChange, placeholder) {
  const td = document.createElement("td");
  const input = document.createElement("input");
  input.type = type;
  if (type === "number") { input.step = "0.01"; input.inputMode = "decimal"; }
  input.value = value;
  if (placeholder) input.placeholder = placeholder;
  input.addEventListener("input", (e) => {
    onChange(e.target.value);
    renderAllFromStep(); // recalc without losing focus
  });
  td.appendChild(input);
  return td;
}

function removeCell(prefix, idx, removable) {
  const td = document.createElement("td");
  if (removable) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "remove-row-btn";
    btn.title = "Remove fund";
    btn.textContent = "×";
    btn.addEventListener("click", () => {
      state[stepKey(prefix)].rows.splice(idx, 1);
      renderAll();
    });
    td.appendChild(btn);
  }
  return td;
}

function stepKey(prefix) {
  return { s2: "step2", s3: "step3", s4: "step4" }[prefix];
}

// ---------- keyboard navigation (arrow keys + Enter between fund-table cells) ----------
//
// Tab/Shift+Tab already move between cells via normal browser focus order —
// this adds the spreadsheet-style extras on top:
//   Up/Down    move to the same column in the row above/below
//   Left/Right jump cells too, but only in the Fund name column, and only
//              when the cursor is already at the start/end of the text —
//              number inputs don't reliably support reading cursor
//              position, so their Left/Right stays native (edits the digits)
//   Enter      moves down a row (Shift+Enter moves up); pressing Enter on
//              the last row adds a new fund row and drops you into it
function attachGridNavigation(tbody, addBtn) {
  tbody.addEventListener("keydown", (e) => {
    const input = e.target;
    if (input.tagName !== "INPUT") return;
    const tr = input.closest("tr");
    if (!tr) return;

    const focusCell = (rows, r, c) => {
      const targetRow = rows[r];
      if (!targetRow) return false;
      const inputs = Array.from(targetRow.querySelectorAll("input"));
      const target = inputs[c];
      if (!target) return false;
      target.focus();
      target.select();
      return true;
    };

    const rowInputs = Array.from(tr.querySelectorAll("input"));
    const colIdx = rowInputs.indexOf(input);
    let allRows = Array.from(tbody.children);
    const rowIdx = allRows.indexOf(tr);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusCell(allRows, rowIdx + 1, colIdx);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusCell(allRows, rowIdx - 1, colIdx);
    } else if (e.key === "ArrowRight" && input.type === "text") {
      if (input.selectionStart !== input.value.length || input.selectionEnd !== input.value.length) return;
      e.preventDefault();
      focusCell(allRows, rowIdx, colIdx + 1);
    } else if (e.key === "ArrowLeft" && input.type === "text") {
      if (input.selectionStart !== 0 || input.selectionEnd !== 0) return;
      e.preventDefault();
      focusCell(allRows, rowIdx, colIdx - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) {
        focusCell(allRows, rowIdx - 1, colIdx);
        return;
      }
      const moved = focusCell(allRows, rowIdx + 1, colIdx);
      if (!moved && addBtn) {
        addBtn.click(); // adds a row and re-renders
        allRows = Array.from(tbody.children);
        focusCell(allRows, rowIdx + 1, colIdx);
      }
    }
  });
}

// Re-render calculated cells only (avoid rebuilding inputs mid-typing → focus loss).
// Simplicity wins here: full re-render is fine since we rebuild rows each time,
// but to keep focus while typing, only recalc + patch text, not inputs.
function renderAllFromStep() {
  patchStep1();
  patchStep2();
  patchStep3();
  patchStep4();
  renderSummary();
}

function patchStep1() {
  const r = calcStep1();
  $("#s1-result").textContent = fmt(r.subtraction);
}

function patchStep2() {
  const r = calcStep2();
  const rows = $("#s2-rows").children;
  r.rows.forEach((row, i) => {
    if (rows[i]) rows[i].querySelector(".col-calc-cell").textContent = fmt(row.calc);
  });
  $("#s2-total-b").textContent = fmt(r.totalB);
  $("#s2-total-e").textContent = fmt(r.totalE);
  $("#s2-result").textContent = fmt(r.addition);
  const check = $("#s2-check");
  if (!hasVal(state.step2.ref) && r.totalB === 0) {
    check.textContent = ""; check.className = "check-msg";
  } else if (r.matches) {
    check.textContent = "✓ Fund totals match the Box 8 reference total above.";
    check.className = "check-msg ok";
  } else {
    check.textContent = "⚠ Fund totals do not match the Box 8 reference total — double-check your entries.";
    check.className = "check-msg warn";
  }
}

function patchStep3() {
  const r = calcStep3();
  const rows = $("#s3-rows").children;
  r.rows.forEach((row, i) => {
    if (rows[i]) {
      const cells = rows[i].querySelectorAll(".col-calc-cell");
      cells[0].textContent = row.div === "" ? "—" : fmt(row.div);
      cells[1].textContent = fmt(row.usInterest);
    }
  });
  $("#s3-total-b").textContent = fmt(r.totalB);
  $("#s3-total-c").textContent = fmt(r.totalC);
  $("#s3-total-d").textContent = fmt(r.totalD);
  $("#s3-total-g").textContent = fmt(r.totalG);
  $("#s3-result").textContent = fmt(r.subtraction);
}

function patchStep4() {
  const r = calcStep4();
  const rows = $("#s4-rows").children;
  r.rows.forEach((row, i) => {
    if (rows[i]) {
      const cells = rows[i].querySelectorAll(".col-calc-cell");
      cells[0].textContent = row.div === "" ? "—" : fmt(row.div);
      cells[1].textContent = fmt(row.calc);
    }
  });
  $("#s4-total-b").textContent = fmt(r.totalB);
  $("#s4-total-c").textContent = fmt(r.totalC);
  $("#s4-total-d").textContent = fmt(r.totalD);
  $("#s4-total-g").textContent = fmt(r.totalG);
  $("#s4-result").textContent = fmt(r.addition);
  const check = $("#s4-check");
  if (!hasVal(state.step4.ref) && r.totalB === 0) {
    check.textContent = ""; check.className = "check-msg";
  } else if (r.matches) {
    check.textContent = "✓ Fund totals match the Box 12 reference total above.";
    check.className = "check-msg ok";
  } else {
    check.textContent = "⚠ Fund totals do not match the Box 12 reference total — double-check your entries.";
    check.className = "check-msg warn";
  }
}

// ============================================================
// Wiring
// ============================================================

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function initNav() {
  $$(".step-btn").forEach((btn) => {
    btn.addEventListener("click", () => showPanel(btn.dataset.panel));
  });
  $$(".question-card").forEach((card) => {
    card.addEventListener("click", () => showPanel(card.dataset.jump));
  });
}

function showPanel(name) {
  $$(".panel").forEach((p) => p.classList.remove("active"));
  $$(".step-btn").forEach((b) => b.classList.remove("active"));
  $("#panel-" + name).classList.add("active");
  const btn = $(`.step-btn[data-panel="${name}"]`);
  if (btn) btn.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function initLetterhead() {
  $("#clientName").addEventListener("input", (e) => { state.client.name = e.target.value; renderSummary(); });
  $("#taxYear").addEventListener("input", (e) => { state.client.year = e.target.value; renderSummary(); });
  $("#preparer").addEventListener("input", (e) => { state.client.preparer = e.target.value; });
  $("#date").addEventListener("input", (e) => { state.client.date = e.target.value; });
}

function initStep1() {
  $("#s1-box3").addEventListener("input", (e) => { state.step1.box3 = e.target.value; renderAllFromStep(); });
}

function initStep2() {
  $("#s2-ref").addEventListener("input", (e) => { state.step2.ref = e.target.value; renderAllFromStep(); });
  $("#s2-add-row").addEventListener("click", () => { state.step2.rows.push(blankRow2()); renderAll(); });
}

function initStep3() {
  $("#s3-add-row").addEventListener("click", () => { state.step3.rows.push(blankRow3()); renderAll(); });
}

function initStep4() {
  $("#s4-ref").addEventListener("input", (e) => { state.step4.ref = e.target.value; renderAllFromStep(); });
  $("#s4-add-row").addEventListener("click", () => { state.step4.rows.push(blankRow3()); renderAll(); });
}

function initPrintButtons() {
  // Each print button lives inside its own panel, so by the time it's
  // clickable that panel is already the active (visible) one — just print it.
  $$(".print-page-btn").forEach((btn) => {
    btn.addEventListener("click", () => window.print());
  });
}

function initResetButton() {
  $("#resetBtn").addEventListener("click", () => {
    if (confirm("Start a new worksheet? This clears every field on the page.")) {
      state = defaultState();
      renderAll();
      flashStatus("Started a new worksheet.");
    }
  });
}

let statusTimer;
function flashStatus(msg) {
  const el = $("#saveStatus");
  el.textContent = msg;
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => (el.textContent = ""), 4000);
}

// ============================================================
// Boot
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initLetterhead();
  initStep1();
  initStep2();
  initStep3();
  initStep4();
  initPrintButtons();
  initResetButton();
  attachGridNavigation($("#s2-rows"), $("#s2-add-row"));
  attachGridNavigation($("#s3-rows"), $("#s3-add-row"));
  attachGridNavigation($("#s4-rows"), $("#s4-add-row"));

  renderAll();
  showPanel("start");
});
