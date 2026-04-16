mixins.highlight = {
    data() {
        return { copying: false };
    },
    created() {
        hljs.configure({ ignoreUnescapedHTML: true });
        this.renderers.push(this.highlight);
    },
    methods: {
        sleep(ms) {
            return new Promise((resolve) => setTimeout(resolve, ms));
        },
        highlight() {
            const FOLD_LINE_THRESHOLD = 15;
            let codes = document.querySelectorAll("pre");
            for (let i of codes) {
                let code = i.textContent;
                let language = [...i.classList, ...i.firstChild.classList][0] || "plaintext";
                if (language.startsWith("language-")) {
                    language = language.slice(9);
                }
                let highlighted;
                try {
                    highlighted = hljs.highlight(code, { language }).value;
                } catch {
                    highlighted = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                }
                i.innerHTML = `
                <div class="code-content hljs">${highlighted}</div>
                <div class="language">${language}</div>
                <div class="copycode">
                    <i class="fa-solid fa-copy fa-fw"></i>
                    <i class="fa-solid fa-check fa-fw"></i>
                </div>
                `;
                let content = i.querySelector(".code-content");
                hljs.lineNumbersBlock(content, { singleLine: true });
                let copycode = i.querySelector(".copycode");
                copycode.addEventListener("click", async () => {
                    if (this.copying) return;
                    this.copying = true;
                    copycode.classList.add("copied");
                    await navigator.clipboard.writeText(code);
                    await this.sleep(1000);
                    copycode.classList.remove("copied");
                    this.copying = false;
                });

                let lineCount = code.split("\n").length;
                if (lineCount > FOLD_LINE_THRESHOLD) {
                    content.classList.add("folded");

                    let mask = document.createElement("div");
                    mask.className = "code-fold-mask";
                    i.appendChild(mask);

                    requestAnimationFrame(() => {
                        let bg =
                            getComputedStyle(content).backgroundColor ||
                            "rgb(248, 248, 248)";
                        mask.style.background = `linear-gradient(to bottom, transparent, ${bg})`;
                    });

                    let btn = document.createElement("div");
                    btn.className = "code-fold-btn";
                    btn.innerHTML =
                        '<i class="fa-solid fa-angle-down fa-fw"></i> 展开代码';
                    i.appendChild(btn);

                    btn.addEventListener("click", () => {
                        let folded = content.classList.toggle("folded");
                        mask.classList.toggle("hidden", !folded);
                        btn.innerHTML = folded
                            ? '<i class="fa-solid fa-angle-down fa-fw"></i> 展开代码'
                            : '<i class="fa-solid fa-angle-up fa-fw"></i> 收起代码';
                    });
                }
            }
        },
    },
};
