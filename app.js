(function () {
  const total = QUESTIONS.length;
  let index = 0;
  /** @type {{ q: string, answers: {text: string, correct: boolean}[] }[]} */
  let sessionQuestions = [];
  /** @type {(number|null)[]} */
  let chosen = [];

  const $ = (id) => document.getElementById(id);

  const screenStart = $("screen-start");
  const screenQuiz = $("screen-quiz");
  const screenResult = $("screen-result");
  const questionText = $("question-text");
  const answersList = $("answers-list");
  const progressText = $("progress-text");
  const progressFill = $("progress-fill");
  const btnPrev = $("btn-prev");
  const btnNext = $("btn-next");
  const btnStart = $("btn-start");
  const btnRetry = $("btn-retry");
  const resultScore = $("result-score");
  const resultHint = $("result-hint");
  const resultMistakes = $("result-mistakes");
  let callModal = null;

  function createCallModal() {
    const overlay = document.createElement("div");
    overlay.className = "call-modal";
    overlay.innerHTML = `
      <div class="call-modal__card" role="dialog" aria-modal="true" aria-labelledby="call-modal-title">
        <h3 id="call-modal-title">ПОДНИМИ ТЕЛЕФОН</h3>
        <a class="btn btn-primary call-modal__link" href="tel:+79894407402">Позвонить: +79894407402</a>
        <button type="button" class="btn btn-secondary call-modal__close">Закрыть</button>
      </div>
    `;

    overlay.querySelector(".call-modal__close").addEventListener("click", () => {
      overlay.classList.remove("active");
    });

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        overlay.classList.remove("active");
      }
    });

    document.body.appendChild(overlay);
    return overlay;
  }

  function showCallModal() {
    if (!callModal) {
      callModal = createCallModal();
    }
    callModal.classList.add("active");
  }

  function shuffle(array) {
    const cloned = array.slice();
    for (let i = cloned.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
    }
    return cloned;
  }

  function buildRandomSessionQuestions() {
    // New random order of questions and answers on every start.
    return shuffle(QUESTIONS).map((q) => ({
      q: q.q,
      answers: shuffle(q.answers),
    }));
  }

  function showScreen(which) {
    screenStart.classList.toggle("active", which === "start");
    screenQuiz.classList.toggle("active", which === "quiz");
    screenResult.classList.toggle("active", which === "result");
  }

  function renderQuestion() {
    const q = sessionQuestions[index];
    questionText.textContent = q.q;
    answersList.innerHTML = "";

    q.answers.forEach((ans, i) => {
      const li = document.createElement("li");
      const id = `a-${index}-${i}`;
      const label = document.createElement("label");
      label.className = "answer-label";
      label.htmlFor = id;

      const input = document.createElement("input");
      input.type = "radio";
      input.name = `q${index}`;
      input.id = id;
      input.value = String(i);
      if (chosen[index] === i) input.checked = true;

      input.addEventListener("change", () => {
        chosen[index] = i;
      });

      const span = document.createElement("span");
      span.textContent = ans.text;

      label.appendChild(input);
      label.appendChild(span);
      li.appendChild(label);
      answersList.appendChild(li);
    });

    progressText.textContent = `Вопрос ${index + 1} из ${sessionQuestions.length}`;
    progressFill.style.width = `${((index + 1) / sessionQuestions.length) * 100}%`;

    btnPrev.disabled = index === 0;
    btnNext.textContent = index === sessionQuestions.length - 1 ? "Завершить" : "Далее";
  }

  function findCorrectIndex(q) {
    return q.answers.findIndex((a) => a.correct);
  }

  function finish() {
    let correctCount = 0;
    const mistakes = [];

    sessionQuestions.forEach((q, i) => {
      const rightIdx = findCorrectIndex(q);
      if (chosen[i] === rightIdx) {
        correctCount++;
      } else {
        mistakes.push({
          num: i + 1,
          question: q.q,
          userIdx: chosen[i],
          rightIdx,
        });
      }
    });

    resultScore.textContent = `Правильных ответов: ${correctCount} из ${sessionQuestions.length}`;
    const pct = Math.round((correctCount / sessionQuestions.length) * 100);
    resultHint.textContent =
      pct >= 80
        ? "Отличный результат."
        : pct >= 60
          ? "Хорошо, есть над чем поработать."
          : "Стоит повторить материал по ошибкам ниже.";

    resultMistakes.innerHTML = "";
    if (mistakes.length === 0) {
      const p = document.createElement("p");
      p.textContent = "Ошибок нет — все ответы верные.";
      p.style.color = "var(--correct)";
      resultMistakes.appendChild(p);
    } else {
      const h3 = document.createElement("h3");
      h3.textContent = `Ошибки (${mistakes.length})`;
      resultMistakes.appendChild(h3);

      mistakes.forEach((m) => {
        const div = document.createElement("div");
        div.className = "mistake-item";
        const strong = document.createElement("strong");
        strong.textContent = `Вопрос ${m.num}`;
        div.appendChild(strong);

        const qShort =
          m.question.length > 220 ? m.question.slice(0, 217) + "…" : m.question;
        const qP = document.createElement("p");
        qP.style.margin = "0 0 0.5rem";
        qP.textContent = qShort;
        div.appendChild(qP);

        if (m.userIdx === null) {
          const p = document.createElement("p");
          p.className = "your no-answer";
          p.textContent = "Ответ не выбран.";
          div.appendChild(p);
        } else {
          const p = document.createElement("p");
          p.className = "your";
          p.textContent =
            "Ваш ответ: " + sessionQuestions[m.num - 1].answers[m.userIdx].text;
          div.appendChild(p);
        }

        const r = document.createElement("p");
        r.className = "right";
        r.textContent =
          "Верно: " + sessionQuestions[m.num - 1].answers[m.rightIdx].text;
        div.appendChild(r);

        resultMistakes.appendChild(div);
      });
    }

    showScreen("result");
    showCallModal();
  }

  btnStart.addEventListener("click", () => {
    sessionQuestions = buildRandomSessionQuestions();
    chosen = new Array(sessionQuestions.length).fill(null);
    index = 0;
    showScreen("quiz");
    renderQuestion();
  });

  btnPrev.addEventListener("click", () => {
    if (index > 0) {
      index--;
      renderQuestion();
    }
  });

  btnNext.addEventListener("click", () => {
    if (index < sessionQuestions.length - 1) {
      index++;
      renderQuestion();
    } else {
      finish();
    }
  });

  btnRetry.addEventListener("click", () => {
    index = 0;
    chosen = new Array(sessionQuestions.length).fill(null);
    showScreen("start");
  });
})();
