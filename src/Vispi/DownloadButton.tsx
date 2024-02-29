export const Download = (content: string, filename?: string) => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${filename || "program"}.vispi`;
    document.body.appendChild(element);
    element.click();
};

export const LoadFromFile = (filename: string, onLoad: (contents: string) => void) => {
    const file = new Blob([filename], { type: "text/plain" });
    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result;
        onLoad(text as string);
    };
    reader.readAsText(file);
};
