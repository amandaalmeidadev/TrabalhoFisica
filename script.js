
/* =========================================================
   CALCULADORA DE CIRCUITOS - FÍSICA III
   ========================================================= */


/* =========================================================
   1. FORMATAÇÃO DE NÚMEROS
   ========================================================= */

const f = n => n.toFixed(2);


/* =========================================================
   2. GERA OS CAMPOS DE ENTRADA
   ========================================================= */

function gerarCampos() {

    const qtdR = Number(document.getElementById("qtdR").value);
    const qtdV = Number(document.getElementById("qtdV").value);

    if (
        !Number.isInteger(qtdR) ||
        !Number.isInteger(qtdV) ||
        qtdR < 1 ||
        qtdR > 5 ||
        qtdV < 1 ||
        qtdV > 10
    ) {

        alert("Use de 1 a 5 resistências e de 1 a 10 tensões.");

        return;
    }

    let html = "";

    // Resistores
    for (let i = 1; i <= qtdR; i++) {

        html += `
            <label>
                R${i} (Ω):
                <input
                    type="number"
                    class="r"
                    value="10"
                    min="0.01"
                    step="any"
                >
            </label>
        `;

    }

    // Tensões
    for (let i = 1; i <= qtdV; i++) {

        html += `
            <label>
                V${i} (V):
                <input
                    type="number"
                    class="v"
                    value="12"
                    step="any"
                >
            </label>
        `;

    }

    document.getElementById("campos").innerHTML = html;

    limparResultados();

}


/* =========================================================
   3. LÊ OS VALORES DOS COMPONENTES
   ========================================================= */

function lerValores() {

    const r = [];
    const v = [];

    document.querySelectorAll(".r").forEach(campo => {
        r.push(Number(campo.value));
    });

    document.querySelectorAll(".v").forEach(campo => {
        v.push(Number(campo.value));
    });

    return { r, v };

}


/* =========================================================
   4. CÁLCULO EM SÉRIE
   ========================================================= */

function calcularSerie(r, v) {

    const vt = v.reduce((a, b) => a + b, 0);

    const req = r.reduce((a, b) => a + b, 0);

    const i = vt / req;

    const linhas = [

        `Tensão total: ${f(vt)} V`,

        `Resistência equivalente: ${f(req)} Ω`,

        `Corrente total: ${f(i)} A`

    ];

    r.forEach((ri, k) => {

        linhas.push(
            `R${k + 1}: tensão = ${f(ri * i)} V | corrente = ${f(i)} A`
        );

    });

    return linhas;

}


/* =========================================================
   5. CÁLCULO EM PARALELO
   ========================================================= */

function calcularParalelo(r, v) {

    const vt = v.reduce((a, b) => a + b, 0);

    const req = 1 / r.reduce(
        (a, b) => a + 1 / b,
        0
    );

    const it = vt / req;

    const linhas = [

        `Tensão total: ${f(vt)} V`,

        `Resistência equivalente: ${f(req)} Ω`,

        `Corrente total: ${f(it)} A`

    ];

    r.forEach((ri, k) => {

        linhas.push(
            `R${k + 1}: tensão = ${f(vt)} V | corrente = ${f(vt / ri)} A`
        );

    });

    return linhas;

}


/* =========================================================
   6. DESENHA O CIRCUITO EM SVG
   ========================================================= */

function desenharCircuito(tipo, r, v) {

    const vt = v.reduce((a, b) => a + b, 0);

    const cor = "#7F1D1D";
    const cobre = "#991B1B";
    const fundo = "#FFF5F5";

    // Fios
    const fio = (x1, y1, x2, y2) => `

        <line
            x1="${x1}"
            y1="${y1}"
            x2="${x2}"
            y2="${y2}"
            stroke="${cor}"
            stroke-width="3"
            stroke-linecap="round"
        />

    `;

    // Resistor horizontal
    const resH = (cx, cy, nome, valor) => `

        <rect
            x="${cx - 32}"
            y="${cy - 13}"
            width="64"
            height="26"
            rx="5"
            fill="${fundo}"
            stroke="${cobre}"
            stroke-width="2.5"
        />

        <text
            x="${cx}"
            y="${cy + 4}"
            text-anchor="middle"
            font-size="12"
            font-weight="bold"
            fill="${cor}"
        >${nome}</text>

        <text
            x="${cx}"
            y="${cy + 32}"
            text-anchor="middle"
            font-size="11"
            fill="${cor}"
        >${valor} Ω</text>

    `;

    // Bateria
    const bateria = (x, y1, y2) => {

        const m = (y1 + y2) / 2;

        return `

            ${fio(x, y1, x, m - 6)}

            ${fio(x, m + 6, x, y2)}

            <line
                x1="${x - 16}"
                y1="${m - 6}"
                x2="${x + 16}"
                y2="${m - 6}"
                stroke="${cobre}"
                stroke-width="4"
                stroke-linecap="round"
            />

            <line
                x1="${x - 9}"
                y1="${m + 6}"
                x2="${x + 9}"
                y2="${m + 6}"
                stroke="${cobre}"
                stroke-width="4"
                stroke-linecap="round"
            />

            <text
                x="${x + 22}"
                y="${m + 4}"
                font-size="12"
                font-weight="bold"
                fill="${cor}"
            >${f(vt)} V</text>

        `;

    };

    let s = "";
    let altura = 160;

    // ASSOCIAÇÃO EM SÉRIE
    if (tipo === "serie") {

        const passo = 520 / r.length;

        s += fio(40, 30, 560, 30);
        s += fio(560, 30, 560, 130);
        s += fio(560, 130, 40, 130);

        s += bateria(40, 30, 130);

        r.forEach((ri, i) => {

            s += resH(
                40 + passo * (i + 0.5),
                30,
                "R" + (i + 1),
                ri
            );

        });

    }

    // ASSOCIAÇÃO EM PARALELO
    else {

        const ramos = r.map((_, i) => [i]);

        const yBaixo = 30 + 60 * (ramos.length - 1);

        altura = yBaixo + 50;

        s += bateria(40, 30, yBaixo);

        s += fio(40, 30, 120, 30);
        s += fio(40, yBaixo, 120, yBaixo);

        s += fio(120, 30, 120, yBaixo);
        s += fio(500, 30, 500, yBaixo);

        ramos.forEach((lista, k) => {

            const y = 30 + 60 * k;

            s += fio(120, y, 500, y);

            lista.forEach((idx, j) => {

                s += resH(
                    120 + (380 / lista.length) * (j + 0.5),
                    y,
                    "R" + (idx + 1),
                    r[idx]
                );

            });

        });

    }

    const svg = document.getElementById("circuito");

    svg.setAttribute("viewBox", `0 0 600 ${altura}`);

    svg.innerHTML = s;

}


/* =========================================================
   7. EXECUTA OS CÁLCULOS
   ========================================================= */

function executar(tipo) {

    const { r, v } = lerValores();

    if (r.length === 0 || v.length === 0) {

        alert('Clique em "Gerar campos" primeiro.');

        return;

    }

    if (r.some(x => !Number.isFinite(x) || x <= 0)) {

        alert("Use resistências maiores que zero.");

        return;

    }

    if (v.some(x => !Number.isFinite(x) || x <= 0)) {

        alert("Use tensões maiores que zero.");

        return;

    }

    let linhas;

    if (tipo === "serie") {

        linhas = calcularSerie(r, v);

    } else {

        linhas = calcularParalelo(r, v);

    }

    const resultado = document.getElementById("resultado");

    resultado.innerHTML = linhas.map((linha, indice) => {

        const destaque = indice < 3
            ? "resultado-destaque"
            : "";

        return `

            <li class="${destaque}">
                ${linha}
            </li>

        `;

    }).join("");

    desenharCircuito(tipo, r, v);

}


/* =========================================================
   8. LIMPA OS RESULTADOS
   ========================================================= */

function limparResultados() {

    document.getElementById("resultado").innerHTML = "";

    document.getElementById("circuito").innerHTML = "";

}


/* =========================================================
   9. EVENTOS DOS BOTÕES
   ========================================================= */

document.getElementById("btnGerar")
    .addEventListener("click", gerarCampos);

document.getElementById("btnSerie")
    .addEventListener("click", () => executar("serie"));

document.getElementById("btnParalelo")
    .addEventListener("click", () => executar("paralelo"));

document.getElementById("btnLimpar")
    .addEventListener("click", limparResultados);


/* =========================================================
   10. INICIALIZA A CALCULADORA
   ========================================================= */

gerarCampos();


