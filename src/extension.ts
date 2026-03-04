import * as vscode from "vscode";
import { exec } from "child_process";
import { unlinkSync } from "fs";

function run(cmd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(stderr.trim() || err.message));
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

function getSSHRemote(): { host: string; workspacePath: string } | null {
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!folder) return null;

  const uri = folder.uri;
  if (uri.scheme !== "vscode-remote") return null;

  const authority = uri.authority;
  if (!authority.startsWith("ssh-remote+")) return null;

  const raw = authority.replace("ssh-remote+", "");
  const host = parseHost(raw);

  return { host, workspacePath: uri.path };
}

function parseHost(raw: string): string {
  // Antigravity encodes the authority as hex JSON: {"hostName":"..."}
  if (/^[0-9a-f]+$/i.test(raw)) {
    try {
      const json = Buffer.from(raw, "hex").toString("utf-8");
      const parsed = JSON.parse(json);
      if (parsed.hostName) return parsed.hostName;
    } catch {}
  }
  // Plain VS Code uses the hostname directly
  return raw;
}

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "ssh-paste-image.paste",
    async () => {
      const remote = getSSHRemote();
      if (!remote) {
        vscode.window.showInformationMessage("No SSH remote detected.");
        return;
      }

      const timestamp = Date.now();
      const filename = `paste-${timestamp}.png`;
      const localPath = `/tmp/${filename}`;

      // Save clipboard image locally
      try {
        await run(`pngpaste "${localPath}"`);
      } catch (e: any) {
        const msg = e.message as string;
        if (msg.includes("not found") || msg.includes("No such file")) {
          vscode.window.showErrorMessage(
            "pngpaste not found. Install with: brew install pngpaste"
          );
        } else {
          vscode.window.showErrorMessage("No image found in clipboard.");
        }
        return;
      }

      // Upload to home dir (always writable), insert absolute path
      const remoteHome = await run(`ssh "${remote.host}" "echo \\$HOME"`);
      const imageDir = `${remoteHome}/.cp-images`;
      const remoteDest = `${imageDir}/${filename}`;

      try {
        // Ensure remote folder exists
        await run(`ssh "${remote.host}" "mkdir -p '${imageDir}'"`);

        // Upload via scp
        await run(`scp "${localPath}" "${remote.host}:${remoteDest}"`);
      } catch (e: any) {
        vscode.window.showErrorMessage(`Upload failed: ${e.message}`);
        cleanup(localPath);
        return;
      }

      cleanup(localPath);

      // Copy path to clipboard and insert into active terminal
      await vscode.env.clipboard.writeText(remoteDest);

      const terminal =
        vscode.window.activeTerminal ?? vscode.window.createTerminal();
      terminal.show();
      terminal.sendText(remoteDest, false);

      vscode.window.showInformationMessage(
        `Image uploaded — path inserted & copied to clipboard`
      );
    }
  );

  context.subscriptions.push(disposable);
}

function cleanup(path: string) {
  try {
    unlinkSync(path);
  } catch {}
}

export function deactivate() {}
