import { VISPI_INVALID_NAME } from "./ScopeManager";
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
                    type: "MultiRestrictScopeBlock",
                    inputs: {
                        NAMES: {
                            block: {
                                type: "RestrictNameBlock",
                            },
                        },
                    },
                },
                {
                    kind: "block",
                    type: "RestrictNameBlock",
                },
                {
                    kind: "block",
                    type: "ReceiveScopeBlock",
                    inputs: {
                        ON: {
                            block: {
                                type: "NameAccessBlock",
                                fields: {
                                    NAME: VISPI_INVALID_NAME,
                                },
                            },
                        },
                    },
                },
                {
                    kind: "block",
                    type: "MultiReceiveScopeBlock",
                    inputs: {
                        NAMES: {
                            block: {
                                type: "ReceiveNameBlock",
                            },
                        },
                        ON: {
                            block: {
                                type: "NameAccessBlock",
                                fields: {
                                    NAME: VISPI_INVALID_NAME,
                                },
                            },
                        },
                    },
                },
                {
                    kind: "block",
                    type: "ReceiveNameBlock",
                },
                {
                    kind: "block",
                    type: "GuardScopeBlock",
                    inputs: {
                        FIRST: {
                            block: {
                                type: "NameAccessBlock",
                                fields: {
                                    NAME: VISPI_INVALID_NAME,
                                },
                            },
                        },
                        SECOND: {
                            block: {
                                type: "NameAccessBlock",
                                fields: {
                                    NAME: VISPI_INVALID_NAME,
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
                                    NAME: VISPI_INVALID_NAME,
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
                                    NAME: VISPI_INVALID_NAME,
                                },
                            },
                        },
                        MESSAGE: {
                            block: {
                                type: "NameAccessBlock",
                                fields: {
                                    NAME: VISPI_INVALID_NAME,
                                },
                            },
                        },
                    },
                },
                {
                    kind: "block",
                    type: "MultiSendBlock",
                    inputs: {
                        ON: {
                            block: {
                                type: "NameAccessBlock",
                                fields: {
                                    NAME: VISPI_INVALID_NAME,
                                },
                            },
                        },
                        MESSAGES: {
                            block: {
                                type: "SendNameBlock",
                                inputs: {
                                    MESSAGE: {
                                        block: {
                                            type: "NameAccessBlock",
                                            fields: {
                                                NAME: VISPI_INVALID_NAME,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                {
                    kind: "block",
                    type: "SendNameBlock",
                    inputs: {
                        MESSAGE: {
                            block: {
                                type: "NameAccessBlock",
                                fields: {
                                    NAME: VISPI_INVALID_NAME,
                                },
                            },
                        },
                    },
                },
                {
                    kind: "block",
                    type: "SyncBlock",
                    inputs: {
                        ON: {
                            block: {
                                type: "NameAccessBlock",
                                fields: {
                                    NAME: VISPI_INVALID_NAME,
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
                // {
                //     kind: "block",
                //     type: "ProcessInstanceBlock",
                // },
            ],
        },
        // {
        //     kind: "category",
        //     name: "DEV",
        //     contents: [
        //         {
        //             kind: "block",
        //             type: "TestBlock",
        //         },
        //         {
        //             kind: "block",
        //             type: "TestBlock2",
        //         },
        //     ],
        // },
    ],
};
