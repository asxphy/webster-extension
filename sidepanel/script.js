(async () => {
    const errorMessage = document.getElementById("error-message");
    const submitButton = document.getElementById("submit-button");
    const promptArea = document.getElementById("prompt-area");
    const promptInput = document.getElementById("prompt-input");
    const responseArea = document.getElementById("response-area");
    const resetButton = document.getElementById("reset-button");
    const summarizeButton = document.getElementById("summarize-button");

    responseArea.style.display = "none";

    let session = null;
    let page_content = null;

    if (!self.ai || !self.ai.languageModel) {
        errorMessage.style.display = "block";
        errorMessage.innerHTML = `Your browser doesn't support the Prompt API. If you're on Chrome, join the <a href="https://developer.chrome.com/docs/ai/built-in#get_an_early_preview">Early Preview Program</a> to enable it.`;
        return;
    }

    promptArea.style.display = "block";

    const summarizeThePage = async () => {
        chrome.storage.session.get("pageContent", async ({ pageContent }) => {
            console.log(pageContent);
            if (pageContent == null) return;

            const prompt = "Summarize the page " + pageContent;
            if (!prompt) return;
            responseArea.style.display = "block";
            const heading = document.createElement("h3");
            heading.classList.add("prompt", "speech-bubble");
            heading.textContent = "Summarize the page";
            responseArea.append(heading);
            const p = document.createElement("p");
            p.classList.add("response", "speech-bubble");
            p.textContent = "Generating response...";
            responseArea.append(p);

            let fullResponse = "";

            try {
                if (!session) {
                    await updateSession();
                }
                const stream = await session.promptStreaming(prompt);

                for await (const chunk of stream) {
                    fullResponse = chunk.trim();
                    p.innerHTML = fullResponse;
                }
            } catch (error) {
                p.textContent = `Error: ${error.message}`;
            }
        });
    };
    const promptModel = async () => {
        const prompt = promptInput.value.trim();
        if (!prompt) return;
        responseArea.style.display = "block";
        const heading = document.createElement("h3");
        heading.classList.add("prompt", "speech-bubble");
        heading.textContent = prompt;
        responseArea.append(heading);
        const p = document.createElement("p");
        p.classList.add("response", "speech-bubble");
        p.textContent = "Generating response...";
        responseArea.append(p);

        let fullResponse = "";

        try {
            if (!session) {
                await updateSession();
            }
            const stream = await session.promptStreaming(prompt);

            for await (const chunk of stream) {
                fullResponse = chunk.trim();
                p.innerHTML = fullResponse;
            }
        } catch (error) {
            p.textContent = `Error: ${error.message}`;
        }
    };

    summarizeButton.addEventListener("click", async (e) => {
        await summarizeThePage();
    });
    submitButton.addEventListener("click", async (e) => {
        await promptModel();
    });

    promptInput.addEventListener("keydown", async (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            await promptModel();
        }
    });

    promptInput.addEventListener("focus", () => {
        promptInput.select();
    });

    const resetUI = () => {
        responseArea.style.display = "none";
        responseArea.innerHTML = "";
        promptInput.focus();
    };

    resetButton.addEventListener("click", () => {
        promptInput.value = "";
        resetUI();
        session.destroy();
        session = null;
        updateSession();
    });

    const updateSession = async () => {
        session = await self.ai.languageModel.create();
        resetUI();
    };
})();
