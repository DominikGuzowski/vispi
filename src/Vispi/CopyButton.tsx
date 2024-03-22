import React, { useState } from "react";

interface CopyButtonProps {
    codeToCopy: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({ codeToCopy }) => {
    const [color, setColor] = useState<string>("text-default");
    const copyCodeToClipboard = () => {
        navigator.clipboard
            .writeText(codeToCopy)
            .then(() => {
                setColor("text-green");
                setTimeout(() => {
                    setColor("text-default");
                }, 500); // Reset success message after 1.5 seconds
            })
            .catch((err) => {
                setColor("text-red");
                setTimeout(() => {
                    setColor("text-default");
                }, 500); // Reset success message after 1.5 seconds
            });
    };

    return (
        <label className={`vispi-nav__item ${color}`} htmlFor='vispi_copy_button'>
            Copy Code
            <button className='invisible' id='vispi_copy_button' onClick={copyCodeToClipboard} />
        </label>
    );
};
