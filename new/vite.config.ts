import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const MAX_BYTES = 128 * 1024

// Web path -> real file. Only these allowlisted text files are inlined;
// anything missing/unreadable (e.g. building on another machine) is null
// and the app falls back to baked-in placeholder content.
function riceMap(): Record<string, string> {
  const home = process.env.HOME ?? '/home/lynnux'
  const root = process.cwd()
  const hypr = (n: string) => `${home}/.config/hypr/${n}`
  const waybar = (n: string) => `${home}/.config/waybar/${n}`
  return {
    '~/.zshrc': `${home}/.zshrc`,
    '~/.config/hypr/hyprland.conf': hypr('hyprland.conf'),
    '~/.config/hypr/general.conf': hypr('general.conf'),
    '~/.config/hypr/colors.conf': hypr('colors.conf'),
    '~/.config/hypr/animation.conf': hypr('animation.conf'),
    '~/.config/hypr/keybinds.conf': hypr('keybinds.conf'),
    '~/.config/hypr/windowrules.conf': hypr('windowrules.conf'),
    '~/.config/hypr/startup.conf': hypr('startup.conf'),
    '~/.config/waybar/configs/config': waybar('configs/config'),
    '~/.config/waybar/styling/style.css': waybar('styling/style.css'),
    '~/.config/waybar/styling/bar.css': waybar('styling/bar.css'),
    '~/.config/waybar/styling/general.css': waybar('styling/general.css'),
    '~/.config/waybar/styling/workspace.css': waybar('styling/workspace.css'),
    '~/.config/waybar/styling/colors-waybar.css': waybar('styling/colors-waybar.css'),
    '~/.config/waybar/styling/themes/Madness.css': waybar('styling/themes/Madness.css'),
    '~/.config/kitty/kitty.conf': `${home}/.config/kitty/kitty.conf`,
    '~/.oh-my-zsh/themes/pixegami-agnoster.zsh-theme': `${home}/.oh-my-zsh/themes/pixegami-agnoster.zsh-theme`,
    '~/portfolio/AGENTS.md': resolve(root, '../AGENTS.md'),
  }
}

function riceFiles(): Plugin {
  const map = riceMap()
  return {
    name: 'rice-files',
    resolveId(id) {
      if (id === 'virtual:rice-files') return '\0virtual:rice-files'
    },
    load(id) {
      if (id !== '\0virtual:rice-files') return
      const out: Record<string, string | null> = {}
      for (const [key, file] of Object.entries(map)) {
        try {
          const buf = readFileSync(file)
          out[key] = buf.length > MAX_BYTES ? null : buf.toString('utf8')
        } catch {
          out[key] = null
        }
      }
      return `export default ${JSON.stringify(out)};`
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), riceFiles()],
})
