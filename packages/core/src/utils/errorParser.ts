/**
 * 识别并解析 Provider 返回的错误信息
 */
export const isContextOverflowError = (errorText: string): boolean => {
  const lower = errorText.toLowerCase();
  return (
    lower.includes("context_length_exceeded") ||
    lower.includes("too many tokens") ||
    lower.includes("maximum context length") ||
    lower.includes("rate_limit_reached") && lower.includes("tokens")
  );
};

export const isOutputTruncatedError = (finishReason: string): boolean => {
  return finishReason === "length" || finishReason === "max_tokens";
};
