# Introduction to VISPI - Visual Pi-Calculus

VisPi is a block-based visual language for the Pi-Calculus. It is designed to be a tool for teaching and learning the Pi-Calculus. The Pi-Calculus is a formal language for describing concurrent systems. It is a powerful language that can be used to describe a wide range of systems, from simple message-passing systems to complex distributed systems.

## How to write programs in VisPi

### Names

1. **Creating** a name requires the use of one of the following blocks: `global`, `restrict` or `receive`. Additionally, names are created through process `parameter` blocks.
    a. **Global** names are created using the `global` block. These names are visible to all processes and represent free names in the Pi-Calculus. In VisPi, unlike in standard Pi-Calculus, free names must be explicitly declared.
    b. **Restrict** blocks are used to create locally bound names. These names are only visible within the process in which they are declared. There are two variants of the `restrict` block: `restrict` and `restrict all`, where with `restrict all` we are able to define many names without introducing additional nesting.
    c. **Receive** blocks are used to create names that are bound to the value of a received message. These names are only visible within the process in which they are declared. Similarly to the `restrict` block, there are two variants of the `receive` block: `receive` and `receive all`.
    d. **Parameter** blocks are used to create names that are passed as arguments to a process. These names are only visible within the process in which they are declared.

2. **Using** a name requires the use of one of the name accessor block. This block is context sensitive and will only show the names that are available in the current scope. Moving this block to another scope which does not have the currently selected name available will result in a warning beside the names dropdown.
    - Using the warning mechanic can be used to easily change a name and then the warnings will indicate which blocks must be updated.
    - If a name was already declared, and is redeclared, the previous declaration will be removed from the scope. This is a form of shadowing and is indicated through the order in which names appear in the dropdown.
      - For example: `[global x] [global y] [global z] ... [restrict x]` will result in the dropdown order: `[y, z, x]` since the `global` x was shadowed by the `restrict` x.
    - The name accessor is always included in all blocks that accept it as input.

### Processes

All blocks which are used in processes (`process`, `parameter`, `argument` and `call`) are purple and found in the `Processes` category.

#### Defining a Process

To add a process into your program, you must use the `process` block and provide a name for the process. This name will be used to reference the process in other parts of the program.

A `process` block will not generate any code until it contains a definition body.

Defining parameters for a process is done by adding `parameter` blocks to the process parameters section of the block as a list of parameters which you can chain together in a list.

The body of a process is simply a mini-program which is made up of any combinations of blocks with the exception of `program`, `process` and `global` blocks.

#### Invoking a Process

To invoke a process, you must use the `call` block and select the name of the process you wish to call from the dropdown. You can also provide arguments to the process by adding `argument` blocks to the arguments section of the block as a list of arguments which you can chain together in a list.

The `argument` block will change to reflect the name to which parameter it is bound to once it is attached to a `call` block. This is useful for debugging and understanding the flow of data in the program.

Attempting to use an incorrect number of arguments will result in an error warning on the `argument` block as well as the `call` block.

### The 'Main' block - Program

The `program` block is the main block of a VisPi program. It is the block that will generate code that describes the system. Without the main block, the program is incomplete.

Only one `program` block is allowed in a program. Furthermore, no code will be generated if it's not within the `program` block or a `process` block.
