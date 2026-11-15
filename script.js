// Formata número com 2 casas decimais
const f = n => n.toFixed(2);

// 1) Cria os campos de entrada conforme as quantidades escolhidas
function gerarCampos() {
  const qtdR = Number(document.getElementById("qtdR").value);
  const qtdV = Number(document.getElementById("qtdV").value);

  if (qtdR < 1 || qtdR > 5 || qtdV < 1 || qtdV > 10) {
    alert("Use de 1 a 5 resistências e de 1 a 10 voltagens.");
    return;
  }

  let html = "";
  for (let i = 1; i <= qtdR; i++) {
    html += `<label>R${i} (Ω): <input type="number" class="r" value="10" min="0.01"></label>`;
  }
  html += "<br>";
  for (let i = 1; i <= qtdV; i++) {
    html += `<label>V${i} (V): <input type="number" class="v" value="12"></label>`;
  }
  document.getElementById("campos").innerHTML = html;
}

// 2) Lê os valores digitados e devolve duas listas: r (resistências) e v (tensões)
function lerValores() {
  const r = [];
  const v = [];
  document.querySelectorAll(".r").forEach(campo => r.push(Number(campo.value)));
  document.querySelectorAll(".v").forEach(campo => v.push(Number(campo.value)));
  return { r, v };
}

// 3) Série: R_eq = soma, corrente igual em todos
// (as fontes são ligadas em série, então a tensão total é a soma delas)
function calcularSerie(r, v) {
  const vt = v.reduce((a, b) => a + b, 0);
  const req = r.reduce((a, b) => a + b, 0);
  const i = vt / req;

  const linhas = [
    `Tensão total: ${f(vt)} V`,
    `R equivalente: ${f(req)} Ω`,
    `Corrente (igual em todos): ${f(i)} A`
  ];
  r.forEach((ri, k) => linhas.push(`R${k + 1}: tensão = ${f(ri * i)} V`));
  return linhas;
}

// 4) Paralelo: 1/R_eq = soma de 1/R, tensão igual em todos
function calcularParalelo(r, v) {
  const vt = v.reduce((a, b) => a + b, 0);
  const req = 1 / r.reduce((a, b) => a + 1 / b, 0);

  const linhas = [
    `Tensão (igual em todos): ${f(vt)} V`,
    `R equivalente: ${f(req)} Ω`,
    `Corrente total: ${f(vt / req)} A`
  ];
  r.forEach((ri, k) => linhas.push(`R${k + 1}: corrente = ${f(vt / ri)} A`));
  return linhas;
}

// 5) Misto: usa só R1, R2 e R3, conforme o modelo escolhido
function calcularMisto(r, v, modelo) {
  const vt = v.reduce((a, b) => a + b, 0);
  const [r1, r2, r3] = r;

  if (modelo === "1") {
    // R1 em série com (R2 // R3)
    const rp = (r2 * r3) / (r2 + r3);
    const req = r1 + rp;
    const i = vt / req;
    const vp = i * rp; // tensão no trecho paralelo
    return [
      `Tensão total: ${f(vt)} V`,
      `R equivalente: ${f(req)} Ω`,
      `Corrente total: ${f(i)} A`,
      `R1: ${f(i * r1)} V e ${f(i)} A`,
      `R2: ${f(vp)} V e ${f(vp / r2)} A`,
      `R3: ${f(vp)} V e ${f(vp / r3)} A`
    ];
  }

  // (R1 + R2) // R3
  const rs = r1 + r2;
  const req = (rs * r3) / (rs + r3);
  const iRamo = vt / rs; // corrente no ramo R1 + R2
  return [
    `Tensão total: ${f(vt)} V`,
    `R equivalente: ${f(req)} Ω`,
    `Corrente total: ${f(vt / req)} A`,
    `R1: ${f(iRamo * r1)} V e ${f(iRamo)} A`,
    `R2: ${f(iRamo * r2)} V e ${f(iRamo)} A`,
    `R3: ${f(vt)} V e ${f(vt / r3)} A`
  ];
}

// 6) Desenha o circuito em SVG (o JS monta as tags usando os valores digitados)
function desenharCircuito(tipo, r, v, modelo) {
  const vt = v.reduce((a, b) => a + b, 0);
  const cor = "#14263a";
  const cobre = "#b5651d";

  // Peças básicas do desenho
  const fio = (x1, y1, x2, y2) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${cor}" stroke-width="2"/>`;

  const resH = (cx, cy, nome, valor) =>
    `<rect x="${cx - 30}" y="${cy - 12}" width="60" height="24" fill="#fff" stroke="${cobre}" stroke-width="2"/>` +
    `<text x="${cx}" y="${cy + 5}" text-anchor="middle" font-size="12">${nome}</text>` +
    `<text x="${cx}" y="${cy + 28}" text-anchor="middle" font-size="11">${valor} Ω</text>`;

  const resV = (cx, cy, nome, valor) =>
    `<rect x="${cx - 12}" y="${cy - 28}" width="24" height="56" fill="#fff" stroke="${cobre}" stroke-width="2"/>` +
    `<text x="${cx + 18}" y="${cy - 2}" font-size="12">${nome}</text>` +
    `<text x="${cx + 18}" y="${cy + 13}" font-size="11">${valor} Ω</text>`;

  const bateria = (x, y1, y2) => {
    const m = (y1 + y2) / 2;
    return fio(x, y1, x, m - 4) + fio(x, m + 4, x, y2) +
      `<line x1="${x - 14}" y1="${m - 4}" x2="${x + 14}" y2="${m - 4}" stroke="${cor}" stroke-width="3"/>` +
      `<line x1="${x - 8}" y1="${m + 4}" x2="${x + 8}" y2="${m + 4}" stroke="${cor}" stroke-width="3"/>` +
      `<text x="${x + 20}" y="${m + 4}" font-size="12">${f(vt)} V</text>`;
  };

  let s = "";
  let altura = 160;

  if (tipo === "serie" || (tipo === "paralelo" && r.length === 1)) {
    // Resistores um depois do outro, no fio de cima
    // (com 1 resistência só, série e paralelo são o mesmo desenho)
    const passo = 520 / r.length;
    s += fio(40, 30, 560, 30) + fio(560, 30, 560, 130) + fio(560, 130, 40, 130) + bateria(40, 30, 130);
    r.forEach((ri, i) => { s += resH(40 + passo * (i + 0.5), 30, "R" + (i + 1), ri); });

  } else if (tipo === "paralelo" || modelo === "2") {
    // Cada ramo é uma linha horizontal; no misto 2, o primeiro ramo tem R1 e R2
    const ramos = tipo === "paralelo" ? r.map((_, i) => [i]) : [[0, 1], [2]];
    const yBaixo = 30 + 60 * (ramos.length - 1);
    altura = yBaixo + 50;
    s += bateria(40, 30, yBaixo) + fio(40, 30, 120, 30) + fio(40, yBaixo, 120, yBaixo);
    s += fio(120, 30, 120, yBaixo) + fio(500, 30, 500, yBaixo);
    ramos.forEach((lista, k) => {
      const y = 30 + 60 * k;
      s += fio(120, y, 500, y);
      lista.forEach((idx, j) => {
        s += resH(120 + (380 / lista.length) * (j + 0.5), y, "R" + (idx + 1), r[idx]);
      });
    });

  } else {
    // Misto 1: R1 em série e depois R2 e R3 em paralelo
    s += fio(40, 30, 480, 30) + fio(40, 130, 480, 130) + bateria(40, 30, 130);
    s += resH(190, 30, "R1", r[0]);
    s += fio(350, 30, 350, 130) + resV(350, 80, "R2", r[1]);
    s += fio(480, 30, 480, 130) + resV(480, 80, "R3", r[2]);
  }

  const svg = document.getElementById("circuito");
  svg.setAttribute("viewBox", `0 0 600 ${altura}`);
  svg.innerHTML = s;
}

// Liga tudo: lê os valores, escolhe o cálculo, mostra o resultado e desenha
function executar(tipo) {
  const { r, v } = lerValores();

  if (r.length === 0) {
    alert('Clique em "Gerar campos" primeiro.');
    return;
  }
  if (r.some(x => !(x > 0))) {
    alert("Use resistências maiores que zero.");
    return;
  }
  if (tipo === "misto" && r.length < 3) {
    alert("O misto precisa de pelo menos 3 resistências.");
    return;
  }

  // O menu do modelo só aparece quando o cálculo é o misto
  document.getElementById("areaModelo").hidden = (tipo !== "misto");

  const modelo = document.getElementById("modelo").value;
  let linhas;
  if (tipo === "serie") linhas = calcularSerie(r, v);
  else if (tipo === "paralelo") linhas = calcularParalelo(r, v);
  else linhas = calcularMisto(r, v, modelo);

  document.getElementById("resultado").innerHTML = linhas.map(l => `<li>${l}</li>`).join("");
  desenharCircuito(tipo, r, v, modelo);
}

// ---- Conexão com o HTML: cada botão (pelo id) chama a sua função ----
document.getElementById("btnGerar").addEventListener("click", gerarCampos);
document.getElementById("btnSerie").addEventListener("click", () => executar("serie"));
document.getElementById("btnParalelo").addEventListener("click", () => executar("paralelo"));
document.getElementById("btnMisto").addEventListener("click", () => executar("misto"));
// Ao trocar o modelo no menu, o misto é recalculado na hora
document.getElementById("modelo").addEventListener("change", () => executar("misto"));

// Já mostra os campos na primeira vez que a página abre
gerarCampos();