// src/setup/step-agent-name.ts — Step 5: Set the agent's display name.

import { input } from "@inquirer/prompts";
import { c, printSuccess } from "@/setup/shared.ts";

export async function stepAgentName(existingConfig: any | null): Promise<string> {
    console.log(`${c.cyan}${c.bold}  Agent Name${c.reset}`);
    console.log(`${c.cyan}  ${"━".repeat(40)}${c.reset}`);
    console.log("");

    const current = existingConfig?.agent?.name ?? "ForkScout";

    const name = await input({
        message: "Agent name",
        default: current,
    });

    const chosen = name || current;
    printSuccess(`Agent name: ${chosen}`);
    console.log("");
    return chosen;
}
