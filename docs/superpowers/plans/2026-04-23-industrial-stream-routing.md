# Industrial Stream Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the stream and non-stream transformation logic in `claude-code-router` to match the industrial stability of `9router` and `cc-switch`, ensuring zero-latency starts, byte-perfect stream handling, and robust tool call recovery.

**Architecture:**
- **Zero-Latency Start:** Send `message_start` immediately upon stream initiation with fallback IDs/Models.
- **Byte-Level Buffering:** Implement a binary buffer (`Uint8Array`) to handle UTF-8 multi-byte character splits across TCP chunks.
- **Robust Tool State:** Buffer tool arguments and auto-close JSON if the stream terminates unexpectedly.
- **Strict Block Exclusivity:** Ensure `content_block_stop` is always sent before switching between thinking, text, and tool blocks.

**Tech Stack:** TypeScript, Fastify (Node.js), Web Streams API.

---

### Task 1: Byte-Perfect Stream Buffer Implementation

**Files:**
- Modify: `packages/core/src/transformer/anthropic.transformer.ts`

- [ ] **Step 1: Update convertOpenAIStreamToAnthropic to use binary buffering**

```typescript
// Replace lines with binary buffer logic
const reader = openaiStream.getReader();
let partialLine = new Uint8Array(0);

while (true) {
  const { done, value } = await reader.read();
  
  if (value) {
    // Combine existing partial line with new chunk
    const combined = new Uint8Array(partialLine.length + value.length);
    combined.set(partialLine);
    combined.set(value, partialLine.length);
    
    let start = 0;
    for (let i = 0; i < combined.length; i++) {
      if (combined[i] === 10) { // Newline \n
        const lineBytes = combined.slice(start, i);
        const line = decoder.decode(lineBytes, { stream: true });
        if (line.trim()) processLine(line);
        start = i + 1;
      }
    }
    partialLine = combined.slice(start);
  }

  if (done) {
    if (partialLine.length > 0) {
      const line = decoder.decode(partialLine);
      if (line.trim()) processLine(line);
    }
    break;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/core/src/transformer/anthropic.transformer.ts
git commit -m "feat: implement byte-perfect binary stream buffering"
```

---

### Task 2: Zero-Latency Message Start

**Files:**
- Modify: `packages/core/src/transformer/anthropic.transformer.ts`

- [ ] **Step 1: Move message_start to before the read loop**

```typescript
// Initial state setup
const initialModel = context.req.body?.model || "claude-3-5-sonnet-20241022";
safeEnqueue("message_start", {
  type: "message_start",
  message: {
    id: messageId,
    type: "message",
    role: "assistant",
    model: initialModel,
    usage: {
      input_tokens: 0,
      output_tokens: 0,
      cache_read_input_tokens: 0,
      cache_creation_input_tokens: 0,
      thinking_tokens: 0
    }
  }
});
state.hasStarted = true;
```

- [ ] **Step 2: Commit**

```bash
git add packages/core/src/transformer/anthropic.transformer.ts
git commit -m "feat: implement zero-latency message start"
```

---

### Task 3: Robust Tool Call Argument Recovery

**Files:**
- Modify: `packages/core/src/transformer/anthropic.transformer.ts`

- [ ] **Step 1: Add JSON auto-close helper for tool arguments**

```typescript
const tryFixJson = (json: string): string => {
  let openBraces = (json.match(/{/g) || []).length;
  let closeBraces = (json.match(/}/g) || []).length;
  return json + "}".repeat(Math.max(0, openBraces - closeBraces));
};

// Use in stopAllToolBlocks
const stopAllToolBlocks = () => {
  for (const [tIdx, toolInfo] of state.toolCallMap) {
    // If stream ended abruptly, attempt to fix JSON
    if (!state.hasFinished) {
      // Logic to send a final delta with fixed JSON if needed
    }
    safeEnqueue("content_block_stop", {
      type: "content_block_stop",
      index: toolInfo.blockIndex
    });
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add packages/core/src/transformer/anthropic.transformer.ts
git commit -m "feat: add robust tool call recovery and JSON fixing"
```

---

### Task 4: Unified Thinking Block Sequence (Non-Streaming)

**Files:**
- Modify: `packages/core/src/transformer/anthropic.transformer.ts`

- [ ] **Step 1: Ensure thinking block is always the first content item in non-streaming**

```typescript
const content: any[] = [];

// Priority 1: Thinking
if (thinkingContent) {
  content.push({
    type: "thinking",
    thinking: thinkingContent,
    signature: thinkingSignature || "none"
  });
}

// Priority 2: Text/Annotations
if (textContent) {
  content.push({ type: "text", text: textContent });
}

// Priority 3: Tool Use
if (toolCalls) {
  // ... map tool calls
}
```

- [ ] **Step 2: Verify with mock responses**

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/transformer/anthropic.transformer.ts
git commit -m "fix: unified thinking block sequence in non-streaming response"
```
