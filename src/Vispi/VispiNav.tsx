import VispiLogo from "../assets/VispiLogo.svg";
import { FaCaretDown } from "react-icons/fa";
import { Download } from "./DownloadButton";
import { Deserialize, Purge, SerializeFromCache } from "./Serialization";
import { FileInput } from "./LoadFile";
import { useEffect, useState } from "react";

const VISPI_PROGRAM_NAME = "vispi:program";

interface VispiNavProps {
    onNewFile?: () => void;
    onSave?: () => void;
    onOpen?: () => void;
    onExample?: () => void;
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
            className='vispi-nav__item vispi-nav__dropdown-content'
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
export const VispiNav = ({ onNewFile, onSave, onOpen, onExample }: VispiNavProps) => {
    const [programName, setProgramName] = useState(localStorage.getItem(VISPI_PROGRAM_NAME) || "");
    const [examples, setExamples] = useState<[string, string][]>([]);

    const SetExamples = (data: object[]) => {
        const files = data.filter((file: any) => file.type === "file" && file.name.endsWith(".vispi"));
        const examples: [string, string][] = files.map((file: any) => [file.name, file.download_url]);
        setExamples(examples);
    };

    const GetExamples = () => {
        const url = "https://api.github.com/repos/DominikGuzowski/vispi/contents/examples?ref=";
        fetch(url + "main")
            .then((response) => response.json())
            .then((data) => {
                if (data?.length === 0) {
                    fetch(url + "dev")
                        .then((response) => response.json())
                        .then(SetExamples);
                } else SetExamples(data);
            })
            .catch((err) => {
                fetch(url + "dev")
                    .then((response) => response.json())
                    .then(SetExamples);
            });
    };

    useEffect(() => {
        GetExamples();
    }, []);

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
                    {examples.map(([name, url], index) => (
                        <ExampleDropdownOption
                            key={index}
                            name={name}
                            url={url}
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
