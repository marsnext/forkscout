// src/setup/vault-manager.ts — Interactive vault secrets manager for the setup wizard.
// Secrets are shown as selectable items — click one to edit/delete it.

import { select, input, password } from "@inquirer/prompts";
import { listAliases, getSecret, setSecret, deleteSecret } from "@/secrets/vault.ts";

const c = {
    reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
    green: "\x1b[32m", cyan: "\x1b[36m", yellow: "\x1b[33m",
    red: "\x1b[31m", magenta: "\x1b[35m",
};

function mask(value: string): string {
    if (value.length <= 8) return "••••••••";
    return value.slice(0, 6) + "•••";
}

/** Interactive vault manager loop. Secrets are selectable — pick one to edit/delete. */
export async function manageVaultSecrets(): Promise<void> {
    while (true) {
        const aliases = listAliases();

        console.log(`\n  ${c.cyan}${c.bold}Vault Secrets${c.reset}${aliases.length > 0 ? ` ${c.dim}(${aliases.length})${c.reset}` : ""}\n`);

        const choices: { name: string; value: string }[] = aliases.map((a) => {
            const val = getSecret(a);
            const masked = val ? mask(val) : `${c.red}(empty)${c.reset}`;
            return { name: `${c.bold}${a}${c.reset} ${c.dim}= ${masked}${c.reset}`, value: a };
        });

        choices.push(
            { name: `${c.magenta}+ Add new secret${c.reset}`, value: "__add__" },
            { name: `${c.green}← Back${c.reset} ${c.dim}— return to menu${c.reset}`, value: "__done__" },
        );

        const picked = await select({ message: "Select a secret to edit/delete, or add new", choices, pageSize: 20 });

        if (picked === "__done__") { console.log(""); return; }
        if (picked === "__add__") { await addSecret(); continue; }

        // User picked a specific secret — show actions for it
        await secretActions(picked);
    }
}

async function secretActions(alias: string): Promise<void> {
    const current = getSecret(alias);
    const masked = current ? mask(current) : "(empty)";
    console.log(`\n  ${c.bold}${alias}${c.reset} ${c.dim}= ${masked}${c.reset}\n`);

    const action = await select({
        message: alias,
        pageSize: 20,
        choices: [
            { name: `Edit value`, value: "edit" },
            { name: `${c.red}Delete${c.reset}`, value: "delete" },
            { name: `${c.dim}Cancel${c.reset}`, value: "cancel" },
        ],
    });

    if (action === "cancel") return;

    if (action === "edit") {
        const value = await password({ message: `New value for ${alias} (blank to keep):` });
        if (!value.trim()) {
            console.log(`  ${c.dim}Kept unchanged.${c.reset}`);
            return;
        }
        setSecret(alias, value.trim());
        console.log(`  ${c.green}✓ Updated ${alias}${c.reset}`);
    } else if (action === "delete") {
        const sure = await select<string>({
            message: `Delete ${c.red}${alias}${c.reset}? This cannot be undone.`,
            pageSize: 20,
            choices: [
                { value: "no", name: `${c.red}No${c.reset}  ${c.dim}— keep it${c.reset}` },
                { value: "yes", name: `${c.green}Yes${c.reset} ${c.dim}— delete permanently${c.reset}` },
            ],
        });
        if (sure !== "yes") { console.log(`  ${c.dim}Cancelled.${c.reset}`); return; }
        deleteSecret(alias);
        console.log(`  ${c.green}✓ Deleted ${alias}${c.reset}`);
    }
}

async function addSecret(): Promise<void> {
    const alias = await input({
        message: "Secret name (e.g. MY_API_KEY):",
        validate: (v) => {
            if (!v.trim()) return "Name cannot be empty";
            if (!/^[A-Z0-9_]+$/i.test(v.trim())) return "Use UPPER_SNAKE_CASE (letters, digits, underscores)";
            if (getSecret(v.trim())) return `"${v.trim()}" already exists — select it to edit`;
            return true;
        },
    });
    const value = await password({ message: `Value for ${alias.trim()}:` });
    if (!value.trim()) {
        console.log(`  ${c.yellow}Skipped — empty value.${c.reset}`);
        return;
    }
    setSecret(alias.trim(), value.trim());
    console.log(`  ${c.green}✓ Added ${alias.trim()}${c.reset}`);
}
