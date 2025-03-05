# Tldraw Computer

A tldraw computer style interface for BracketBot programming.

## Instructions
- Connect to your bracketbots network
- SSH to bracketbot raspberry pi
- Run `~/quickstart/core $ python3 node_drive.py`
- Run  `~/tldraw-robot/backend $ uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
- On your local machine run `~/tldraw-robot$ npm run dev`
- Open the tldraw interface in your browser
- Create a flow and run
- If you get a connection error, rapsberry pi ip address might have changed. Check the ip address of the raspberry pi in the bracketbot network.
- (.venv) scarlet@scarlet-bracketbot:~/quickstart $ ip addr show | grep -w inet
    inet 127.0.0.1/8 scope host lo
    inet 10.42.0.1/24 brd 10.42.0.255 scope global noprefixroute wlan0_ap
    - In this case the ip address is 10.42.0.1



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
