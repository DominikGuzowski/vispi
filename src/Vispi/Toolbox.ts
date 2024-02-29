export const VispiToolbox = {
    kind: "categoryToolbox",
    contents: [
        {
            kind: "category",
            name: "Scopes",
            contents: [
                {
                    kind: "block",
                    type: "MainBlock",
                },
                {
                    kind: "block",
                    type: "RestrictScopeBlock",
                },
                {
                    kind: "block",
                    type: "ReceiveScopeBlock",
                    inputs: {
                        ON: {
                            block: {
                                type: "NameAccessBlock",
                                fields: {
                                    NAME: "?",
                                },
                            },
                        },
                    },
                },
                {
                    kind: "block",
                    type: "GuardScopeBlock",
                    inputs: {
                        FIRST: {
                            block: {
                                type: "NameAccessBlock",
                                fields: {
                                    NAME: "?",
                                },
                            },
                        },
                        SECOND: {
                            block: {
                                type: "NameAccessBlock",
                                fields: {
                                    NAME: "?",
                                },
                            },
                        },
                    },
                },
                {
                    kind: "block",
                    type: "ParallelParentBlock",
                    inputs: {
                        PARALLEL: {
                            block: {
                                type: "ParallelScopeBlock",
                            },
                        },
                    },
                },
                {
                    kind: "block",
                    type: "ParallelScopeBlock",
                },
                {
                    kind: "block",
                    type: "ChoiceParentBlock",
                    inputs: {
                        CHOICE: {
                            block: {
                                type: "ChoiceScopeBlock",
                            },
                        },
                    },
                },
                {
                    kind: "block",
                    type: "ChoiceScopeBlock",
                },
            ],
        },
        {
            kind: "category",
            name: "Processes",
            contents: [
                {
                    kind: "block",
                    type: "ProcessBlock",
                },
                {
                    kind: "block",
                    type: "ProcessCallBlock",
                },
                {
                    kind: "block",
                    type: "ProcessParamBlock",
                },
                {
                    kind: "block",
                    type: "ProcessArgBlock",
                    inputs: {
                        ARG: {
                            block: {
                                type: "NameAccessBlock",
                                fields: {
                                    NAME: "?",
                                },
                            },
                        },
                    },
                },
            ],
        },
        {
            kind: "category",
            name: "Other",
            contents: [
                {
                    kind: "block",
                    type: "SendBlock",
                    inputs: {
                        ON: {
                            block: {
                                type: "NameAccessBlock",
                                fields: {
                                    NAME: "?",
                                },
                            },
                        },
                        MESSAGE: {
                            block: {
                                type: "NameAccessBlock",
                                fields: {
                                    NAME: "?",
                                },
                            },
                        },
                    },
                },
                {
                    kind: "block",
                    type: "GlobalNameBlock",
                },
                {
                    kind: "block",
                    type: "NameAccessBlock",
                },
                {
                    kind: "block",
                    type: "TerminationBlock",
                },
            ],
        },
    ],
};
