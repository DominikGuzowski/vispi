import * as Blockly from "blockly";
import { VispiScope, VISPI_INVALID_NAME } from "./ScopeManager";
// const VispiGenerator = new Blockly.Generator("VisPi");
// export default VispiGenerator;

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

class VispiCodeGenerator extends Blockly.Generator {
    protected scrub_(block: Blockly.Block, code: string, opt_thisOnly: boolean) {
        if (!IsMainOrProcessOrGlobalName(block) && !VispiScope.CanGenerate()) return "";
        const nextBlock = block.nextConnection?.targetBlock() || null;

        if (ShouldSeparate(block) && nextBlock) {
            return code + ". " + this.blockToCode(nextBlock);
        }

        if (ParallelScopes(block, nextBlock)) {
            return code + " | " + this.blockToCode(nextBlock);
        }

        return code + this.blockToCode(nextBlock);
    }
}

export const VispiGenerator = new VispiCodeGenerator("VisPi");
VispiGenerator.INDENT = "";

VispiGenerator.forBlock["GlobalNameBlock"] = function (block: Blockly.Block, generator: VispiCodeGenerator) {
    const name = block.getFieldValue("NEW") ?? "";

    if (name.length > 0) {
        VispiScope.InsertName(name);
    }

    return "";
};

VispiGenerator.forBlock["NameAccessBlock"] = function (block: Blockly.Block, generator: VispiCodeGenerator) {
    if (!VispiScope.CanGenerate()) return ["", 0];

    const name = block.getFieldValue("NAME");

    if (name === VISPI_INVALID_NAME) return ["", 0];

    return [name, 0];
};

VispiGenerator.forBlock["TerminationBlock"] = function (block: Blockly.Block, generator: VispiCodeGenerator) {
    if (!VispiScope.CanGenerate()) return "";

    return "0";
};

VispiGenerator.forBlock["SendBlock"] = function (block: Blockly.Block, generator: VispiCodeGenerator) {
    if (!VispiScope.CanGenerate()) return "";

    const name = generator.valueToCode(block, "ON", 0);
    const value = generator.valueToCode(block, "MESSAGE", 0);

    if (name.length > 0 && value.length > 0) {
        return `${name}'<${value}>`;
    }

    return ``;
};

VispiGenerator.forBlock["ReceiveScopeBlock"] = function (block: Blockly.Block, generator: VispiCodeGenerator) {
    if (!VispiScope.CanGenerate()) return "";

    const name = block.getFieldValue("NEW");
    const on = generator.valueToCode(block, "ON", 0);
    VispiScope.RegisterScope(block.id, "ReceiveScopeBlock");
    VispiScope.InsertName(name);
    const scope = generator.statementToCode(block, "SCOPE");
    VispiScope.PopScope();

    if (name.length > 0 && on.length > 0) {
        if (scope.length > 0) return `${on}(${name}). ${scope}`;
        else return `${on}(${name})`;
    }

    return ``;
};

VispiGenerator.forBlock["RestrictScopeBlock"] = function (block: Blockly.Block, generator: VispiCodeGenerator) {
    if (!VispiScope.CanGenerate()) return "";

    const name = block.getFieldValue("NEW");

    VispiScope.RegisterScope(block.id, "RestrictScopeBlock");
    VispiScope.InsertName(name);
    const scope = generator.statementToCode(block, "SCOPE");
    VispiScope.PopScope();

    if (scope.length > 0) {
        return `$${name}. ${scope}`;
    }

    return `$${name}`;
};

VispiGenerator.forBlock["GuardScopeBlock"] = function (block: Blockly.Block, generator: VispiCodeGenerator) {
    if (!VispiScope.CanGenerate()) return "";

    const first = generator.valueToCode(block, "FIRST", 0);
    const operation = block.getFieldValue("OPERATION");
    const second = generator.valueToCode(block, "SECOND", 0);

    VispiScope.RegisterScope(block.id, "GuardScopeBlock");
    const scope = generator.statementToCode(block, "SCOPE");
    VispiScope.PopScope();

    if (first.length > 0 && second.length > 0) {
        return `[${first}${operation}${second}] ${scope}`;
    }

    return ``;
};

VispiGenerator.forBlock["ChoiceScopeBlock"] = function (block: Blockly.Block, generator: VispiCodeGenerator) {
    if (!VispiScope.CanGenerate()) return "";

    VispiScope.RegisterScope(`${block.id}:SCOPE_ONE`, "ChoiceScopeBlock:FIRST");
    const scope = generator.statementToCode(block, "SCOPE_ONE");
    VispiScope.PopScope();

    VispiScope.RegisterScope(`${block.id}:SCOPE_TWO`, "ChoiceScopeBlock:SECOND");
    const scope2 = generator.statementToCode(block, "SCOPE_TWO");
    VispiScope.PopScope();

    return `(${scope} + ${scope2})`;
};

VispiGenerator.forBlock["ParallelScopeBlock"] = function (block: Blockly.Block, generator: VispiCodeGenerator) {
    if (!VispiScope.CanGenerate()) return "";

    VispiScope.RegisterScope(block.id, "ParallelScopeBlock");
    const scope = generator.statementToCode(block, "SCOPE");
    VispiScope.PopScope();

    return scope;
};

VispiGenerator.forBlock["ParallelParentBlock"] = function (block: Blockly.Block, generator: VispiCodeGenerator) {
    if (!VispiScope.CanGenerate()) return "";

    VispiScope.RegisterScope(block.id, "ParallelParentBlock");
    const scopes = generator.statementToCode(block, "PARALLEL");
    VispiScope.PopScope();

    return `(${scopes})`;
};

VispiGenerator.forBlock["ProcessDefinitionBlock"] = function (block: Blockly.Block, generator: VispiCodeGenerator) {
    const name = block.getFieldValue("NAME");
    const scope = generator.statementToCode(block, "STACK");
    return `${name} = ${scope}`;
};

VispiGenerator.forBlock["ProcessInvocationBlock"] = function (block: Blockly.Block, generator: VispiCodeGenerator) {
    const name = block.getFieldValue("NAME");

    return `${name}()`;
};

VispiGenerator.forBlock["ProcessBlock"] = function (block: Blockly.Block, generator: VispiCodeGenerator) {
    VispiScope.SetGeneration(true);

    const process = block.getFieldValue("PROCESS");
    const params = GetDirectChildren(block, "PARAMS");
    let paramNames = [];
    for (const param of params) {
        const name = param.getFieldValue("NEW");
        paramNames.push(name);
    }

    VispiScope.RegisterProcess(block.id, process, paramNames);
    const scope = generator.statementToCode(block, "BODY");
    VispiScope.PopScope();

    let paramString = paramNames.join(", ");
    if (paramString.length > 0) {
        paramString = `(${paramString})`;
    }

    VispiScope.SetGeneration(false);
    return `${process}${paramString} = ${scope}`;
};

VispiGenerator.forBlock["ProcessCallBlock"] = function (block: Blockly.Block, generator: VispiCodeGenerator) {
    if (!VispiScope.CanGenerate()) return "";

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
    VispiScope.SetGeneration(true);
    VispiScope.RegisterScope(block.id, "MainBlock");
    const scope = generator.statementToCode(block, "MAIN");
    VispiScope.PopScope();
    VispiScope.SetGeneration(false);
    return scope;
};
