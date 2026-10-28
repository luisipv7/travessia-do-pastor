// ------------------------------------------------------------
// Travessia do Pastor — jogo educativo em JavaScript puro
// ------------------------------------------------------------
// Estado: 0 = margem esquerda | 1 = margem direita
// P = Pastor, C = Cão pastor, L = Lobo, O = Ovelha
// Uma jogada é válida quando o pastor cruza sozinho ou com
// exatamente um animal que esteja na mesma margem que ele.
// ------------------------------------------------------------

const characters = {
  pastor: { name: "Pastor", short: "P", emoji: "🧑‍🌾", role: "pilota o barco" },
  dog:    { name: "Cão pastor", short: "C", emoji: "🐕", role: "protege o rebanho" },
  wolf:   { name: "Lobo", short: "L", emoji: "🐺", role: "animal selvagem" },
  sheep:  { name: "Ovelha", short: "O", emoji: "🐑", role: "precisa de proteção" }
};

const MINIMUM_MOVES = 7;

let state = createInitialState();
let selectedPassenger = null;
let moves = 0;
let history = [];
let hintIndex = 0;
let soundOn = true;
let locked = false;

const els = {
  leftCharacters: document.querySelector("#leftCharacters"),
  rightCharacters: document.querySelector("#rightCharacters"),
  boatTrack: document.querySelector("#boatTrack"),
  boatPassengers: document.querySelector("#boatPassengers"),
  crossBtn: document.querySelector("#crossBtn"),
  undoBtn: document.querySelector("#undoBtn"),
  hintBtn: document.querySelector("#hintBtn"),
  resetBtn: document.querySelector("#resetBtn"),
  soundBtn: document.querySelector("#soundBtn"),
  moves: document.querySelector("#moves"),
  best: document.querySelector("#best"),
  status: document.querySelector("#status"),
  messagePanel: document.querySelector("#messagePanel"),
  messageIcon: document.querySelector("#messageIcon"),
  messageText: document.querySelector("#messageText"),
  stateCode: document.querySelector("#stateCode"),
  rulesToggle: document.querySelector("#rulesToggle"),
  rulesContent: document.querySelector("#rulesContent"),
  teacherToggle: document.querySelector("#teacherToggle"),
  teacherContent: document.querySelector("#teacherContent"),
  modal: document.querySelector("#modal"),
  modalEmoji: document.querySelector("#modalEmoji"),
  modalTitle: document.querySelector("#modalTitle"),
  modalText: document.querySelector("#modalText"),
  solutionBox: document.querySelector("#solutionBox"),
  modalPrimary: document.querySelector("#modalPrimary"),
  modalSecondary: document.querySelector("#modalSecondary"),
  confetti: document.querySelector("#confetti")
};

function createInitialState() {
  return { pastor: 0, dog: 0, wolf: 0, sheep: 0 };
}

function cloneState(source = state) {
  return { ...source };
}

function sideLetter(side) {
  return side === 0 ? "E" : "D";
}

function render() {
  els.leftCharacters.innerHTML = "";
  els.rightCharacters.innerHTML = "";

  Object.entries(characters).forEach(([key, data]) => {
    // O passageiro selecionado aparece dentro do barco até a travessia.
    if (key === selectedPassenger) return;

    const card = document.createElement("button");
    card.type = "button";
    card.className = `character ${key === "pastor" ? "pastor" : ""}`;
    card.dataset.character = key;
    card.setAttribute("aria-label", `${data.name} na margem ${state[key] === 0 ? "esquerda" : "direita"}`);
    card.innerHTML = `
      <span class="emoji">${data.emoji}</span>
      <span class="name">${data.name}</span>
      <span class="role">${data.role}</span>
    `;

    const sameSideAsPastor = state[key] === state.pastor;
    if (key !== "pastor" && sameSideAsPastor && !locked) {
      card.addEventListener("click", () => selectPassenger(key));
    } else if (key !== "pastor") {
      card.classList.add("disabled");
      card.disabled = true;
    } else {
      card.disabled = true;
    }

    const target = state[key] === 0 ? els.leftCharacters : els.rightCharacters;
    target.appendChild(card);
  });

  els.boatTrack.classList.toggle("side-left", state.pastor === 0);
  els.boatTrack.classList.toggle("side-right", state.pastor === 1);

  const passenger = selectedPassenger ? characters[selectedPassenger].emoji : "";
  els.boatPassengers.innerHTML = `<span title="Pastor">${characters.pastor.emoji}</span>${passenger ? `<span title="Passageiro">${passenger}</span>` : ""}`;

  els.moves.textContent = moves;
  els.undoBtn.disabled = history.length === 0 || locked;
  els.crossBtn.disabled = locked;

  const best = localStorage.getItem("riverCrossingBest");
  els.best.textContent = best || "—";

  els.status.textContent = selectedPassenger
    ? `${characters[selectedPassenger].name} está no barco. Clique em “Atravessar o rio”.`
    : "Escolha um passageiro ou atravesse sozinho.";

  els.stateCode.textContent = `P=${sideLetter(state.pastor)} | C=${sideLetter(state.dog)} | L=${sideLetter(state.wolf)} | O=${sideLetter(state.sheep)}`;
}

function selectPassenger(key) {
  if (locked || key === "pastor") return;
  if (state[key] !== state.pastor) {
    showMessage("⚠️", "Esse animal está na outra margem e não pode entrar no barco agora.", "warning");
    playTone(180, 0.08);
    return;
  }

  selectedPassenger = selectedPassenger === key ? null : key;
  showMessage(
    selectedPassenger ? "🛶" : "🎯",
    selectedPassenger
      ? `${characters[selectedPassenger].name} entrou no barco.`
      : "Passageiro retirado do barco. Você pode escolher outro ou atravessar sozinho.",
    ""
  );
  playTone(selectedPassenger ? 500 : 360, 0.06);
  render();
}

async function crossRiver() {
  if (locked) return;
  locked = true;

  // Guarda o estado anterior para o botão Desfazer.
  history.push({ state: cloneState(), moves, selectedPassenger: null });

  const origin = state.pastor;
  const destination = origin === 0 ? 1 : 0;
  const passenger = selectedPassenger;

  state.pastor = destination;
  if (passenger) state[passenger] = destination;
  moves += 1;
  selectedPassenger = null;

  els.boatTrack.classList.toggle("side-left", destination === 0);
  els.boatTrack.classList.toggle("side-right", destination === 1);
  playTone(320, 0.08);
  await sleep(680);

  const danger = detectDanger(state);
  if (danger) {
    render();
    showMessage("🚨", danger.message, "danger");
    playLoseSound();
    openLoseModal(danger);
    return;
  }

  if (isVictory()) {
    render();
    saveBestScore();
    showMessage("🏆", `Conseguimos! Todos atravessaram em ${moves} viagens.`, "success");
    playWinSound();
    launchConfetti();
    openWinModal();
    return;
  }

  locked = false;
  showMessage("✅", "Travessia segura. Agora planeje o próximo movimento.", "success");
  render();
}

function detectDanger(testState) {
  // Regra 1: lobo + ovelha sem pastor.
  if (testState.wolf === testState.sheep && testState.pastor !== testState.wolf) {
    return {
      type: "wolf-sheep",
      title: "O lobo ficou sozinho com a ovelha!",
      message: "Sem o pastor por perto, o lobo atacaria a ovelha. Essa configuração não é permitida."
    };
  }

  // Regra 2: cão pastor + lobo sem pastor.
  if (testState.dog === testState.wolf && testState.pastor !== testState.dog) {
    return {
      type: "dog-wolf",
      title: "O cão pastor ficou sozinho com o lobo!",
      message: "Sem o pastor por perto, cão e lobo entrariam em confronto. Essa configuração não é permitida."
    };
  }

  return null;
}

function isVictory() {
  return Object.values(state).every(side => side === 1);
}

function undoMove() {
  if (!history.length || locked) return;
  const previous = history.pop();
  state = cloneState(previous.state);
  moves = previous.moves;
  selectedPassenger = null;
  hintIndex = Math.max(0, hintIndex - 1);
  showMessage("↶", "Última travessia desfeita. Tente uma estratégia diferente.", "");
  playTone(280, 0.07);
  render();
}

function resetGame() {
  state = createInitialState();
  selectedPassenger = null;
  moves = 0;
  history = [];
  hintIndex = 0;
  locked = false;
  closeModal();
  showMessage("🎯", "Clique em um animal que esteja na mesma margem do pastor para colocá-lo no barco.", "");
  render();
}

const hints = [
  "Observe qual personagem entra em conflito com dois outros. Esse é o elemento mais importante da estratégia.",
  "O lobo não pode ficar sem o pastor nem com a ovelha nem com o cão pastor.",
  "Experimente fazer a primeira travessia levando o lobo.",
  "Em algum momento, um animal que já atravessou precisará voltar no barco.",
  "Uma sequência possível começa assim: lobo vai → pastor volta sozinho → cão pastor vai..."
];

function showHint() {
  const text = hints[Math.min(hintIndex, hints.length - 1)];
  hintIndex += 1;
  showMessage("💡", text, "warning");
  playTone(620, 0.08);
}

function showMessage(icon, text, type = "") {
  els.messageIcon.textContent = icon;
  els.messageText.textContent = text;
  els.messagePanel.className = `message-panel ${type}`.trim();
}

function openLoseModal(danger) {
  locked = true;
  els.modalEmoji.textContent = "🚨";
  els.modalTitle.textContent = "Essa travessia não é segura";
  els.modalText.textContent = `${danger.title} ${danger.message}`;
  els.solutionBox.classList.add("hidden");
  els.modalPrimary.textContent = "Tentar novamente";
  els.modalSecondary.textContent = "Ver solução";
  els.modalSecondary.classList.remove("hidden");
  els.modal.classList.remove("hidden");
}

function openWinModal() {
  locked = true;
  const perfect = moves === MINIMUM_MOVES;
  els.modalEmoji.textContent = perfect ? "🏆" : "🎉";
  els.modalTitle.textContent = perfect ? "Solução mínima!" : "Travessia concluída!";
  els.modalText.textContent = perfect
    ? `Excelente: você resolveu em ${moves} travessias, que é o mínimo desta versão.`
    : `Você resolveu em ${moves} travessias. Agora tente chegar à solução mínima de ${MINIMUM_MOVES}.`;
  els.solutionBox.classList.add("hidden");
  els.modalPrimary.textContent = "Jogar novamente";
  els.modalSecondary.textContent = "Ver solução mínima";
  els.modalSecondary.classList.remove("hidden");
  els.modal.classList.remove("hidden");
}

function showSolution() {
  els.solutionBox.innerHTML = `
    <strong>Solução em ${MINIMUM_MOVES} travessias:</strong><br>
    1. Leve o <b>lobo</b> →<br>
    2. Pastor volta <b>sozinho</b> ←<br>
    3. Leve o <b>cão pastor</b> →<br>
    4. Traga o <b>lobo</b> de volta ←<br>
    5. Leve a <b>ovelha</b> →<br>
    6. Pastor volta <b>sozinho</b> ←<br>
    7. Leve o <b>lobo</b> →
  `;
  els.solutionBox.classList.remove("hidden");
}

function closeModal() {
  els.modal.classList.add("hidden");
  els.solutionBox.classList.add("hidden");
}

function saveBestScore() {
  const best = Number(localStorage.getItem("riverCrossingBest"));
  if (!best || moves < best) localStorage.setItem("riverCrossingBest", String(moves));
}

function toggleRules() {
  const hidden = els.rulesContent.classList.toggle("hidden");
  els.rulesToggle.textContent = hidden ? "Mostrar regras" : "Ocultar regras";
  els.rulesToggle.setAttribute("aria-expanded", String(!hidden));
}

function toggleTeacherPanel() {
  const hidden = els.teacherContent.classList.toggle("hidden");
  els.teacherToggle.textContent = hidden ? "Abrir painel" : "Fechar painel";
  els.teacherToggle.setAttribute("aria-expanded", String(!hidden));
}

function toggleSound() {
  soundOn = !soundOn;
  els.soundBtn.textContent = soundOn ? "🔊" : "🔇";
  els.soundBtn.setAttribute("aria-label", soundOn ? "Desativar sons" : "Ativar sons");
  if (soundOn) playTone(520, 0.07);
}

function playTone(frequency, duration = 0.08) {
  if (!soundOn) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (_) {
    // O jogo continua normalmente mesmo se o navegador bloquear áudio.
  }
}

function playWinSound() {
  [520, 660, 780, 1040].forEach((freq, i) => setTimeout(() => playTone(freq, 0.12), i * 110));
}

function playLoseSound() {
  [260, 210, 160].forEach((freq, i) => setTimeout(() => playTone(freq, 0.12), i * 100));
}

function launchConfetti() {
  els.confetti.innerHTML = "";
  const palette = ["#ffcf4d", "#55b867", "#43a9dd", "#ef6a70", "#7359d6"];
  for (let i = 0; i < 55; i += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = palette[i % palette.length];
    piece.style.setProperty("--x", `${(Math.random() - 0.5) * 240}px`);
    piece.style.animationDelay = `${Math.random() * 0.55}s`;
    piece.style.animationDuration = `${2.2 + Math.random() * 1.2}s`;
    els.confetti.appendChild(piece);
  }
  setTimeout(() => { els.confetti.innerHTML = ""; }, 4000);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Eventos principais
els.crossBtn.addEventListener("click", crossRiver);
els.undoBtn.addEventListener("click", undoMove);
els.hintBtn.addEventListener("click", showHint);
els.resetBtn.addEventListener("click", resetGame);
els.soundBtn.addEventListener("click", toggleSound);
els.rulesToggle.addEventListener("click", toggleRules);
els.teacherToggle.addEventListener("click", toggleTeacherPanel);
els.modalPrimary.addEventListener("click", resetGame);
els.modalSecondary.addEventListener("click", showSolution);

// Atalhos de teclado úteis em sala:
// 1 = cão, 2 = lobo, 3 = ovelha, Enter = atravessar, Z = desfazer.
document.addEventListener("keydown", event => {
  if (!els.modal.classList.contains("hidden")) return;
  const keyMap = { "1": "dog", "2": "wolf", "3": "sheep" };
  if (keyMap[event.key]) selectPassenger(keyMap[event.key]);
  if (event.key === "Enter") crossRiver();
  if (event.key.toLowerCase() === "z") undoMove();
});

render();
