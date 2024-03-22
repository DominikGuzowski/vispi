import React, { useEffect } from "react";
// import {
//     FaCaretDown as Down,
//     FaCaretUp as Up,
//     FaCaretLeft as Left,
//     FaCaretRight as Right,
//     FaCaretDown,
//     FaCaretLeft,
//     FaCaretRight,
//     FaCaretUp,
// } from "react-icons/fa";
import {
    PiCaretDoubleDownBold as Down,
    PiCaretDoubleUpBold as Up,
    PiCaretDoubleLeftBold as Left,
    PiCaretDoubleRightBold as Right,
} from "react-icons/pi";
import "./Splitter.css";
interface ISplitterProps {
    splitterClassName?: string;
    children?: React.ReactNode | [React.ReactNode, React.ReactNode];
    onResize?: () => void;
    vertical?: boolean;
    collapseThreshold?: number | [number, number];
    collapseSize?: number;
    preventCollapse?: "first" | "second" | "both";
    collapseCaretClassName?: string;
}

interface ICollapseCaretProps {
    direction: "up" | "down" | "left" | "right";
    onClick?: () => void;
    className?: string;
}

const CollapseCaret = ({ direction, onClick, className }: ICollapseCaretProps) => {
    return (
        <button className={`${className ? ` ${className}` : ""}`} onClick={onClick}>
            {direction === "up" && <Up />}
            {direction === "down" && <Down />}
            {direction === "left" && <Left />}
            {direction === "right" && <Right />}
        </button>
    );
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const Splitter: React.FC<ISplitterProps> = ({
    children,
    vertical,
    collapseThreshold = 100,
    collapseSize = 25,
    preventCollapse,
    onResize,
    collapseCaretClassName,
}: ISplitterProps): JSX.Element => {
    const [first, second] = React.Children.toArray(children);
    const splitterRef = React.useRef<HTMLDivElement>(null);
    const dividerRef = React.useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = React.useState(false);

    const [collapseLeft, setCollapseLeft] = React.useState(false);
    const [collapseRight, setCollapseRight] = React.useState(false);
    const [lastPosition, setLastPosition] = React.useState(0);

    const GetContainer = () => {
        if (splitterRef.current) {
            const containerRect = splitterRef.current.getBoundingClientRect();
            return {
                width: containerRect.width,
                height: containerRect.height,
                startX: containerRect.left,
                startY: containerRect.top,
            };
        }
        return { width: 0, height: 0, startX: 0, startY: 0 };
    };

    useEffect(() => {
        const containerDiv = splitterRef.current!;
        const container = GetContainer();
        const limit = vertical ? container.height : container.width;
        const containerStart = vertical ? container.startY : container.startX;
        const client = containerStart + (2 * limit) / 3;
        if (client === 0) return;
        if (client < containerStart || client > containerStart + limit) return;

        const offset = clamp(client - containerStart, 0, limit);

        const f = offset / limit;
        const s = 1 - f;

        containerDiv.style[vertical ? "gridTemplateRows" : "gridTemplateColumns"] = `${f}fr 2px ${s}fr`;
        containerDiv.style[!vertical ? "gridTemplateRows" : "gridTemplateColumns"] = `none`;
        setCollapseLeft(false);
        setCollapseRight(false);
    }, [vertical]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setLastPosition(vertical ? e.clientY : e.clientX);
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        setIsDragging(false);
        onResize?.();
    };

    const moveSplitter = (client: number) => {
        const containerDiv = splitterRef.current!;
        const container = GetContainer();
        const limit = vertical ? container.height : container.width;
        const containerStart = vertical ? container.startY : container.startX;
        if (client === 0) return;
        if (client < containerStart || client > containerStart + limit) return;

        const offset = clamp(client - containerStart, 0, limit);

        let firstThreshold = typeof collapseThreshold === "number" ? collapseThreshold : collapseThreshold[0];
        let secondThreshold = typeof collapseThreshold === "number" ? collapseThreshold : collapseThreshold[1];

        if (offset < firstThreshold) {
            const collapse = preventCollapse === "first" || preventCollapse === "both";
            const f = (collapse ? firstThreshold : collapseSize) / limit;
            const s = 1 - f;
            setCollapseLeft(!collapse);
            containerDiv.style[vertical ? "gridTemplateRows" : "gridTemplateColumns"] = `${f}fr 2px ${s}fr`;
            containerDiv.style[!vertical ? "gridTemplateRows" : "gridTemplateColumns"] = `none`;
            return;
        }

        if (limit - offset < secondThreshold) {
            const collapse = preventCollapse === "second" || preventCollapse === "both";
            const f = (collapse ? secondThreshold : collapseSize) / limit;
            const s = 1 - f;
            setCollapseRight(!collapse);
            containerDiv.style[vertical ? "gridTemplateRows" : "gridTemplateColumns"] = `${s}fr 2px ${f}fr`;
            containerDiv.style[!vertical ? "gridTemplateRows" : "gridTemplateColumns"] = `none`;
            return;
        }

        setCollapseLeft(false);
        setCollapseRight(false);
        containerDiv.style[vertical ? "gridTemplateRows" : "gridTemplateColumns"] = `${offset}px 2px 1fr`;
        containerDiv.style[!vertical ? "gridTemplateRows" : "gridTemplateColumns"] = `none`;
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        e.preventDefault();
        const buttonHeld = e.buttons === 1;
        if (isDragging && buttonHeld) {
            const { clientX, clientY } = e;
            moveSplitter(vertical ? clientY : clientX);
        }
    };

    const uncollapse = () => {
        moveSplitter(lastPosition);
        setCollapseLeft(false);
        setCollapseRight(false);
        onResize?.();
    };

    return (
        <div ref={splitterRef} className={`splitter__container${vertical ? " splitter__container--vertical" : ""}`}>
            <div className='splitter__panel first'>
                {!collapseLeft ? (
                    first
                ) : (
                    <CollapseCaret
                        direction={vertical ? "down" : "right"}
                        onClick={uncollapse}
                        className={collapseCaretClassName}
                    />
                )}
            </div>
            {/* {!!second && (
                <> */}
            {!(collapseLeft || collapseRight) || isDragging ? (
                <div
                    ref={dividerRef}
                    className='splitter__divider'
                    onMouseDown={handleMouseDown}
                    onDrag={handleMouseMove}
                    onDragEnd={handleMouseUp}
                    onDragStart={(e) => {
                        e.dataTransfer.dropEffect = "move";
                        const clone = document.createElement("div");
                        e.dataTransfer.setDragImage(clone, 0, 0);
                    }}
                    draggable
                />
            ) : (
                <div className='splitter__divider splitter__divider--non-draggable' />
            )}
            <div className='splitter__panel second'>
                {!collapseRight ? (
                    second
                ) : (
                    <CollapseCaret
                        direction={vertical ? "up" : "left"}
                        onClick={uncollapse}
                        className={collapseCaretClassName}
                    />
                )}
            </div>
            {/* </>
            )} */}
        </div>
    );
};
