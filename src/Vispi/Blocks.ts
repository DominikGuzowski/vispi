import * as Blockly from "blockly";
import { VispiScope, VISPI_INVALID_NAME } from "./ScopeManager";
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
            return ["ProcessBlock", ...category.contents.map((block: { type: any }) => block.type)];
        }
    }
    return [];
})();

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
    onchange: function (event: any) {
        if (this.workspace) {
            const children = GetDirectChildren(this, "PARALLEL");
            children.filter((c) => c.type !== "ParallelScopeBlock").forEach((c) => c.unplug(true));
        }
    },
};

VispiBlocks["ParallelScopeBlock"] = {
    init: function () {
        this.appendDummyInput().appendField("sequence");
        this.appendStatementInput("SCOPE");
        this.setPreviousStatement(true, ["ParallelScopeBlock", "ParallelParentBlock"]);
        this.setNextStatement(true, "ParallelScopeBlock");
        this.setColour("#55A0F4");
    },
    onchange: function (event: any) {
        if (this.workspace) {
            const surrParent = this.getSurroundParent();
            if (surrParent?.type !== "ParallelParentBlock") {
                this.unplug(true, true);
            }
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
    onchange: function (event: any) {
        if (this.workspace) {
            const children = GetDirectChildren(this, "CHOICE");
            children.filter((c) => c.type !== "ChoiceScopeBlock").forEach((c) => c.unplug(true));
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
    onchange: function (event: any) {
        if (this.workspace) {
            const surrParent = this.getSurroundParent();
            if (surrParent?.type !== "ChoiceParentBlock") {
                this.unplug(true, true);
            }
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

VispiBlocks["GlobalNameBlock"] = {
    init: function () {
        this.appendDummyInput()
            .appendField("global")
            .appendField(new Blockly.FieldTextInput("", ToLowerleadingAlphaNumeric), "NEW");
        this.setColour("#FFC310");
        this.setNextStatement(true, null);
        this.setPreviousStatement(true, null);
    },

    onchange: function (event: any) {
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

    onchange: function (event: any) {
        if (this.workspace && this.getField("NAME")) {
            let names = VispiScope.GetLastScope()?.GetNames(GetAncestry(this.getParent())) ?? [];

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
                    let scope = VispiScope.GetLastScope();
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

    onchange: function (event: any) {
        if (this.workspace) {
            const parameters = GetDirectChildren(this, "PARAMS");
            parameters.filter((p) => p.type !== "ProcessParamBlock").forEach((p) => p.unplug(true));
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

    onchange: function (event: any) {
        if (this.workspace) {
            const parameters = GetDirectChildren(this, "ARGS");
            parameters.filter((p) => p.type !== "ProcessArgBlock").forEach((p) => p.unplug(true));

            let names = VispiScope.GetLastScope()?.GetProcessNames();
            const menu: Blockly.MenuGenerator = names?.map((n) => [n, n]) ?? [["?", VISPI_INVALID_NAME]];

            this.getField("PROCESS_NAME").menuGenerator_ = menu;
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
};

VispiBlocks["ProcessArgBlock"] = {
    init: function () {
        this.appendValueInput("ARG").appendField(new Blockly.FieldLabel("argument"), "LABEL");
        this.setColour("#7722DD");
        this.setOutput(false, null);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
    },

    onchange: function (event: any) {
        if (this.workspace) {
            const parentName = this.getSurroundParent()?.getFieldValue("PROCESS_NAME");
            if (parentName) {
                let scopeNames = VispiScope.GetLastScope()?.GetParams(parentName) ?? [];
                if (scopeNames.length === 0) scopeNames = VispiScope.GetParams(parentName); // When loading for the first time from JSON
                const thisIndex = GetDirectChildren(this.getSurroundParent(), "ARGS").indexOf(this);
                if (thisIndex < scopeNames.length && thisIndex !== -1) {
                    this.setFieldValue(scopeNames[thisIndex] + " =", "LABEL");
                } else if (thisIndex >= scopeNames.length) {
                    this.unplug(true, true);
                }
            }
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
            const last = VispiScope.GetLastScope();
            if (last) {
                const declared = last.HasAlreadyDeclaredMain();
                if (declared) {
                    this.dispose();
                }
            }
        }
    },
};
