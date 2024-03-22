import { useEffect, useState } from "react";
import { BsConeStriped } from "react-icons/bs";
const assignColor = (type: string) => {
    switch (type) {
        case "Process":
            return "#cc88FF";
        case "Name":
            return "#fff5a9";
        case "Send":
            return "#33bbff";
        case "Receive":
            return "#33cc66";
        case "Restrict":
            return "#ff9512";
        case "Terminate":
            return "#ff7777";
        default:
            return "#ffffff";
    }
};

const CompileTokenRegex = () => {
    const RestrictError = /\$[a-z][a-zA-Z0-9_]*(?!\.)/;
    const SendError = /[a-z_][a-zA-Z0-9_]*'\<[a-z_][a-zA-Z0-9_]*\>/;
    const ReceiveError = /[a-z_][a-zA-Z0-9_]*\([a-z_][a-zA-Z0-9_]*\)/;
    const GuardError = /\[[^\]]*\](?!\s[a-zA-Z_0-9(])/;
    const NextNegLookahead = /(?!\.)/;
    const CombinedError = `(?<Error>((${SendError.source}|${ReceiveError.source})${NextNegLookahead.source}|${RestrictError.source}|${GuardError.source}))`;

    const Symbols = /(?<Symbols>[(),|.+[\]=!'<>])/;
    const Space = /(?<Space>\s+)/;
    const Name = /(?<Name>(?<!\$)[a-z_][a-zA-Z0-9_]*(?!['(]))/;
    const Process = /(?<Process>[A-Z][a-zA-Z_0-9]*)/;
    const Terminate = /(?<Terminate>\b0)/;
    const Restrict = /(?<Restrict>\$[a-z_][a-zA-Z0-9_]*(?=\.))/;
    const Send = /(?<Send>[a-z_][a-zA-Z0-9_]*(?='))/;
    const Receive = /(?<Receive>[a-z_][a-zA-Z0-9_]*(?=\())/;
    const regex = new RegExp(
        `${Restrict.source}|${CombinedError}|${Symbols.source}|${Space.source}|${Terminate.source}|${Send.source}|${Receive.source}|${Name.source}|${Process.source}`,
        "g"
    );
    return regex;
};

const regex = CompileTokenRegex();

const tokenize = (codeLine: string) => {
    // const regex =
    //     /((?<Error>((\$[a-z_][a-zA-Z0-9_]*|[a-z_][a-zA-Z0-9_]*'\<[a-z_][a-zA-Z0-9_]*\>|[a-z_][a-zA-Z0-9_]*\([a-z_][a-zA-Z0-9_]*\))(?!\.))|\[[^\]]*\](?!\s[a-zA-Z_0-9]))|(?<Send>[a-z_][a-zA-Z0-9_]*(?='))|(?<Receive>[a-z_][a-zA-Z0-9_]*(?=\())|(?<Restrict>\$[a-z_][a-zA-Z0-9_]*)|(?<Terminate>\b0)|(?<Process>[A-Z][a-zA-Z_0-9]*)|(?<Symbols>[(),|.+[\]=!'<>])|(?<Space>\s+)|(?<Name>(?<!\$)[a-z_][a-zA-Z0-9_]*(?!['(])))/g;

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
        RemoveErrorTooltipOnHoverEnd();
        setTokens(tokenize(code));
    }, [code]);

    const RemoveErrorTooltipOnHoverEnd = () => {
        document.querySelectorAll(".error-tooltip").forEach((element) => {
            element.remove();
        });
    };

    const ErrorMessageFromTokenValue = (token: string) => {
        if (token.match(/\$[a-z_][a-zA-Z0-9_]*/)) return "Cannot end on a 'restrict' statement.";
        if (token.match(/[a-z_][a-zA-Z0-9_]*'\<[a-z_][a-zA-Z0-9_]*\>/)) return "Cannot end on a 'send' statement.";
        if (token.match(/[a-z_][a-zA-Z0-9_]*\([a-z_][a-zA-Z0-9_]*\)/)) return "Cannot end on a 'receive' statement.";
        if (token.match(/\[.*!.*\]/)) return "Inequality statement missing a body.";
        if (token.match(/\[.*\]/)) return "Equality statement missing a body.";
        return "Unknown error.";
    };

    const CreateErrorTooltipOnHover = (span: HTMLSpanElement, token: string) => {
        const element = document.createElement("div");
        element.classList.add("error-tooltip");
        const spanRect = span.getBoundingClientRect();
        let x = spanRect.x + spanRect.width / 2;
        const y = spanRect.y - 10;
        const parentRect = document.querySelector(".editor-code")?.getBoundingClientRect();
        if (parentRect) {
            if (x > parentRect.x + parentRect.width - 100) {
                element.style.left = `calc(100vw - 6rem)`;
            } else element.style.left = `${x}px`;
        } else element.style.left = `${x}px`;
        element.style.bottom = `calc(100% - ${y}px)`;
        element.style.position = "fixed";
        element.setAttribute("data-error", ErrorMessageFromTokenValue(token));
        document.body.appendChild(element);
    };

    return (
        <span style={{ whiteSpace: "wrap" }}>
            {tokens.map((token, index) => (
                <span
                    key={index}
                    style={{ color: assignColor(token.type) }}
                    onMouseEnter={(e) => {
                        if (token.type === "Error") {
                            CreateErrorTooltipOnHover(e.target as HTMLSpanElement, token.value);
                        }
                    }}
                    onMouseLeave={RemoveErrorTooltipOnHoverEnd}
                    onMouseOut={RemoveErrorTooltipOnHoverEnd}
                    className={token.type === "Error" ? "error-squiggle" : ""}>
                    {token.value}
                </span>
            ))}
        </span>
    );
};

interface SyntaxHighlighterProps {
    code: string;
    filename?: string;
}

export const SyntaxHighlighter = ({ code, filename }: SyntaxHighlighterProps) => {
    const lines = code.split("\n");
    return (
        <div className='editor-output'>
            <h2 className='editor-header'>
                PiFra Output Preview{filename ? ` - ${filename}.pi` : ""}
                <button
                    className='vispi-nav__item'
                    onClick={() => {
                        navigator.clipboard.writeText(code);
                    }}>
                    Copy
                </button>
            </h2>
            <div className='editor-code'>
                <pre id='code'>
                    {lines.map((line, index) => (
                        <div key={index} className='code-line'>
                            <span style={{ color: "#bbddFF", userSelect: "none" }}>{index + 1}</span>
                            <CodeColorizer code={line} />
                        </div>
                    ))}
                    <div className='code-line' style={{ color: "#bbddFF", userSelect: "none" }}>
                        <span style={{ color: "#bbddFF", userSelect: "none" }}></span>
                    </div>
                    <div className='code-line' style={{ color: "#bbddFF", userSelect: "none" }}>
                        <span style={{ color: "#bbddFF", userSelect: "none" }}></span>
                    </div>
                </pre>
            </div>
        </div>
    );
};
