import * as Blockly from "blockly";
import { ScopeManager, VISPI_INVALID_NAME } from "./ScopeManager";
import { VispiToolbox } from "./Toolbox";
import { NameAccessStates, ProcessNames } from "./Serialization";

export const VispiBlocks = Blockly.common.createBlockDefinitionsFromJsonArray([]);

/// UTILS ///

const ToUpperleadingAlphaNumeric = (str: string) => {
    str = str.replace(/[^a-zA-Z0-9_]/g, "");
    str = str.replace(/^[0-9_]+/, "");
    str = str.charAt(0).toUpperCase() + str.slice(1);
    return str;
};

const ToLowerleadingAlphaNumeric = (str: string) => {
    str = str.replace(/[^a-zA-Z0-9_]/g, "");
    str = str.replace(/^[0-9]+/, "");
    str = str.charAt(0).toLowerCase() + str.slice(1);
    return str;
};

const ScopeBlocks = (() => {
    const content = VispiToolbox.contents;
    for (const category of content) {
        if (category.kind === "category" && category.name === "Scopes") {
            return [
                "ProcessBlock",
                ...category.contents
                    .map((block: { type: any }) => block.type)
                    .filter((t) => t !== "RestrictNameBlock" && t !== "ReceiveNameBlock"),
            ];
        }
    }
    return [];
})();

const MustBeInExactScope = (block: any, parent: string, scope: string) => {
    const surroundingParent = block.getSurroundParent();
    if (!surroundingParent) return;

    if (surroundingParent.type !== parent || GetDirectChildren(surroundingParent, scope).indexOf(block) === -1) {
        block.unplug(true, true);
    }
};

const CanOnlyContain = (block: any, scope: string, types: string[]) => {
    const children = GetDirectChildren(block, scope);
    children.filter((c) => !types.includes(c.type)).forEach((c) => c.unplug(true, true));
};

const IsScopeBlock = (block: { type: any }) => {
    return ScopeBlocks.includes(block?.type);
};

const GetDirectChildren = (block: { getInputTargetBlock: (arg0: any) => any }, name: string) => {
    const children = [];
    let currentBlock = block?.getInputTargetBlock(name);
    while (currentBlock) {
        children.push(currentBlock);
        currentBlock = currentBlock.getNextBlock();
    }
    return children;
};

const HasChildren = (block: any, name: string) => {
    return GetDirectChildren(block, name).length > 0;
};

const GetAncestry = (block: {
    getParent: () => any;
    type: string;
    getInputTargetBlock: (arg0: string) => any;
    id: string;
}) => {
    const ancestry = [];
    let previous = null;

    if (IsScopeBlock(block)) block = block.getParent();
    while (block) {
        if (IsScopeBlock(block)) {
            const parallelCondition = previous?.type === "ParallelScopeBlock" && block.type === "ParallelScopeBlock";
            const choiceCondition = previous?.type === "ChoiceScopeBlock" && block.type === "ChoiceScopeBlock";
            if (!(parallelCondition || choiceCondition)) ancestry.unshift(block.id); // Consecutve (Parallel/Choice)ScopeBlocks are not added to ancestry.
        }

        previous = block;
        block = block.getParent();
    }
    return ancestry;
};

/// Scoping Blocks ///

VispiBlocks["RestrictScopeBlock"] = {
    init: function () {
        this.appendDummyInput()
            .appendField("restrict")
            .appendField(new Blockly.FieldTextInput("?", ToLowerleadingAlphaNumeric), "NEW");
        this.appendStatementInput("SCOPE").appendField("to");
        this.setColour("#FF6600");
        this.setPreviousStatement(true, null);
        this.setNextStatement(false, null);
    },
};

VispiBlocks["MultiRestrictScopeBlock"] = {
    init: function () {
        this.appendDummyInput().appendField("restrict all").setAlign(Blockly.inputs.Align.RIGHT);
        this.appendStatementInput("NAMES");
        this.appendDummyInput().appendField("to").setAlign(Blockly.inputs.Align.RIGHT);

        this.appendStatementInput("SCOPE");
        this.setColour("#FF6600");
        this.setPreviousStatement(true, null);
        this.setNextStatement(false, null);
    },
    onchange: function () {
        if (this.workspace) {
            CanOnlyContain(this, "NAMES", ["RestrictNameBlock"]);
        }
    },
};

VispiBlocks["RestrictNameBlock"] = {
    init: function () {
        this.appendDummyInput()
            .appendField("name")
            .appendField(new Blockly.FieldTextInput("?", ToLowerleadingAlphaNumeric), "NEW");
        this.setColour("#FF6600");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
    },

    onchange: function () {
        if (this.workspace) {
            MustBeInExactScope(this, "MultiRestrictScopeBlock", "NAMES");
        }
    },
};

VispiBlocks["ReceiveScopeBlock"] = {
    init: function () {
        this.appendDummyInput()
            .appendField("receive")
            .appendField(new Blockly.FieldTextInput("", ToLowerleadingAlphaNumeric), "NEW");
        this.appendValueInput("ON").appendField("on").setAlign(Blockly.inputs.Align.RIGHT);
        this.appendStatementInput("SCOPE");
        this.setColour("#208932");
        this.setPreviousStatement(true, null);
        this.setNextStatement(false, null);
    },
};

VispiBlocks["MultiReceiveScopeBlock"] = {
    init: function () {
        this.appendDummyInput().appendField("receive all").setAlign(Blockly.inputs.Align.RIGHT);
        this.appendStatementInput("NAMES");
        this.appendValueInput("ON").appendField("on").setAlign(Blockly.inputs.Align.RIGHT);
        this.appendStatementInput("SCOPE");
        this.setColour("#208932");
        this.setPreviousStatement(true, null);
        this.setNextStatement(false, null);
    },
    onchange: function () {
        if (this.workspace) {
            CanOnlyContain(this, "NAMES", ["ReceiveNameBlock"]);
        }
    },
};

VispiBlocks["ReceiveNameBlock"] = {
    init: function () {
        this.appendDummyInput()
            .appendField("name")
            .appendField(new Blockly.FieldTextInput("", ToLowerleadingAlphaNumeric), "NEW");
        this.setColour("#208932");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
    },
    onchange: function () {
        if (this.workspace) {
            MustBeInExactScope(this, "MultiReceiveScopeBlock", "NAMES");
        }
    },
};

VispiBlocks["GuardScopeBlock"] = {
    init: function () {
        const GuardOperators: Blockly.MenuGenerator = [
            ["is the same as", "="],
            ["is different from", "!="],
        ];

        this.appendValueInput("FIRST").appendField("if");
        this.appendDummyInput().appendField(new Blockly.FieldDropdown(GuardOperators), "OPERATION");
        this.appendValueInput("SECOND");
        this.appendStatementInput("SCOPE").appendField("then");
        this.setColour("#FFA0A4");
        this.setPreviousStatement(true, null);
        this.setNextStatement(false, null);
    },
};

VispiBlocks["ParallelParentBlock"] = {
    init: function () {
        this.appendDummyInput().appendField("run in parallel");
        this.appendStatementInput("PARALLEL").setCheck("ParallelScopeBlock");
        this.setPreviousStatement(true, null);
        this.setNextStatement(false, null);
        this.setColour("#55A0F4");
    },
    onchange: function () {
        if (this.workspace) {
            CanOnlyContain(this, "PARALLEL", ["ParallelScopeBlock"]);
        }
    },
};

VispiBlocks["ParallelScopeBlock"] = {
    init: function () {
        this.appendDummyInput().appendField("task");
        this.appendStatementInput("SCOPE");
        this.setPreviousStatement(true, ["ParallelScopeBlock", "ParallelParentBlock"]);
        this.setNextStatement(true, "ParallelScopeBlock");
        this.setColour("#55A0F4");
    },
    onchange: function () {
        if (this.workspace) {
            MustBeInExactScope(this, "ParallelParentBlock", "PARALLEL");
        }
    },
};

VispiBlocks["ChoiceParentBlock"] = {
    init: function () {
        this.appendDummyInput().appendField("choose from");
        this.appendStatementInput("CHOICE").setCheck("ChoiceScopeBlock");
        this.setPreviousStatement(true, null);
        this.setNextStatement(false, null);
        this.setColour("#33ccaa");
    },
    onchange: function () {
        if (this.workspace) {
            CanOnlyContain(this, "CHOICE", ["ChoiceScopeBlock"]);
        }
    },
};
VispiBlocks["ChoiceScopeBlock"] = {
    init: function () {
        this.appendDummyInput().appendField("choice");
        this.appendStatementInput("SCOPE");

        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#33ccaa");
    },
    onchange: function () {
        if (this.workspace) {
            MustBeInExactScope(this, "ChoiceParentBlock", "CHOICE");
        }
    },
};

/// Other Blocks ///

VispiBlocks["SendBlock"] = {
    init: function () {
        this.appendValueInput("MESSAGE").appendField("send");
        this.appendValueInput("ON").appendField("on");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#3366FF");
    },
};

VispiBlocks["MultiSendBlock"] = {
    init: function () {
        this.appendDummyInput().appendField("send all").setAlign(Blockly.inputs.Align.RIGHT);
        this.appendStatementInput("MESSAGES");
        this.appendValueInput("ON").appendField("on").setAlign(Blockly.inputs.Align.RIGHT);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#3366FF");
    },
    onchange: function () {
        if (this.workspace) {
            CanOnlyContain(this, "MESSAGES", ["SendNameBlock"]);
        }
    },
};

VispiBlocks["SendNameBlock"] = {
    init: function () {
        this.appendValueInput("MESSAGE").appendField("name");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#3366FF");
    },
    onchange: function () {
        if (this.workspace) {
            MustBeInExactScope(this, "MultiSendBlock", "MESSAGES");
        }
    },
};

VispiBlocks["SyncBlock"] = {
    init: function () {
        this.appendValueInput("ON").appendField("sync");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour("#3366FF");
    },
};

VispiBlocks["GlobalNameBlock"] = {
    init: function () {
        this.appendDummyInput()
            .appendField("global")
            .appendField(new Blockly.FieldTextInput("", ToLowerleadingAlphaNumeric), "NEW");
        this.setColour("#FFC310");
        this.setNextStatement(true, null);
        this.setPreviousStatement(true, null);
    },

    onchange: function () {
        // If surrounding parents are not 'GlobalNameBlock' then disconnect them.
        if (this.workspace && this.getParent() && this.getParent().type !== "GlobalNameBlock") {
            this.unplug(true, true);
        }
    },
};

VispiBlocks["NameAccessBlock"] = {
    init: function () {
        this.appendDummyInput().appendField(
            new Blockly.FieldDropdown([["?", VISPI_INVALID_NAME], ...NameAccessStates]),
            "NAME"
        );
        this.setColour("#FFC310");
        this.setOutput(true, null);
    },

    onchange: function () {
        if (this.workspace && this.getField("NAME")) {
            let names = ScopeManager.GetLastScope()?.GetNames(GetAncestry(this.getParent())) ?? [];

            this.getField("NAME").menuGenerator_ = [["?", VISPI_INVALID_NAME], ...names.map((n) => [n, n])];

            const value = this.getFieldValue("NAME");
            if (!names.includes(value)) {
                this.setWarningText("Name is not in scope.");
            } else {
                this.setWarningText(null);
            }
        }
    },
};

VispiBlocks["TerminationBlock"] = {
    init: function () {
        this.appendDummyInput().appendField("terminate");
        this.setPreviousStatement(true, null);
        this.setNextStatement(false, null);
        this.setColour("#000000");
    },
};

VispiBlocks["ProcessBlock"] = {
    init: function () {
        this.appendDummyInput()
            .appendField("Process")
            .appendField(
                new Blockly.FieldTextInput("UnnamedProcess", (str) => {
                    str = ToUpperleadingAlphaNumeric(str);
                    let scope = ScopeManager.GetLastScope();
                    if (scope) {
                        const id = scope.GetRawProcessId(str);
                        if (id === undefined) return str;
                        if (id !== this.id) {
                            let i = 0;
                            while (scope.GetRawProcessId(str + i) !== undefined) {
                                i++;
                            }
                            str = str + i;
                        }
                    }

                    return str;
                }),
                "PROCESS"
            );
        this.appendDummyInput().appendField("with parameters").setAlign(Blockly.inputs.Align.RIGHT);
        this.appendStatementInput("PARAMS");
        this.appendDummyInput().appendField("is defined as").setAlign(Blockly.inputs.Align.RIGHT);
        this.appendStatementInput("BODY");
        this.setColour("#7722DD");
        this.setPreviousStatement(false, null);
        this.setNextStatement(false, null);
    },

    onchange: function () {
        if (this.workspace) {
            CanOnlyContain(this, "PARAMS", ["ProcessParamBlock"]);
        }
    },
};

VispiBlocks["ProcessCallBlock"] = {
    init: function () {
        this.appendDummyInput()
            .appendField("call")
            .appendField(new Blockly.FieldDropdown(ProcessNames), "PROCESS_NAME");
        this.appendStatementInput("ARGS").appendField("with");
        this.setColour("#7722DD");
        this.setPreviousStatement(true, null);
        this.setNextStatement(false, null);
    },

    onchange: function () {
        if (this.workspace) {
            CanOnlyContain(this, "ARGS", ["ProcessArgBlock"]);

            let names = ScopeManager.GetLastScope()?.GetProcessNames();
            const menu: Blockly.MenuGenerator = names?.map((n) => [n, n]) ?? [["?", VISPI_INVALID_NAME]];

            this.getField("PROCESS_NAME").menuGenerator_ = menu;

            const paramCount = ScopeManager.GetLastScope()?.GetParams(this.getFieldValue("PROCESS_NAME")).length ?? 0;
            const argCount = GetDirectChildren(this, "ARGS").length;

            console.log(paramCount, argCount);

            if (paramCount !== argCount) {
                this.setWarningText(
                    `Expected ${paramCount} argument${paramCount === 1 ? "" : "s"}, but got ${argCount}.`
                );
            } else {
                this.setWarningText(null);
            }
        }
    },
};

VispiBlocks["ProcessParamBlock"] = {
    init: function () {
        this.appendDummyInput()
            .appendField("parameter")
            .appendField(new Blockly.FieldTextInput("?", ToLowerleadingAlphaNumeric), "NEW");
        this.setColour("#7722DD");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
    },

    onchange: function () {
        if (this.workspace) {
            MustBeInExactScope(this, "ProcessBlock", "PARAMS");
        }
    },
};

VispiBlocks["ProcessArgBlock"] = {
    init: function () {
        this.appendValueInput("ARG").appendField(new Blockly.FieldLabel("argument"), "LABEL");
        this.setColour("#7722DD");
        this.setOutput(false, null);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
    },

    onchange: function () {
        if (this.workspace) {
            const parentName = this.getSurroundParent()?.getFieldValue("PROCESS_NAME");
            if (parentName) {
                let scopeNames = ScopeManager.GetLastScope()?.GetParams(parentName) ?? [];
                if (scopeNames.length === 0) scopeNames = ScopeManager.GetParams(parentName); // When loading for the first time from JSON
                const thisIndex = GetDirectChildren(this.getSurroundParent(), "ARGS").indexOf(this);
                if (thisIndex < scopeNames.length && thisIndex !== -1) {
                    this.setFieldValue(scopeNames[thisIndex] + " =", "LABEL");
                    this.setColour("#7722DD");
                } else if (thisIndex >= scopeNames.length) {
                    this.setFieldValue(`ERROR: Too Many Args ${thisIndex + 1}/${scopeNames.length}`, "LABEL");
                    this.setColour("#f00");
                }
            }
            MustBeInExactScope(this, "ProcessCallBlock", "ARGS");
        }
    },
};

VispiBlocks["MainBlock"] = {
    init: function () {
        this.appendDummyInput().appendField("Program");
        this.appendStatementInput("MAIN");
        this.setColour("#FF3300");
        this.setPreviousStatement(false, null);
        this.setNextStatement(false, null);
    },

    onchange: function (event: any) {
        if (this.workspace && event.type === Blockly.Events.BLOCK_CREATE && event.blockId === this.id) {
            const last = ScopeManager.GetLastScope();
            if (last) {
                if (last.HasAlreadyDeclaredMain() && !HasChildren(this, "MAIN")) {
                    this.dispose();
                }
            }
        }
    },
};
