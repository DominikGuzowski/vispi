import React, { ChangeEvent } from "react";

interface FileInputProps {
    onLoad: (content: string) => void;
    onSelect?: (filename: string) => void;
}

export const FileInput: React.FC<FileInputProps> = ({ onLoad, onSelect }) => {
    const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files && event.target.files[0];

        if (file) {
            readFileContents(file, onLoad);
        }
    };

    const readFileContents = (file: File, callback: (content: string) => void) => {
        const reader = new FileReader();

        onSelect?.(file.name.replace(".vispi", ""));

        reader.onload = (event) => {
            if (event.target?.result) {
                const content = event.target.result.toString();
                callback(content);
            }
        };

        reader.readAsText(file);
    };

    return (
        <label
            htmlFor='vispi_file_loader'
            className='vispi-nav__item'
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                    (document.getElementById("vispi_file_loader") as HTMLInputElement).click();
                }
            }}>
            Open File
            <input
                id='vispi_file_loader'
                className='invisible'
                type='file'
                accept='.vispi'
                onChange={handleFileInputChange}
            />
        </label>
    );
};
