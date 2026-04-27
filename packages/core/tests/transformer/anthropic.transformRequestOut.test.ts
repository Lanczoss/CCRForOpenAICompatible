import { AnthropicTransformer } from "../../src/transformer/anthropic.transformer";
import assert from "node:assert";

async function testTransformRequestOut() {
  console.log("Testing AnthropicTransformer.transformRequestOut...");

  const transformer = new AnthropicTransformer();
  const request = {
    model: "claude-3-5-sonnet-20241022",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Here is the result of the tool:" },
          { 
            type: "tool_result", 
            tool_use_id: "tool_123", 
            content: "Success",
            is_error: false
          },
          { type: "text", text: "What should I do next?" }
        ]
      }
    ]
  };

  const result = await transformer.transformRequestOut(request);

  // 1. Check if user text blocks are joined into a single message
  const userMessages = result.messages.filter(m => m.role === "user");
  assert.strictEqual(userMessages.length, 1, "Should have exactly one user message for text");
  
  const userContent = userMessages[0].content;
  if (typeof userContent === "string") {
    assert.strictEqual(userContent, "Here is the result of the tool:\nWhat should I do next?");
  } else if (Array.isArray(userContent)) {
    const textPart = userContent.find((c: any) => c.type === "text");
    assert.strictEqual(textPart?.text, "Here is the result of the tool:\nWhat should I do next?");
  } else {
    assert.fail("User content should be string or array");
  }

  // 2. Check if tool result is a separate message
  const toolMessages = result.messages.filter(m => m.role === "tool");
  assert.strictEqual(toolMessages.length, 1, "Should have exactly one tool message");
  assert.strictEqual(toolMessages[0].tool_call_id, "tool_123");
  assert.strictEqual(toolMessages[0].content, "Success");

  // 3. Check order: user first, then tool (as per implementation)
  assert.strictEqual(result.messages[0].role, "user");
  assert.strictEqual(result.messages[1].role, "tool");

  // 4. Test error handling
  const requestWithError = {
    model: "claude-3-5-sonnet-20241022",
    messages: [
      {
        role: "user",
        content: [
          { 
            type: "tool_result", 
            tool_use_id: "tool_err", 
            content: "Permission denied",
            is_error: true
          }
        ]
      }
    ]
  };

  const resultErr = await transformer.transformRequestOut(requestWithError);
  const toolMsgErr = resultErr.messages.find(m => m.tool_call_id === "tool_err");
  assert.strictEqual(toolMsgErr?.content, "Error: Permission denied");

  // 5. Test assistant message mapping
  console.log("Testing assistant message mapping...");
  const assistantRequest = {
    model: "claude-3-5-sonnet-20241022",
    messages: [
      {
        role: "assistant",
        content: [
          { type: "thinking", thinking: "I need to run ls", signature: "sig123" },
          { type: "text", text: "Running ls now." },
          { type: "tool_use", id: "call_456", name: "Bash", input: { command: "ls" } }
        ]
      }
    ]
  };

  const resultAssistant = await transformer.transformRequestOut(assistantRequest);
  const assistantMsg = resultAssistant.messages[0];
  assert.strictEqual(assistantMsg.role, "assistant");
  assert.strictEqual(assistantMsg.content, "I need to run ls\n\nRunning ls now.");
  assert.deepStrictEqual(assistantMsg.thinking, { content: "I need to run ls", signature: "sig123" });
  assert.strictEqual(assistantMsg.tool_calls?.length, 1);
  assert.strictEqual(assistantMsg.tool_calls[0].id, "call_456");
  assert.strictEqual(assistantMsg.tool_calls[0].function.name, "Bash");

  console.log("✅ AnthropicTransformer.transformRequestOut tests passed!");
}

testTransformRequestOut().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
