import { mapToolName, unmapToolName, TOOL_NAME_MAP, REVERSE_TOOL_NAME_MAP } from "./packages/core/src/utils/qwen.ts";

console.log("TOOL_NAME_MAP:", TOOL_NAME_MAP);
console.log("REVERSE_TOOL_NAME_MAP:", REVERSE_TOOL_NAME_MAP);
console.log("mapToolName('Bash'):", mapToolName("Bash"));
console.log("mapToolName('run_bash_command'):", mapToolName("run_bash_command"));
console.log("unmapToolName('Bash'):", unmapToolName("Bash"));
console.log("unmapToolName('run_bash_command'):", unmapToolName("run_bash_command"));
