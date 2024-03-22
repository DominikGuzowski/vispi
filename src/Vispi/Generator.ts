import * as Blockly from "blockly";
import { ScopeManager, VISPI_INVALID_NAME } from "./ScopeManager";

const GetDirectChildren = (block: Blockly.Block, name: string) => {
    const children = [];
    let currentBlock = block.getInputTargetBlock(name);
    while (currentBlock) {
        children.push(currentBlock);
        currentBlock = currentBlock.getNextBlock();
    }
    return children;
};

const ShouldSeparate = (block: Blockly.Block | null) => {
    switch (block?.type) {
        case "SendBlock":
        case "SyncBlock":
        case "MultiSendBlock":
        case "ReceiveScopeBlock":
        case "TerminationBlock":
            return true;
        default:
            return false;
    }
};

const IsMainOrProcessOrGlobalName = (block: Blockly.Block | null) => {
    switch (block?.type) {
        case "MainBlock":
        case "ProcessBlock":
        case "GlobalNameBlock":
            return true;
        default:
            return false;
    }
};

const ParallelScopes = (a: Blockly.Block | null, b: Blockly.Block | null) => {
    return a?.type === "ParallelScopeBlock" && b?.type === "ParallelScopeBlock";
};

const ChoiceScopes = (a: Blockly.Block | null, b: Blockly.Block | null) => {
    return a?.type === "ChoiceScopeBlock" && b?.type === "ChoiceScopeBlock";
};
class VispiCodeGenerator extends Blockly.Generator {
    protected scrub_(block: Blockly.Block, code: string, opt_thisOnly: boolean) {
        if (!IsMainOrProcessOrGlobalName(block) && !ScopeManager.CanGenerate()) return "";
        const nextBlock = block.nextConnection?.targetBlock() || null;

        const next = this.blockToCode(nextBlock);

        console.log(`*${next}*`);

        const hasCode =
            typeof next === "object"
                ? next[0].replace(/\s/g, "").length > 0
                : next.replace(/\s/g, "").length > 0 && code.length > 0;
        if (ChoiceScopes(block, nextBlock) && hasCode) {
            return code + " + " + next;
        }

        if (ParallelScopes(block, nextBlock) && hasCode) {
            return code + " | " + next;
        }

        if (ShouldSeparate(block) && nextBlock && hasCode) {
            return code + ". " + next;
        }

        return code + next;
    }
}

export const VispiGenerator = new VispiCodeGenerator("VisPi");
VispiGenerator.INDENT = "";

VispiGenerator.forBlock["GlobalNameBlock"] = function (block: Blockly.Block, generator: VispiCodeGenerator) {
    const name = block.getFieldValue("NEW") ?? "";

    if (name.length > 0) {
        ScopeManager.InsertName(name);
    }

    return "";
};

VispiGenerator.forBlock["NameAccessBlock"] = function (block: Blockly.Block, generator: VispiCodeGenerator) {
    if (!ScopeManager.CanGenerate()) return ["", 0];

    const name = block.getFieldValue("NAME");

    if (name === VISPI_INVALID_NAME) return ["", 0];

    return [name, 0];
};

VispiGenerator.forBlock["TerminationBlock"] = function (block: Blockly.Block, generator: VispiCodeGenerator) {
    if (!ScopeManager.CanGenerate()) return "";

    return "0";
};

VispiGenerator.forBlock["SendBlock"] = function (block: Blockly.Block, generator: VispiCodeGenerator) {
    if (!ScopeManager.CanGenerate()) return "";

    const name = generator.valueToCode(block, "ON", 0);
    const value = generator.valueToCode(block, "MESSAGE", 0);

    if (name.length > 0 && value.length > 0) {
        return `${name}'<${value}>`;
    }

    return ``;
};

VispiGenerator.forBlock["MultiSendBlock"] = function (block: Blockly.Block, generator: VispiCodeGenerator) {
    if (!ScopeManager.CanGenerate()) return "";

    const on = generator.valueToCode(block, "ON", 0);
    const messages = GetDirectChildren(block, "MESSAGES")
        .map((message) => generator.valueToCode(message, "MESSAGE", 0))
        .filter((m) => m.length > 0);

    if (on.length > 0 && messages.length > 0) {
        return messages.map((m) => `${on}'<${m}>`).join(". ");
    }
    return ``;
};

VispiGenerator.forBlock["SendNameBlock"] = function (block: Blockly.Block, generator: VispiCodeGenerator) {
    // Handled in MultiSendBlock
    return "";
};

VispiGenerator.forBlock["SyncBlock"] = function (block: Blockly.Block, generator: VispiCodeGenerator) {
    if (!ScopeManager.CanGenerate()) return "";

    const name = generator.valueToCode(block, "ON", 0);

    if (name.length > 0) {
        return `${name}'<${name}>`;
    }

    return ``;
};

VispiGenerator.forBlock["ReceiveScopeBlock"] = function (block: Blockly.Block, generator: VispiCodeGenerator) {
    if (!ScopeManager.CanGenerate()) return "";

    const name = block.getFieldValue("NEW");
    const on = generator.valueToCode(block, "ON", 0);
    ScopeManager.RegisterScope(block.id, "ReceiveScopeBlock");
    ScopeManager.InsertName(name);
    const scope = generator.statementToCode(block, "SCOPE");
    ScopeManager.PopScope();

    if (name.length > 0 && on.length > 0) {
        if (scope.length > 0) return `${on}(${name}). ${scope}`;
        else return `${on}(${name})`;
    }

    return ``;
};

VispiGenerator.forBlock["MultiReceiveScopeBlock"] = function (block: Blockly.Block, generator: VispiCodeGenerator) {
    if (!ScopeManager.CanGenerate()) return "";

    ScopeManager.RegisterScope(block.id, "MultiReceiveScopeBlock");
    const names = GetDirectChildren(block, "NAMES")
        .map((name) => name.getFieldValue("NEW"))
        .filter((n) => n.length > 0);

    const on = generator.valueToCode(block, "ON", 0);
    generator.statementToCode(block, "NAMES");

    const scope = generator.statementToCode(block, "SCOPE");
    ScopeManager.PopScope();

    if (scope.length > 0) {
        return `${names.map((n) => `${on}(${n})`).join(". ")}. ${scope}`;
    }

    return `${names.map((n) => `${on}(${n})`).join(". ")}`;
};

VispiGenerator.forBlock["ReceiveNameBlock"] = function (block: Blockly.Block, generator: VispiCodeGenerator) {
    if (!ScopeManager.CanGenerate()) return "";
    const name = block.getFieldValue("NEW");

    if (name.length > 0) {
        ScopeManager.InsertName(name);
    }

    return "";
};

VispiGenerator.forBlock["RestrictScopeBlock"] = function (block: Blockly.Block, generator: VispiCodeGenerator) {
    if (!ScopeManager.CanGenerate()) return "";

    const name = block.getFieldValue("NEW");
    if (name === VISPI_INVALID_NAME || name.length === 0) return "";

    ScopeManager.RegisterScope(block.id, "RestrictScopeBlock");
    ScopeManager.InsertName(name);
    const scope = generator.statementToCode(block, "SCOPE");
    ScopeManager.PopScope();

    if (scope.length > 0) {
        return `$${name}. ${scope}`;
    }

    return `$${name}`;
};

VispiGenerator.forBlock["MultiRestrictScopeBlock"] = function (block: Blockly.Block, generator: VispiCodeGenerator) {
    if (!ScopeManager.CanGenerate()) return "";

    ScopeManager.RegisterScope(block.id, "MultiRestrictScopeBlock");
    const names = GetDirectChildren(block, "NAMES")
        .map((name) => name.getFieldValue("NEW"))
        .filter((n) => n.length > 0);

    generator.statementToCode(block, "NAMES");

    const namesString = names.map((s) => `$${s}`).join(". ");

    if (namesString.length === 0) return "";

    const scope = generator.statementToCode(block, "SCOPE");
    ScopeManager.PopScope();

    if (scope.length > 0) {
        return `${namesString}. ${scope}`;
    }

    return `${namesString}`;
};

VispiGenerator.forBlock["RestrictNameBlock"] = function (block: Blockly.Block, generator: VispiCodeGenerator) {
    if (!ScopeManager.CanGenerate()) return "";
    const name = block.getFieldValue("NEW");

    if (name.length > 0) {
        ScopeManager.InsertName(name);
    }

    return "";
};

VispiGenerator.forBlock["GuardScopeBlock"] = function (block: Blockly.Block, generator: VispiCodeGenerator) {
    if (!ScopeManager.CanGenerate()) return "";

    const first = generator.valueToCode(block, "FIRST", 0);
    const operation = block.getFieldValue("OPERATION");
    const second = generator.valueToCode(block, "SECOND", 0);

    ScopeManager.RegisterScope(block.id, "GuardScopeBlock");
    const scope = generator.statementToCode(block, "SCOPE");
    ScopeManager.PopScope();

    if (first.length > 0 && second.length > 0) {
        return `[${first}${operation}${second}] ${scope}`;
    }

    return ``;
};

VispiGenerator.forBlock["ChoiceScopeBlock"] = function (block: Blockly.Block, generator: VispiCodeGenerator) {
    if (!ScopeManager.CanGenerate()) return "";

    ScopeManager.RegisterScope(block.id, "ChoiceScopeBlock");
    const scope = generator.statementToCode(block, "SCOPE");
    ScopeManager.PopScope();

    return scope;
};

VispiGenerator.forBlock["ParallelScopeBlock"] = function (block: Blockly.Block, generator: VispiCodeGenerator) {
    if (!ScopeManager.CanGenerate()) return "";

    ScopeManager.RegisterScope(block.id, "ParallelScopeBlock");
    const scope = generator.statementToCode(block, "SCOPE");
    ScopeManager.PopScope();
    if (scope.replace(/\s/g, "").length === 0) return "";
    return scope;
};

VispiGenerator.forBlock["ChoiceParentBlock"] = function (block: Blockly.Block, generator: VispiCodeGenerator) {
    if (!ScopeManager.CanGenerate()) return "";

    const choiceCount = GetDirectChildren(block, "CHOICE").filter(
        (b) => generator.statementToCode(b, "SCOPE").replace(/\s/g, "").length > 0
    ).length;
    ScopeManager.RegisterScope(block.id, "ChoiceParentBlock");
    const scopes = generator.statementToCode(block, "CHOICE");
    ScopeManager.PopScope();

    if (choiceCount > 1) {
        if (["MainBlock", "ProcessBlock"].includes(ScopeManager.GetCurrentScopeType())) return `${scopes}`;

        return `(${scopes})`;
    } else if (choiceCount === 1) return scopes;
    else return "";
};

VispiGenerator.forBlock["ParallelParentBlock"] = function (block: Blockly.Block, generator: VispiCodeGenerator) {
    if (!ScopeManager.CanGenerate()) return "";

    const parallelCount = GetDirectChildren(block, "PARALLEL").filter(
        (b) => generator.statementToCode(b, "SCOPE").replace(/\s/g, "").length > 0
    ).length;
    ScopeManager.RegisterScope(block.id, "ParallelParentBlock");
    const scopes = generator.statementToCode(block, "PARALLEL");
    ScopeManager.PopScope();

    if (parallelCount > 1) {
        if (["MainBlock", "ProcessBlock"].includes(ScopeManager.GetCurrentScopeType())) return `${scopes}`;
        return `(${scopes})`;
    } else if (parallelCount === 1) return scopes;
    else return "";
};

// VispiGenerator.forBlock["ProcessDefinitionBlock"] = function (block: Blockly.Block, generator: VispiCodeGenerator) {
//     const name = block.getFieldValue("NAME");
//     const scope = generator.statementToCode(block, "STACK");
//     return `${name} = ${scope}`;
// };

// VispiGenerator.forBlock["ProcessInvocationBlock"] = function (block: Blockly.Block, generator: VispiCodeGenerator) {
//     const name = block.getFieldValue("NAME");

//     return `${name}()`;
// };

VispiGenerator.forBlock["ProcessBlock"] = function (block: Blockly.Block, generator: VispiCodeGenerator) {
    ScopeManager.SetGeneration(true);

    const process = block.getFieldValue("PROCESS");
    const params = GetDirectChildren(block, "PARAMS");
    let paramNames = [];
    for (const param of params) {
        const name = param.getFieldValue("NEW");
        paramNames.push(name);
    }

    ScopeManager.RegisterProcess(block.id, process, paramNames);
    const scope = generator.statementToCode(block, "BODY");
    ScopeManager.PopScope();

    let paramString = paramNames.join(", ");
    if (paramString.length > 0) {
        paramString = `(${paramString})`;
    }

    ScopeManager.SetGeneration(false);
    if (scope.replace(/\s/g, "").length === 0) return "";
    return `${process}${paramString} = ${scope}`;
};

VispiGenerator.forBlock["ProcessCallBlock"] = function (block: Blockly.Block, generator: VispiCodeGenerator) {
    if (!ScopeManager.CanGenerate()) return "";

    const process = block.getFieldValue("PROCESS_NAME");

    if (process === VISPI_INVALID_NAME) return "";

    const args = GetDirectChildren(block, "ARGS");
    let argNames = [];
    for (const arg of args) {
        const name = generator.valueToCode(arg, "ARG", 0);
        argNames.push(name);
    }

    let argString = argNames.join(", ");
    if (argString.length > 0) {
        argString = `(${argString})`;
    }

    return `${process}${argString}`;
};

VispiGenerator.forBlock["ProcessParamBlock"] = function (block: Blockly.Block, generator: VispiCodeGenerator) {
    return ``;
};

VispiGenerator.forBlock["ProcessArgBlock"] = function (block: Blockly.Block, generator: VispiCodeGenerator) {
    return ``;
};

VispiGenerator.forBlock["MainBlock"] = function (block: Blockly.Block, generator: VispiCodeGenerator) {
    ScopeManager.SetGeneration(true);
    ScopeManager.RegisterScope(block.id, "MainBlock");
    const scope = generator.statementToCode(block, "MAIN");
    ScopeManager.PopScope();
    ScopeManager.SetGeneration(false);
    return scope;
};

// VispiGenerator.forBlock["TestBlock"] = function (block: Blockly.Block, generator: VispiCodeGenerator) {
//     return "";
// };

// VispiGenerator.forBlock["TestBlock2"] = function (block: Blockly.Block, generator: VispiCodeGenerator) {
//     return "";
// };
