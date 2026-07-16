// content.js
// Runs on https://leetcode.com/problems/*
// Extracts problem data via LeetCode's own GraphQL API (not DOM scraping the
// rendered page), correctly splits multi-parameter test cases using the
// question's metaData param count, and sends a clean payload to the
// background worker, which relays it to CPH on localhost:27121.

(function () {
  const GRAPHQL_URL = "https://leetcode.com/graphql";

  function getTitleSlug() {
    const match = window.location.pathname.match(/\/problems\/([^/]+)/);
    return match ? match[1] : null;
  }

  async function fetchQuestionData(titleSlug) {
    const query = `
      query questionData($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          questionId
          title
          titleSlug
          content
          exampleTestcases
          sampleTestCase
          metaData
          codeSnippets {
            lang
            langSlug
            code
          }
        }
      }
    `;

    const res = await fetch(GRAPHQL_URL, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { titleSlug } }),
    });

    if (!res.ok) {
      throw new Error(`GraphQL request failed: ${res.status}`);
    }

    const json = await res.json();
    if (json.errors) {
      throw new Error(json.errors.map((e) => e.message).join("; "));
    }
    return json.data.question;
  }

  // Number of stdin lines each example occupies = number of function
  // parameters, taken from metaData. This is the piece that lets us split
  // exampleTestcases correctly instead of guessing.
  function getParamCount(metaDataStr) {
    try {
      const meta = JSON.parse(metaDataStr);
      if (Array.isArray(meta.params)) return meta.params.length;
      // Some problems (e.g. design/class problems) use methods[]
      if (Array.isArray(meta.methods) && meta.methods[0]?.params) {
        return meta.methods[0].params.length;
      }
    } catch (e) {
      /* fall through */
    }
    return 1;
  }

  function splitIntoInputs(exampleTestcases, paramCount) {
    const lines = exampleTestcases.split("\n").filter((l) => l.length > 0 || l === "");
    const inputs = [];
    for (let i = 0; i < lines.length; i += paramCount) {
      const chunk = lines.slice(i, i + paramCount);
      if (chunk.length === 0) break;
      inputs.push(chunk.join("\n"));
    }
    return inputs;
  }

  // Parse expected outputs out of the raw problem HTML (question.content).
  // Older problems wrap each example in a single <pre> block with
  // "Input:"/"Output:"/"Explanation:" as plain text inside it. Newer
  // problems (like recent contest ones) instead use separate <p> tags per
  // line, with no <pre> at all. Rather than guess which markup a given
  // problem uses, we flatten the whole content to plain text and split on
  // "Example N:" — this works regardless of the surrounding tags.
  function extractOutputs(contentHtml) {
    const doc = new DOMParser().parseFromString(contentHtml, "text/html");
    // textContent collapses all tags but keeps line breaks reasonably well
    // for LeetCode's markup (block elements like <p>/<pre> each produce
    // their own text run). Normalize whitespace per line to be safe.
    const fullText = (doc.body || doc).textContent || "";

    // Split into per-example chunks. Each chunk starts at "Example N:" and
    // runs until the next "Example N:" or end of string.
    const exampleChunks = fullText.split(/Example\s+\d+\s*:/i).slice(1);

    const outputs = [];
    for (const chunk of exampleChunks) {
      const match = chunk.match(
        /Output\s*:?\s*([\s\S]*?)(?:Explanation\s*:|Constraints\s*:|Example\s+\d+\s*:|$)/i
      );
      if (match) {
        // Collapse internal whitespace/newlines that leaked in from
        // adjacent tags into single spaces, then trim.
        outputs.push(match[1].replace(/\s+/g, " ").trim());
      } else {
        outputs.push("");
      }
    }
    return outputs;
  }

  // --- Runnable-program generation ---------------------------------------
  // LeetCode's codeSnippets only contain the bare `class Solution { ... }`
  // stub — there's no main(), no stdin reading, no stdout printing, because
  // LeetCode's own judge calls the function directly server-side. CPH is a
  // local judge: it compiles and runs your file as a normal program, so
  // without a real main() it either fails to compile or hangs waiting on
  // input that's never read — which is the SIGTERM you were hitting.
  // This builds an actual runnable main() from the parameter/return types
  // in metaData.

  const CPP_TYPE_MAP = {
    integer: { cpp: "int", read: (v) => `cin >> ${v};` },
    long: { cpp: "long long", read: (v) => `cin >> ${v};` },
    double: { cpp: "double", read: (v) => `cin >> ${v};` },
    float: { cpp: "double", read: (v) => `cin >> ${v};` },
    boolean: {
      cpp: "bool",
      read: (v) => `{ string _s; cin >> _s; ${v} = (_s == "true" || _s == "1"); }`,
    },
    character: { cpp: "char", read: (v) => `cin >> ${v};` },
    string: { cpp: "string", read: (v) => `cin >> ${v};` },
  };

  function buildRunnableCpp(question, cppTemplate, metaDataStr) {
    let meta;
    try {
      meta = JSON.parse(metaDataStr);
    } catch (e) {
      return cppTemplate; // fall back to bare snippet, better than nothing
    }

    const params = meta.params || (meta.methods && meta.methods[0]?.params) || [];
    const returnType = (meta.return && meta.return.type) || "integer";
    const funcName = meta.name || (meta.methods && meta.methods[0]?.name);

    const unsupported = params.some((p) => !CPP_TYPE_MAP[p.type]);
    const returnUnsupported = !CPP_TYPE_MAP[returnType];

    if (!funcName || unsupported || returnUnsupported) {
      // Array/list/2D params aren't handled yet — rather than generate a
      // broken program, hand back the bare class with a clear TODO so it's
      // obvious a main() still needs to be written by hand for this one.
      return (
        cppTemplate +
        "\n\n// NOTE: LeetCode CPH Companion doesn't yet auto-generate main()\n" +
        "// for array/list-typed parameters or return values. You'll need to\n" +
        "// write your own main() below that reads stdin and calls the\n" +
        "// function above, then prints the result.\n" +
        "// int main() {\n//     // ...\n// }\n"
      );
    }

    const decls = params
      .map((p) => `    ${CPP_TYPE_MAP[p.type].cpp} ${p.name};`)
      .join("\n");
    const reads = params
      .map((p) => `    ${CPP_TYPE_MAP[p.type].read(p.name)}`)
      .join("\n");
    const argList = params.map((p) => p.name).join(", ");
    const printLine =
      returnType === "boolean"
        ? `    cout << (ans ? "true" : "false") << endl;`
        : `    cout << ans << endl;`;

    return (
      `#include <bits/stdc++.h>\n` +
      `using namespace std;\n\n` +
      `${cppTemplate}\n\n` +
      `int main() {\n` +
      `    ios_base::sync_with_stdio(false);\n` +
      `    cin.tie(NULL);\n\n` +
      `${decls}\n` +
      `${reads}\n\n` +
      `    Solution sol;\n` +
      `    auto ans = sol.${funcName}(${argList});\n` +
      `${printLine}\n` +
      `    return 0;\n` +
      `}\n`
    );
  }

  function buildCphPayload(question, inputs, outputs) {
    const tests = inputs.map((input, i) => ({
      input,
      output: outputs[i] !== undefined ? outputs[i] : "",
    }));

    const cppSnippet = question.codeSnippets.find((s) => s.langSlug === "cpp");
    const runnableCpp = cppSnippet
      ? buildRunnableCpp(question, cppSnippet.code, question.metaData)
      : "";

    return {
      name: question.title,
      group: "LeetCode",
      url: window.location.href,
      interactive: false,
      memoryLimit: 1024,
      timeLimit: 8000,
      tests,
      testType: "single",
      input: { type: "stdin" },
      output: { type: "stdout" },
      languages: {
        cpp: { template: runnableCpp },
      },
      batch: { id: 1, size: 1 },
    };
  }

  async function handleSend() {
    const titleSlug = getTitleSlug();
    if (!titleSlug) {
      showToast("Not on a problem page.", true);
      return;
    }

    try {
      showToast("Fetching problem data…");
      const question = await fetchQuestionData(titleSlug);

      const paramCount = getParamCount(question.metaData);
      const inputs = splitIntoInputs(question.exampleTestcases, paramCount);
      const outputs = extractOutputs(question.content);

      if (inputs.length === 0) {
        showToast("Could not find any example test cases.", true);
        return;
      }

      const payload = buildCphPayload(question, inputs, outputs);

      chrome.runtime.sendMessage(
        { type: "SEND_TO_CPH", payload },
        (response) => {
          if (response && response.ok) {
            showToast(`Sent ${inputs.length} test case(s) to VS Code ✓`);
          } else {
            showToast(
              "Could not reach CPH. Is VS Code + CPH running and listening on port 27121?",
              true
            );
          }
        }
      );
    } catch (err) {
      console.error("[LeetCode CPH Companion]", err);
      showToast(`Error: ${err.message}`, true);
    }
  }

  // --- Minimal feedback toast (no on-page button anymore — use the
  // toolbar icon instead) ------------------------------------------------

  let toastEl = null;
  function showToast(msg, isError = false) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.id = "lcc-toast";
      Object.assign(toastEl.style, {
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 999999,
        padding: "10px 14px",
        borderRadius: "6px",
        fontSize: "13px",
        color: "white",
        maxWidth: "280px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
      });
      document.body.appendChild(toastEl);
    }
    toastEl.style.background = isError ? "#d64545" : "#333";
    toastEl.textContent = msg;
    toastEl.style.display = "block";
    clearTimeout(toastEl._hideTimer);
    toastEl._hideTimer = setTimeout(() => {
      toastEl.style.display = "none";
    }, 4000);
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "TRIGGER_SEND") handleSend();
  });
})();
