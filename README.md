# Tldraw Robot

A tldraw computer style interface for BracketBot programming.

## Project Definition

**What is the project?**
A visual node-based interface for programming BracketBot using connected components. Users can create workflows by connecting nodes for movement, speech, and AI interactions on an infinite canvas. The interface will allow non-programmers to create complex robot behaviors through visual programming.

**What is the MVP?**
- Visual canvas with draggable nodes for basic robot functions
- Core node types:
  - Move nodes (forward, backward, turn)
  - Talk nodes (text-to-speech output)
  - Audio input nodes (voice commands)
  - Think instruction nodes (process natural language commands)
- Ability to connect nodes with arrows
- Real-time execution of the workflow
- Basic robot status feedback

**What are the sprinkles?**
- Node library with pre-made workflows
- Visual debugging tools
- Real-time robot position visualization
- Custom node creation
- Workflow export/import functionality
- Multi-robot support
- Voice command recording within interface
- Animation previews for movement paths

**When will the project be complete?**
The project will be complete when users can create, save, and execute basic robot behaviors through the visual interface, with all MVP nodes functioning and properly communicating with the BracketBot hardware.

## Core Components

| Node Type | Function | Priority |
|-----------|----------|-----------|
| Move | Controls robot motion | MVP |
| Talk | Manages audio output | MVP |
| Think | Processes instructions | MVP |
| Listen | Captures voice commands | MVP |
| Status | Monitors robot state | MVP |
| Custom | User-defined behaviors | Sprinkle |

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Technologies Used

- Next.js 15
- React 18
- Tldraw
- TypeScript
- Tailwind CSS

## Development

To start developing, run:

```bash
npm run dev
```

For production build:

```bash
npm run build
npm start
```

## License

MIT
