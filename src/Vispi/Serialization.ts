import * as Blockly from "blockly/core";
import { VispiScopeManager, VISPI_INVALID_NAME } from "./ScopeManager";

const VISPI_WORKSPACE = "vispi";
const VISPI_STATE = "vispi:scope";

export const NameAccessStates: [string, string][] = [["?", VISPI_INVALID_NAME]];
export const ProcessNames: [string, string][] = [["?", VISPI_INVALID_NAME]];

const ExtractData = (jsonStr: string) => {
    NameAccessStates.length = 1;
    ProcessNames.length = 1;
    const rgx = /"NEW":\s*"(?<NEW>([^"]*))"/g;
    const processRgx = /"PROCESS":\s*"(?<PROCESS>([^"]*))"/g;
    const allMatches = [...jsonStr.matchAll(rgx)];
    const allProcessMatches = [...jsonStr.matchAll(processRgx)];
    for (const match of allMatches) {
        const { NEW } = match.groups ? match.groups : { NEW: undefined };
        if (NEW) NameAccessStates.push([NEW, NEW]);
    }

    for (const match of allProcessMatches) {
        const { PROCESS } = match.groups ? match.groups : { PROCESS: undefined };
        if (PROCESS) ProcessNames.push([PROCESS, PROCESS]);
    }
};

export const Save = (workspace: Blockly.WorkspaceSvg, key: string, scope?: VispiScopeManager) => {
    if (scope) localStorage.setItem(key + ":scope", JSON.stringify(scope?.GetLastScope()));
    const json = Blockly.serialization.workspaces.save(workspace);
    localStorage.setItem(key, JSON.stringify(json));
};

export const Load = (key: string, scope?: VispiScopeManager): object => {
    const json = localStorage.getItem(key) || "{}";
    if (json.length > 0) {
        ExtractData(json);
    }
    const data = JSON.parse(json);
    const scopeData = localStorage.getItem(key + ":scope");
    if (scopeData && scopeData !== "undefined") {
        scope?.Load(JSON.parse(scopeData));
    }
    return data;
};

export const SerializeFromCache = () => {
    const workspace = JSON.parse(localStorage.getItem(VISPI_WORKSPACE) ?? "{}");
    const state = JSON.parse(localStorage.getItem(VISPI_STATE) ?? "{}");
    const serializationJSON = {
        workspace,
        state,
    };

    return JSON.stringify(serializationJSON, null, 4);
};

export const Serialize = (workspace: Blockly.WorkspaceSvg, scope: VispiScopeManager) => {
    const blocks = Blockly.serialization.workspaces.save(workspace);
    const serializationJSON = {
        workspace: blocks,
        state: scope.GetLastScope(),
    };

    return JSON.stringify(serializationJSON, null, 4);
};

export const Deserialize = (json: string) => {
    const serializationJSON = JSON.parse(json);
    localStorage.setItem(VISPI_WORKSPACE, JSON.stringify(serializationJSON.workspace));
    localStorage.setItem(VISPI_STATE, JSON.stringify(serializationJSON.state));
    window.location.reload();
};

export const Purge = () => {
    localStorage.removeItem(VISPI_WORKSPACE);
    localStorage.removeItem(VISPI_STATE);
    window.location.reload();
};
