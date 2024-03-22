interface TooltipProps {
    content: string;
    position: "top" | "bottom" | "left" | "right";
    children: React.ReactNode;
}

export const Tooltip = ({ content, position, children }: TooltipProps) => {
    return (
        <div className={`vispi-tooltip vispi-tooltip__position--${position}`} data-tooltip={content}>
            {children}
        </div>
    );
};
