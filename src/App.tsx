import { useRef, useState } from "react";
import * as Blockly from "blockly";
import { VispiBlocks } from "./Vispi/Blocks";
import { VispiWorkspace } from "./Vispi/Workspace";
import { SyntaxHighlighter } from "./Vispi/SyntaxHighlighter";
import { CopyButton } from "./Vispi/CopyButton";
import VispiLogo from "./assets/VispiLogo.svg";
import { Download } from "./Vispi/DownloadButton";
import { FileInput } from "./Vispi/LoadFile";
import { Deserialize, Purge } from "./Vispi/Serialization";
import { Link } from "react-router-dom";
import { VispiNav } from "./Vispi/VispiNav";

Blockly.common.defineBlocks(VispiBlocks);

function App() {
    const [code, setCode] = useState("");
    const serializeFn = useRef(() => "");

    return (
        <div className='vispi-container'>
            {/* <div className='vispi-header'> */}
            {/* <img src={VispiLogo} alt='Vispi Logo' width='150em' /> */}
            {/* <div className='vispi-nav'>
                    <div className='vispi-nav__item' onClick={Purge}>
                        New File
                    </div>
                    <FileInput onLoad={Deserialize} />
                    <label htmlFor='vispi_download_button' className='vispi-nav__item'>
                        Save File
                        <button
                            className='invisible'
                            id='vispi_download_button'
                            onClick={() => {
                                Download(serializeFn.current());
                            }}>
                            Download
                        </button>
                    </label>
                    <CopyButton codeToCopy={code} />
                    <a
                        href='https://github.com'
                        target='_blank'
                        id='vispi_about'
                        className='reset-default vispi-nav__item'>
                        About
                    </a>
                </div> */}
            <VispiNav />
            {/* </div> */}
            <div className='editor-container'>
                <VispiWorkspace
                    storageKey='vispi'
                    onChange={(state) => {
                        setCode(state.code);
                    }}
                    onSerialize={serializeFn}
                />
                <SyntaxHighlighter code={code} />
            </div>
        </div>
    );
}

export default App;
