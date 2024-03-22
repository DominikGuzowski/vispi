import { sha256 } from "js-sha256";

const HashId = (id: string) => sha256(id);

type ProcessManager = {
    [name: string]: {
        id: string;
        params: string[];
        rawId: string;
    };
};

export const VISPI_INVALID_NAME = "__VISPI_INVALID_NAME__";

// TODO: Add error propagation through scope, retrieved on PopScope.
export class VispiScopeManager {
    private scopeTree: any = { global: { names: [], type: "global" } };
    private processes: ProcessManager = {};
    private scopeStack: string[] = ["global"];
    private lastScope: VispiScopeManager | null = null;
    private canGenerate: boolean = false;
    private declaredMain: boolean = false;
    /**
     * Pushes a new scope to the stack and creates a new scope in the tree.
     * All subsequent names will be added to this scope unless popped or a new scope is created.
     * @param {String} id
     */
    RegisterScope(id: string, blocktype: string) {
        let tree = this.scopeTree;
        if (blocktype === "MainBlock") {
            // Get full path to here
            this.declaredMain = true;
        }
        id = HashId(id);
        // Traverse existing scopes
        for (const scope of this.scopeStack) {
            tree = tree[scope];
        }

        if (!tree[id]) tree[id] = { names: [] };
        tree[id].type = blocktype;

        this.scopeStack.push(id);
    }

    /**
     * Returns the current scope path as a string separated by backslashes.
     * @returns {String} The current scope path as a string.
     */
    CurrentScope(): string {
        return this.scopeStack.join("\\");
    }

    /**
     * Pops the current scope from the stack unless only 'global' scope remains.
     * @returns {String} The last scope path as a string.
     */
    PopScope(): string {
        if (this.scopeStack.length === 1) return "global";
        return this.scopeStack.pop()!;
    }

    SetGeneration(b: boolean) {
        this.canGenerate = b;
    }

    Load(json: VispiScopeManager) {
        this.lastScope = new VispiScopeManager();
        this.lastScope.scopeTree = { ...json.scopeTree };
        this.lastScope.scopeStack = [...json.scopeStack];
        this.lastScope.processes = { ...json.processes };
        this.lastScope.declaredMain = false;
    }

    CanGenerate() {
        return this.canGenerate;
    }
    /**
     * Adds a name to the current scope. If no scope is active, the name is added to the global scope.
     * @param {String} name
     */
    InsertName(name: string) {
        if (name === VISPI_INVALID_NAME) return;

        let tree = this.scopeTree;

        // Traverse existing scopes
        for (const scope of this.scopeStack) {
            tree = tree[scope];
        }

        tree.names.push(name);
    }

    /**
     * Returns the current scope path as an array of strings. eg. [global, scope1, scope2, ...]
     * @returns {string[]} The current scope path as an array of strings.
     */
    ScopePath(): string[] {
        return this.scopeStack.slice();
    }

    /**
     * Returns the last scope state saved (using the Clear() method).
     * @returns {VispiScopeManager} The last scope state.
     */
    GetLastScope(): VispiScopeManager | null {
        return this.lastScope;
    }

    private CopyState(): VispiScopeManager {
        const state = new VispiScopeManager();
        state.scopeTree = { ...this.scopeTree };
        state.scopeStack = [...this.scopeStack];
        state.processes = { ...this.processes };
        state.declaredMain = this.declaredMain;
        return state;
    }

    private ResetState(): void {
        this.scopeTree = { global: { names: [], type: "global" } };
        this.scopeStack = ["global"];
        this.processes = {};
        this.declaredMain = false;
    }

    /**
     * Clears current scope state and stores it in the last scope.
     * Should be used after the state of the code in the workspace is changed.
     */
    Clear() {
        this.lastScope = this.CopyState();
        this.ResetState();
    }

    /**
     * Returns a list of all variables in scope at the current position in the code as described by the scope path.
     * @param {string[]} scopepath
     * @param {boolean} requireHash
     * @returns {string[]} List of all names in scope.
     */
    GetNames(scopepath: string[], requireHash: boolean = true): string[] {
        const names = [];
        let tree = this.scopeTree;

        if (requireHash) {
            scopepath = scopepath.map((id) => HashId(id));
        }

        scopepath = ["global", ...scopepath];

        for (const path of scopepath) {
            tree = tree[path];

            if (!tree) break;

            for (const name of tree.names) {
                const index: number = names.indexOf(name);
                if (index !== -1) {
                    names[index] = VISPI_INVALID_NAME;
                }

                names.push(name);
            }
        }
        return names.filter((n) => n !== VISPI_INVALID_NAME);
    }

    GetTreeString() {
        return JSON.stringify(this.scopeTree, null, 2);
    }

    RegisterProcess(id: string, name: string, params: string[]) {
        this.processes[name] = {
            id: HashId(id),
            rawId: id,
            params,
        };
        this.RegisterScope(id, "ProcessBlock");
        params.forEach((p) => this.InsertName(p));
    }

    GetParams(name: string) {
        return this.processes[name]?.params ?? [];
    }

    GetParamsById(id: string, requireHash: boolean = true) {
        if (requireHash) id = HashId(id);
        for (const key in Object.keys(this.processes)) {
            if (this.processes[key].id === id) {
                return this.processes[key].params;
            }
        }
        return [];
    }

    GetProcessId(name: string) {
        return this.processes[name]?.id;
    }

    MatchesExistingProcessId(name: string, id: string, requireHash: boolean = true) {
        if (requireHash) id = HashId(id);
        const process = this.processes[name]?.id;
        return process === id;
    }

    GetRawProcessId(name: string) {
        return this.processes[name]?.rawId;
    }

    GetProcessNames() {
        return Object.keys(this.processes);
    }

    HasProcessByName(name: string) {
        return this.processes[name] !== undefined;
    }

    HasProcessById(id: string, requireHash: boolean = true) {
        if (requireHash) id = HashId(id);
        return Object.keys(this.processes).some((key) => this.processes[key].id === id);
    }

    HasAlreadyDeclaredMain() {
        return this.declaredMain;
    }

    GetCurrentScopeType() {
        let tree = this.scopeTree;
        for (const scope of this.scopeStack) {
            tree = tree[scope];
        }
        return tree.type;
    }
}

export const ScopeManager = new VispiScopeManager();
