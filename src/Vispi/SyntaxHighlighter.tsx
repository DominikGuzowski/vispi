import { useEffect, useState } from "react";
const assignColor = (type: string) => {
    switch (type) {
        case "Process":
            return "#cc88FF";
        case "Name":
            return "#ffee88";
        case "Send":
            return "#33bbff";
        case "Receive":
            return "#33cc66";
        case "Restrict":
            return "#ff9922";
        case "Terminate":
            return "#ff7777";
        default:
            return "#ffffff";
    }
};

const tokenize = (codeLine: string) => {
    const regex =
        /((?<Process>[A-Z][a-zA-Z_0-9]*)|(?<Symbols>[(),|.+[\]=!'<>])|(?<Space>\s+)|(?<Send>[a-z_][a-zA-Z0-9_]*(?='))|(?<Receive>[a-z_][a-zA-Z0-9_]*(?=\())|(?<Restrict>\$[a-z_][a-zA-Z0-9_]*)|(?<Terminate>\b0)|(?<Name>(?<!\$)[a-z_][a-zA-Z0-9_]*(?!['(])))/g;
    const matches = codeLine.matchAll(regex);
    const tokens = [];
    for (const match of matches) {
        const groups = match.groups;
        if (groups) {
            for (const [key, value] of Object.entries(groups)) {
                if (value) {
                    // const color = key === "Process" ? "#ffcc00" : key === "Name" ? "#bbddFF" : "#ffffff";
                    tokens.push({ type: key, value });
                }
            }
        }
    }

    return tokens;
};

const CodeColorizer = ({ code }: { code: string }) => {
    const [tokens, setTokens] = useState(tokenize(code));

    useEffect(() => {
        setTokens(tokenize(code));
    }, [code]);

    return (
        <span style={{ whiteSpace: "wrap" }}>
            {tokens.map((token, index) => (
                <span key={index} style={{ color: assignColor(token.type) }}>
                    {token.value}
                </span>
            ))}
        </span>
    );
};

export const SyntaxHighlighter = ({ code }: { code: string }) => {
    const lines = code.split("\n");
    return (
        <div className='editor-output'>
            <h2 className='editor-header'>
                PiFra Output Preview
                <button
                    className='vispi-nav__item'
                    onClick={() => {
                        navigator.clipboard.writeText(code);
                    }}>
                    Copy
                </button>
            </h2>
            <pre id='code'>
                {lines.map((line, index) => (
                    <div key={index} className='code-line'>
                        <span style={{ color: "#bbddFF", userSelect: "none" }}>{index + 1}</span>
                        <CodeColorizer code={line} />
                    </div>
                ))}
            </pre>
        </div>
    );
};
