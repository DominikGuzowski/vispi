import VispiLogo from "../assets/VispiLogo.svg";
import VispiIcon from "../assets/VispiIcon.svg";
import { FaCaretDown } from "react-icons/fa";
import { RiSplitCellsHorizontal, RiSplitCellsVertical } from "react-icons/ri";
import { Download } from "./DownloadButton";
import { Deserialize, Purge, SerializeFromCache } from "./Serialization";
import { FileInput } from "./LoadFile";
import { useEffect, useState } from "react";
import { Tooltip } from "./Tooltip";
import { FaArrowsRotate } from "react-icons/fa6";

const VISPI_PROGRAM_NAME = "vispi:program";

interface VispiNavProps {
    onNewFile?: () => void;
    onSave?: () => void;
    onOpen?: () => void;
    onExample?: () => void;
    onSavePifra?: () => string;
    onFilenameChange?: (filename: string) => void;
    onOrientationChange?: (orientation: "horizontal" | "vertical") => void;
}

const ExampleDropdownOption = ({
    name,
    url,
    onOpen,
}: {
    name: string;
    url: string;
    onOpen: (content: string) => void;
}) => {
    return (
        <button
            className='vispi-nav__item'
            style={{ marginRight: "auto" }}
            tabIndex={0}
            onClick={() => {
                fetch(url)
                    .then((response) => response.text())
                    .then(onOpen);
            }}>
            {name}
        </button>
    );
};

const BlurActive = () => (document.activeElement as HTMLElement | null)?.blur();
export const VispiNav = ({
    onNewFile,
    onSave,
    onOpen,
    onExample,
    onSavePifra,
    onFilenameChange,
    onOrientationChange,
}: VispiNavProps) => {
    const [programName, setProgramName] = useState(localStorage.getItem(VISPI_PROGRAM_NAME) || "");
    const [examples, setExamples] = useState<string[]>([]);
    const useVertical = localStorage.getItem("vispi:orientation") === "vertical";
    const ExampleURL = "examples/";

    const GetExamples = () => {
        fetch(`${ExampleURL}Examples.json`)
            .then((response) => response.json())
            .then(setExamples);
    };

    const CtrlS = (e: KeyboardEvent) => {
        if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            OnSave();
        }
    };

    const CtrlO = (e: KeyboardEvent) => {
        if (e.key === "o" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            const id = "vispi_file_loader";
            const input = document.getElementById(id) as HTMLInputElement;
            if (input) input.click();
        }
    };

    const CtrlShiftS = (e: KeyboardEvent) => {
        if (e.key === "S" && (e.ctrlKey || e.metaKey) && e.shiftKey) {
            e.preventDefault();
            OnSavePifra();
        }
    };

    const AltN = (e: KeyboardEvent) => {
        if (e.key === "n" && e.altKey) {
            e.preventDefault();
            OnNewFile();
        }
    };

    const Confirm = () => {
        return window.confirm("Are you sure you want to proceed? You will lose all unsaved changes.");
    };

    const OnNewFile = () => {
        if (Confirm()) {
            onNewFile?.();
            localStorage.removeItem(VISPI_PROGRAM_NAME);
            Purge();
        }
    };

    const OnSave = () => {
        onSave?.();
        Download(SerializeFromCache(), programName || "unnamed", "vispi");
    };

    const OnSavePifra = () => {
        if (onSavePifra) Download(onSavePifra(), programName || "unnamed", "pi");
    };

    const OnOpen = (str: string) => {
        onOpen?.();
        Deserialize(str);
    };

    useEffect(() => {
        if (examples.length === 0) GetExamples();
        document.addEventListener("keydown", CtrlS);
        document.addEventListener("keydown", CtrlO);
        document.addEventListener("keydown", AltN);
        document.addEventListener("keydown", CtrlShiftS);
        return () => {
            document.removeEventListener("keydown", CtrlS);
            document.removeEventListener("keydown", CtrlO);
            document.removeEventListener("keydown", AltN);
            document.removeEventListener("keydown", CtrlShiftS);
        };
    }, []);

    useEffect(() => {
        if (programName.length > 0) {
            document.title = programName + " - VisPi";
            onFilenameChange?.(programName);
        } else {
            document.title = "VisPi";
            onFilenameChange?.("");
        }
    }, [programName]);

    return (
        <div className='vispi-header'>
            <div className='vispi-nav--Logo'>
                <img src={VispiLogo} alt='Vispi Logo' className='vispi-nav__logo' />
                <img src={VispiIcon} alt='Vispi Logo' className='vispi-nav__icon' />
            </div>
            <div className='vispi-nav--ProgramName'>
                <input
                    type='text'
                    className='vispi-nav__item'
                    placeholder='Program Name'
                    value={programName}
                    onChange={(e) => {
                        setProgramName(e.target.value);
                        localStorage.setItem(VISPI_PROGRAM_NAME, e.target.value);
                    }}></input>
            </div>
            <div className='vispi-nav__separator vispi-nav--Separator' />
            <div className='vispi-nav--FileMenu'>
                <div className='vispi-nav__items'>
                    <button className='vispi-nav__items-title vispi-nav__item'>
                        File <FaCaretDown />
                    </button>
                    <div className='vispi-nav__items-container'>
                        <Tooltip position='bottom' content='Alt + N'>
                            <button className='vispi-nav__item' onClick={OnNewFile}>
                                New File
                            </button>
                        </Tooltip>
                        <Tooltip position='bottom' content='Ctrl + O'>
                            <FileInput
                                onLoad={OnOpen}
                                onSelect={(filename) => {
                                    localStorage.setItem(VISPI_PROGRAM_NAME, filename);
                                }}
                            />
                        </Tooltip>
                        <Tooltip position='bottom' content='Ctrl + S'>
                            <button className='vispi-nav__item' onClick={OnSave}>
                                Save File
                            </button>
                        </Tooltip>
                        <Tooltip position='bottom' content='Ctrl + Shift + S'>
                            <button className='vispi-nav__item' onClick={OnSavePifra}>
                                Export PiFra
                            </button>
                        </Tooltip>
                    </div>
                </div>
            </div>
            <div className='vispi-nav__separator vispi-nav--Separator' />
            <div className='vispi-nav--Help'>
                <div className='vispi-nav__items'>
                    <button className='vispi-nav__items-title vispi-nav__item'>
                        Help <FaCaretDown />
                    </button>
                    <div className='vispi-nav__items-container'>
                        <div className='vispi-nav__item vispi-nav__dropdown' onClick={onExample} tabIndex={0}>
                            <div className='vispi-nav__dropdown-name'>
                                Examples <FaCaretDown />
                            </div>
                            <div className='vispi-nav__dropdown-container'>
                                {examples.map((name, index) => (
                                    <ExampleDropdownOption
                                        key={index}
                                        name={name.replace(".vispi", "")}
                                        url={ExampleURL + name}
                                        onOpen={(content) => {
                                            if (Confirm()) {
                                                onExample?.();
                                                localStorage.setItem(VISPI_PROGRAM_NAME, name.replace(".vispi", ""));
                                                Deserialize(content);
                                            }
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                        <a className='vispi-nav__item' href='https://github.com/DominikGuzowski/vispi' target='_blank'>
                            How-to Guide
                        </a>
                        <a className='vispi-nav__item' href='https://github.com/DominikGuzowski/vispi' target='_blank'>
                            About
                        </a>
                        <a className='vispi-nav__item' href='https://github.com/sengleung/pifra' target='_blank'>
                            PiFra GitHub
                        </a>
                    </div>
                </div>
            </div>
            <div className='vispi-nav__separator vispi-nav--Separator' />
            <div className='vispi-nav--Other'>
                <Tooltip position='bottom' content={useVertical ? "Horizontal" : "Vertical"}>
                    <button
                        className='vispi-nav__item'
                        onClick={(e) => {
                            localStorage.setItem("vispi:orientation", useVertical ? "horizontal" : "vertical");
                            onOrientationChange?.(useVertical ? "horizontal" : "vertical");
                            BlurActive();
                        }}>
                        <FaArrowsRotate />
                    </button>
                </Tooltip>
            </div>
        </div>
    );
};
