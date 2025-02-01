# passwordstore-gui

An Electron application with React

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Tests

```bash
$ npm run test
```

### Build

#### Linux
```bash
$ npm run build:linux
```
The built file will be saved in `dist` folder


#### macOS
If building on mac OS, the command is:
```bash
$ npm run build:msc
```
However, if you're working on Linux machine, push the commit to the repo where pipeline will build the app and save it
to artifacts from where it can be downloaded.

#### Windows
```bash
$ npm run build:win
```
