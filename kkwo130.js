let questions = [];

let current = 0;

let correct = 0;

let nickname = "";


// =========================
// API
// =========================

async function api(
    url,
    options = {}
) {

    const response = await fetch(
        url,
        {
            headers: {
                "Content-Type":
                    "application/json"
            },

            ...options
        }
    );

    return await response.json();
}


// =========================
// 퀴즈 시작
// =========================

async function startQuiz() {

    nickname =
        document
            .getElementById("nickname")
            .value
            .trim();

    if (!nickname) {

        alert(
            "스푼 닉네임을 입력해주세요."
        );

        return;
    }


    questions =
        await api(
            "/api/questions"
        );


    if (!questions.length) {

        alert(
            "등록된 문제가 없습니다."
        );

        return;
    }


    current = 0;

    correct = 0;


    document
        .getElementById("startScreen")
        .classList
        .add("hidden");


    document
        .getElementById("quizScreen")
        .classList
        .remove("hidden");


    showQuestion();
}


// =========================
// 문제 표시
// =========================

function showQuestion() {

    const q =
        questions[current];


    document
        .getElementById("progress")
        .textContent =
        `${current + 1} / ${questions.length}`;


    document
        .getElementById("score")
        .textContent =
        `현재 점수: ${correct}`;


    document
        .getElementById("question")
        .textContent =
        q.question;


    const answerBox =
        document.getElementById(
            "answers"
        );


    answerBox.innerHTML = "";


    q.options.forEach(
        (option, index) => {

            const button =
                document.createElement(
                    "button"
                );


            button.className =
                "answer";


            button.textContent =
                option;


            button.onclick =
                () =>
                    answer(
                        index,
                        button
                    );


            answerBox.appendChild(
                button
            );

        }
    );
}


// =========================
// 정답 처리
// =========================

function answer(
    index,
    button
) {

    const q =
        questions[current];


    const buttons =
        document.querySelectorAll(
            ".answer"
        );


    buttons.forEach(
        b => b.disabled = true
    );


    if (
        index === q.answer
    ) {

        correct++;

        button.classList.add(
            "correct"
        );

    } else {

        button.classList.add(
            "wrong"
        );

        buttons[
            q.answer
        ].classList.add(
            "correct"
        );
    }


    setTimeout(
        () => {

            current++;


            if (
                current >=
                questions.length
            ) {

                finishQuiz();

            } else {

                showQuestion();

            }

        },

        700
    );
}


// =========================
// 퀴즈 종료
// =========================

async function finishQuiz() {

    await api(
        "/api/scores",
        {
            method: "POST",

            body: JSON.stringify({

                nickname:
                    nickname,

                score:
                    correct,

                total:
                    questions.length

            })
        }
    );


    document
        .getElementById("quizScreen")
        .classList
        .add("hidden");


    document
        .getElementById("resultScreen")
        .classList
        .remove("hidden");


    document
        .getElementById("resultText")
        .textContent =
        `${nickname}님은 ${questions.length}문제 중 ${correct}개를 맞혔어요!`;
}


// =========================
// 순위
// =========================

async function showRanking() {

    const data =
        await api(
            "/api/scores"
        );


    document
        .getElementById("startScreen")
        .classList
        .add("hidden");


    document
        .getElementById("resultScreen")
        .classList
        .add("hidden");


    document
        .getElementById("rankingScreen")
        .classList
        .remove("hidden");


    const box =
        document.getElementById(
            "ranking"
        );


    box.innerHTML = "";


    if (!data.length) {

        box.innerHTML =
            "<p>아직 참가자가 없습니다.</p>";

        return;
    }


    data.forEach(
        (item, index) => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "rank";


            row.innerHTML = `

                <span>
                    ${index + 1}위　
                    ${escapeHtml(
                        item.nickname
                    )}
                </span>

                <strong>
                    ${item.score}
                    /
                    ${item.total}
                </strong>

            `;


            box.appendChild(
                row
            );

        }
    );
}


// =========================
// 관리자 로그인
// =========================

async function adminLogin() {

    const password =
        prompt(
            "관리자 비밀번호를 입력하세요."
        );


    if (
        password === null
    ) {

        return;
    }


    const result =
        await api(
            "/api/admin/login",
            {
                method: "POST",

                body:
                    JSON.stringify({
                        password:
                            password
                    })
            }
        );


    if (!result.ok) {

        alert(
            "비밀번호가 올바르지 않습니다."
        );

        return;
    }


    document
        .getElementById("startScreen")
        .classList
        .add("hidden");


    document
        .getElementById("adminScreen")
        .classList
        .remove("hidden");


    loadAdmin();
}


// =========================
// 관리자 문제 불러오기
// =========================

async function loadAdmin() {

    questions =
        await api(
            "/api/questions"
        );


    renderAdmin();
}


// =========================
// 관리자 화면
// =========================

function renderAdmin() {

    const box =
        document.getElementById(
            "adminQuestions"
        );


    box.innerHTML = "";


    questions.forEach(
        (q, i) => {

            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "admin-q";


            div.innerHTML = `

                <strong>
                    문제 ${i + 1}
                </strong>

                <textarea
                    class="qtext"
                >${escapeHtml(
                    q.question
                )}</textarea>

                <input
                    class="opt"
                    value="${escapeAttr(
                        q.options[0]
                    )}"
                    placeholder="보기 1"
                >

                <input
                    class="opt"
                    value="${escapeAttr(
                        q.options[1]
                    )}"
                    placeholder="보기 2"
                >

                <input
                    class="opt"
                    value="${escapeAttr(
                        q.options[2]
                    )}"
                    placeholder="보기 3"
                >

                <input
                    class="opt"
                    value="${escapeAttr(
                        q.options[3]
                    )}"
                    placeholder="보기 4"
                >

                <select class="ans">

                    <option
                        value="0"
                        ${q.answer === 0
                            ? "selected"
                            : ""}
                    >
                        정답: 보기 1
                    </option>

                    <option
                        value="1"
                        ${q.answer === 1
                            ? "selected"
                            : ""}
                    >
                        정답: 보기 2
                    </option>

                    <option
                        value="2"
                        ${q.answer === 2
                            ? "selected"
                            : ""}
                    >
                        정답: 보기 3
                    </option>

                    <option
                        value="3"
                        ${q.answer === 3
                            ? "selected"
                            : ""}
                    >
                        정답: 보기 4
                    </option>

                </select>

                <button
                    class="sub"
                    onclick="deleteQuestion(${i})"
                >
                    이 문제 삭제
                </button>

            `;


            box.appendChild(
                div
            );

        }
    );
}


// =========================
// 문제 추가
// =========================

function addQuestion() {

    questions.push({

        question:
            "새로운 문제를 입력하세요.",

        options: [
            "보기 1",
            "보기 2",
            "보기 3",
            "보기 4"
        ],

        answer: 0

    });


    renderAdmin();
}


// =========================
// 문제 삭제
// =========================

function deleteQuestion(index) {

    if (
        !confirm(
            `${index + 1}번 문제를 삭제할까요?`
        )
    ) {

        return;
    }


    questions.splice(
        index,
        1
    );


    renderAdmin();
}


// =========================
// 문제 저장
// =========================

async function saveQuestions() {

    const blocks =
        document.querySelectorAll(
            ".admin-q"
        );


    questions =
        [...blocks].map(
            block => {

                return {

                    question:
                        block
                            .querySelector(
                                ".qtext"
                            )
                            .value
                            .trim(),

                    options:
                        [
                            ...block
                                .querySelectorAll(
                                    ".opt"
                                )
                        ].map(
                            input =>
                                input
                                    .value
                                    .trim()
                        ),

                    answer:
                        Number(
                            block
                                .querySelector(
                                    ".ans"
                                )
                                .value
                        )

                };

            }
        );


    if (
        questions.some(
            q =>
                !q.question ||
                q.options.some(
                    option =>
                        !option
                )
        )
    ) {

        alert(
            "문제와 모든 보기를 입력해주세요."
        );

        return;
    }


    const result =
        await api(
            "/api/questions",
            {
                method: "POST",

                body:
                    JSON.stringify(
                        questions
                    )
            }
        );


    if (result.ok) {

        alert(
            "문제가 저장되었습니다."
        );

    } else {

        alert(
            result.error ||
            "저장에 실패했습니다."
        );

    }
}


// =========================
// HTML 보안 처리
// =========================

function escapeHtml(text) {

    return String(text)
        .replace(
            /[&<>"']/g,
            character => ({

                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"

            }[character])
        );
}


function escapeAttr(text) {

    return String(text)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /"/g,
            "&quot;"
        );
}