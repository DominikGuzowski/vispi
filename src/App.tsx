import { useEffect, useRef, useState } from "react";
import * as Blockly from "blockly";
import { VispiBlocks } from "./Vispi/Blocks";
import { VispiWorkspace } from "./Vispi/Workspace";
import { SyntaxHighlighter } from "./Vispi/SyntaxHighlighter";
import { VispiNav } from "./Vispi/VispiNav";
import { Splitter } from "./Splitter";

Blockly.common.defineBlocks(VispiBlocks);

function App() {
    const [code, setCode] = useState("");
    const [filename, setFilename] = useState("");
    const serializeFn = useRef(() => "");
    const [key, setKey] = useState(0);
    const [isVertical, setVertical] = useState(localStorage.getItem("vispi:orientation") === "vertical");
    const [collapseThreshold, setCollabsibleThreshold] = useState(isVertical ? 200 : 300);
    const incrementState = () => setKey((k) => k + 1);

    useEffect(() => {
        setCollabsibleThreshold(isVertical ? 200 : 300);
    }, [isVertical]);

    return (
        <div className='vispi-container'>
            <VispiNav
                onSavePifra={() => code}
                onFilenameChange={setFilename}
                onOrientationChange={(o) => setVertical(o === "vertical")}
            />
            <div className='editor-container'>
                <Splitter
                    vertical={isVertical}
                    onResize={incrementState}
                    collapseSize={30}
                    collapseCaretClassName='vispi-collapse-caret'
                    collapseThreshold={collapseThreshold}>
                    <VispiWorkspace
                        key={key}
                        storageKey='vispi'
                        onChange={(state) => {
                            if (state.code.length > 0 && state.code !== code) setCode(state.code);
                        }}
                        onSerialize={serializeFn}
                    />
                    <SyntaxHighlighter filename={filename} code={code} />
                </Splitter>
            </div>
        </div>
    );
}

export default App;
