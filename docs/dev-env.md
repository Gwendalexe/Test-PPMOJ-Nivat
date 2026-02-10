# Development Environment

This local development environment is made using VS Code [Dev Containers](https://code.visualstudio.com/docs/devcontainers/containers).

## Prerequisites

- Using VS Code as your IDE.
- Using VS Code's [Remote Development](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack) extension
- Having `Docker` installed locally[^1].
- Having git configured locally[^1].
- If you are using ssh to push, pull, fetch, etc. Ensure the following :
  - The locally[^1] installed OpenSSH version is at least equivalent to the one inside the container.
    - If not and **you are on Windows**, check [this tutorial][update OpenSSH] to update your OpenSSH version.
      > [Here][OpenSSH latest] is the "latest release" mentioned in the tutorial.
  - Your key is added to the ssh-agent. Using `ssh-add -L` :
    - If you have an error like `Could not open a connection to your authentication agent.`. Then your agent is not active.
      - On Linux run `echo 'eval "$(ssh-agent -s)"' >> ~/.bashrc` and restart your terminal.
      - On Windows, run `Set-Service -StartupType Automatic | Start-Service ssh-agent` on an **admin PowerShell console**.
    - If the command, does not print your key, then it's not added. Run `ssh-add /path/to/the/.ssh/privatekey`.

[^1]: On your machine and not inside the container.

## Initialize the environment

1. Clone the repository.
2. Open the project inside VS Code.
3. VS Code, should automatically detect that the repo has a dev container and ask you to `Reopen folder to develop in a container`. If it does not just run `Dev Containers: Reopen in Container` in the command palette (`ctrl+shift+p`).
4. Wait for VS Code to build the environment. It can be quite long, but you can follow what is being done with the logs.
5. You can now code inside the Dev Container.

## Contents

The environment is defined in the [`.devcontainer/compose.yml`](../.devcontainer/compose.yml) file and the environment variables needed for the definition of the database are defined in the `.env` file next to it.
For the rest of the environment variables, the `.env.*` files inside `back`, and the files inside `front/environments` will be used.

### The `db` service

It contains a simple MySQL database, and is here so you don't have to create one yourself.

The `db_data` volume attached to it is used to persist all the data store in the database.

:warning: At the beginning, the Database is empty and only contains the schemas. To create its structure you'll need to run `flask db upgrade head -d database/migrations/` to run the migrations, followed by `python3 script_db.py -p -pu` to populate the DB.

> :warning::warning: Please note that the database content is persisted. As such if you change the `.devcontainer\.env` file's values or edit the service in the `.devcontainer/compose.yml` file, you might need to clear the `db_data` volume's content before rebuilding the stack. To be sure, if you ever edit the dev container, delete the whole stack manually (including the volumes), before

### The `devcontainer` service

This is your development environment. It is based on a Debian image and contains the whole project inside the `/workspace/` folder. It comes with the following packages and tools:

- Git, *(VS Code will automatically copy git's global configuration from your machine into the container)*.
- OpenSSH, *(If the ssh related prerequisites are met, VS Code will automatically link to the machine's `ssh-agent`, and you'll be able to use your ssh keys.)*
- Python3.11 along with `pipx` and other common Python utilities, *(see the full list [here][python tools])*
  > The python packages in the `back/requirements.txt` file are installed during the environment creation process.
- Node 18 along with `nvm`, `yarn`, `pnpm` and needed dependencies,
  > `npm ci` is run during the environment creation process.
- The dependencies needed for the [Sonarlint][] extension,
- The docker CLI just in case. **It uses the host's Docker daemon**. See [Docker outside of Docker][] notion for more details.

## VS Code

Every time you start the environment, the front and back development servers will be launched separately.

The 5000 and the 4200 ports will be automatically forwarded to the host. The former corresponds to the API, and the latter to the front. As such, you will be able to access both of the with your browser through <http://localhost:4200> and <http://localhost:5000>.

Some default VS Code extension will be installed by default. Here is the list:

- Backend related:
  - [python extension pack](https://marketplace.visualstudio.com/items?itemName=donjayamanne.python-extension-pack)
  - [isort](https://marketplace.visualstudio.com/items?itemName=ms-python.isort): basic python development extensions
  - [autopep8](https://marketplace.visualstudio.com/items?itemName=ms-python.autopep8): formatting support
  - [python path](https://marketplace.visualstudio.com/items?itemName=mgesbert.python-path): import utility
  - [python snippets](https://marketplace.visualstudio.com/items?itemName=frhtylcn.pythonsnippets): useful python snippets
  - [flake8](https://marketplace.visualstudio.com/items?itemName=ms-python.flake8): linting support
  - [flask snippets](https://marketplace.visualstudio.com/items?itemName=cstrap.flask-snippets): useful flask snippets
  - [MySQL](https://marketplace.visualstudio.com/items?itemName=cweijan.vscode-mysql-client2): MySQL database management tool
- Frontend related:
  - [auto import](steoates.autoimport): JS import intellisense
  - [ESLint](dbaeumer.vscode-eslint): JS and TS linting
  - [auto complete tag](https://marketplace.visualstudio.com/items?itemName=formulahendry.auto-complete-tag): auto close and auto rename HTML tags
  - [surround](https://marketplace.visualstudio.com/items?itemName=yatki.vscode-surround): tool to add wrapper JS/TS snippets around already written code.
  - [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode): if you don't know this ~~god-given~~ linter/formatter, look it up :wink:
- Documentation/markdown related:
  - [markdownlint](https://marketplace.visualstudio.com/items?itemName=DavidAnson.vscode-markdownlint): linting for markdown files
  - [GitHub markdown preview](https://marketplace.visualstudio.com/items?itemName=bierner.github-markdown-preview): GitHub flavored preview for markdown files
- Globally related:
  - [trailing spaces](https://marketplace.visualstudio.com/items?itemName=shardulm94.trailing-spaces): show trailing spaces in red
  - [git extension pack](https://marketplace.visualstudio.com/items?itemName=donjayamanne.git-extension-pack): Useful extension for git
  - [conventional commits](https://marketplace.visualstudio.com/items?itemName=vivaxy.vscode-conventional-commits): tool to generate conventional commits, *(please use it, it will help with having a clean repository)*
  - [better comments](aaron-bond.better-comments): color comments (ex: `//! ...` is red, `//TODO ...` is orange, etc.) *(Great for easy communication in your code :wink:)*
  - [IntelliCode](https://marketplace.visualstudio.com/items?itemName=VisualStudioExptTeam.vscodeintellicode): intellisense for JS, TS, Python, Java and T-SQL,
  - [ENV](https://marketplace.visualstudio.com/items?itemName=IronGeek.vscode-env): `.env` file format and syntax highlight

## Additional links

- <https://containers.dev/> for global documentation
- <https://code.visualstudio.com/docs/devcontainers/containers> for VS Code specifics.
- If you are on Windows and want better performances check <https://code.visualstudio.com/remote/advancedcontainers/improve-performance>.
  > Note that only the `Store your source code in the WSL 2 filesystem on Windows` solution is viable here.
  > The other solutions would need the `devcontainer.json` file to be changed in a way that would add too much complexity to the initialization process.

[update OpenSSH]: https://ardislu.dev/upgrade-openssh-windows
[OpenSSH latest]: https://github.com/PowerShell/Win32-OpenSSH/releases/latest
[python tools]: https://github.com/devcontainers/features/tree/main/src/python#:~:text=flake8%2Cautopep8%2Cblack%2Cyapf%2Cmypy%2Cpydocstyle%2Cpycodestyle%2Cbandit%2Cpipenv%2Cvirtualenv%2Cpytest%2Cpylint
[Sonarlint]: https://marketplace.visualstudio.com/items?itemName=SonarSource.sonarlint-vscode
[Docker outside of Docker]: <https://github.com/devcontainers/templates/tree/main/src/docker-outside-of-docker>
