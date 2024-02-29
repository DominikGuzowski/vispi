import { Theme, Themes } from "blockly";

const fontStyle = {
    family: "Fira Code, monospace",
    size: 12,
};

const componentStyles = {
    workspaceBackgroundColour: "#222",
    toolboxBackgroundColour: "#333",
    toolboxForegroundColour: "#e0e0e0",
    flyoutBackgroundColour: "#444",
    flyoutForegroundColour: "#fff",
    flyoutOpacity: 0.75,
};

export const VispiTheme = Theme.defineTheme("vispi", {
    base: Themes.Classic,
    componentStyles,
    fontStyle,
    startHats: true,
    name: "VisPi",
});
