import { useBlocklyWorkspace } from "react-blockly";
import * as Blockly from "blockly/core";
import { Load, Save, Serialize } from "./Serialization";
import { ScopeManager, VispiScopeManager } from "./ScopeManager";
import { VispiToolbox } from "./Toolbox";
import { useEffect, useRef } from "react";
import { VispiGenerator } from "./Generator";
import { VispiTheme } from "./VispiTheme";
import "./VispiEditor.css";

interface VispiState {
    code: string;
    scope: VispiScopeManager;
    workspace: Blockly.WorkspaceSvg;
}

interface VispiWorkspaceProps {
    storageKey: string;
    onChange?: (state: VispiState) => void;
    scopeRef?: React.MutableRefObject<VispiScopeManager>;
    workspaceRef?: React.MutableRefObject<Blockly.WorkspaceSvg>;
    onSerialize?: React.MutableRefObject<() => string>;
}

const ReorganiseCode = (code: string) => {
    const all = code.split("\n").filter((line) => line.length > 0);
    const processes = all.filter((line) => line.includes(" =")).flatMap((line) => [line, ""]);
    const main = all.filter((line) => !line.includes(" ="));
    return [...processes, ...main].join("\n");
};

export const VispiWorkspace = ({ storageKey, onChange, scopeRef, workspaceRef, onSerialize }: VispiWorkspaceProps) => {
    const ref = useRef(null);

    const zoomOptions = {
        controls: true,
        wheel: true,
        startScale: 0.8,
        maxScale: 5,
        minScale: 0.1,
        scaleSpeed: 1.2,
    };

    const workspaceConfiguration = {
        grid: {
            spacing: 20,
            length: 5,
            colour: "#ccc",
            snap: true,
        },
        zoom: zoomOptions,
        theme: VispiTheme,
    };
    const timeoutRef = useRef<number | undefined>(undefined);
    const saveTimeout = useRef<number | undefined>(undefined);
    const { workspace } = useBlocklyWorkspace({
        ref,
        toolboxConfiguration: VispiToolbox,
        workspaceConfiguration,
        initialJson: Load(storageKey, ScopeManager),
        onWorkspaceChange: (workspace) => {
            console.log("CHANGING");
            clearTimeout(timeoutRef.current);
            clearTimeout(saveTimeout.current);

            if (onChange && workspace) {
                timeoutRef.current = setTimeout(() => {
                    const state: VispiState = {
                        code: ReorganiseCode(VispiGenerator.workspaceToCode(workspace)),
                        scope: { ...ScopeManager } as VispiScopeManager,
                        workspace,
                    };
                    onChange(state);
                    ScopeManager.Clear();
                }, 250);
            }

            saveTimeout.current = setTimeout(() => {
                console.log("SAVED");
                Save(workspace, storageKey, ScopeManager);
            }, 500);
        },
    });

    useEffect(() => {
        if (scopeRef) {
            scopeRef.current = ScopeManager;
        }
        if (workspaceRef && workspace) {
            workspaceRef.current = workspace;
        }
        if (onSerialize && workspace) {
            onSerialize.current = () => Serialize(workspace, ScopeManager);
        }
    }, [scopeRef, workspaceRef, workspace, ScopeManager]);

    return <div className='editor-blocks' ref={ref} />;
};
