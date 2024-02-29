import VispiLogo from "../assets/VispiLogo.svg";
import { FaCaretDown } from "react-icons/fa";
import { Download } from "./DownloadButton";
import { Deserialize, Purge, SerializeFromCache } from "./Serialization";
import { FileInput } from "./LoadFile";
import { useState } from "react";

const VISPI_PROGRAM_NAME = "vispi:program";

interface VispiNavProps {
    onNewFile?: () => void;
    onSave?: () => void;
    onOpen?: () => void;
    onExample?: () => void;
}

export const VispiNav = ({ onNewFile, onSave, onOpen, onExample }: VispiNavProps) => {
    const [programName, setProgramName] = useState(localStorage.getItem(VISPI_PROGRAM_NAME) || "");
    const OnNewFile = () => {
        const confirm = window.confirm("Are you sure you want to start a new file? You will lose all unsaved changes.");
        if (confirm) {
            onNewFile?.();
            Purge();
        }
    };

    const OnSave = () => {
        onSave?.();
        Download(SerializeFromCache(), programName);
    };

    const OnOpen = (str: string) => {
        onOpen?.();
        Deserialize(str);
    };

    return (
        <div className='vispi-header'>
            <img src={VispiLogo} alt='Vispi Logo' width='100%' />
            <input
                type='text'
                className='vispi-nav__item'
                placeholder='Program Name'
                value={programName}
                onChange={(e) => {
                    setProgramName(e.target.value);
                    localStorage.setItem(VISPI_PROGRAM_NAME, e.target.value);
                }}></input>
            <button className='vispi-nav__item' onClick={OnNewFile}>
                New File
            </button>
            <FileInput
                onLoad={OnOpen}
                onSelect={(filename) => {
                    localStorage.setItem(VISPI_PROGRAM_NAME, filename);
                }}
            />
            <button className='vispi-nav__item' onClick={OnSave}>
                Save File
            </button>
            <div className='vispi-nav__separator'></div>
            <div className='vispi-nav__item vispi-nav__dropdown' onClick={onExample} tabIndex={0}>
                Examples <FaCaretDown />
                <div className='vispi-nav__dropdown-container'>
                    <button className='vispi-nav__item vispi-nav__dropdown-content' tabIndex={0}>
                        Hello 1 Longer Name
                    </button>
                    <button className='vispi-nav__item vispi-nav__dropdown-content' tabIndex={0}>
                        Hello 2
                    </button>
                    <button className='vispi-nav__item vispi-nav__dropdown-content' tabIndex={0}>
                        Hello 3
                    </button>
                    <button className='vispi-nav__item vispi-nav__dropdown-content' tabIndex={0}>
                        Hello 4
                    </button>
                </div>
            </div>
            <a className='vispi-nav__item' href='https://github.com/DominikGuzowski/vispi' target='_blank'>
                How to Guide
            </a>
            <a className='vispi-nav__item' href='https://github.com/DominikGuzowski/vispi' target='_blank'>
                About
            </a>
            <a className='vispi-nav__item' href='https://github.com/sengleung/pifra' target='_blank'>
                PiFra GitHub
            </a>
        </div>
    );
};
