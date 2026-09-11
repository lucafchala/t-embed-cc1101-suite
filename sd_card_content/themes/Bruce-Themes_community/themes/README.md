## 🖼️ Visual Previews Others Themes          
Before you choose your theme, you can take a look at the actual hardware captures to see how each design fits your device.

> [!TIP]
> Visit the **[previews](https://github.com/anonimoKali/Bruce-Themes/tree/main/previews)** folder to browse high-resolution screenshots of every theme released so far, organized by device type and resolution.


# 📂 Themes Directory Structure

This folder contains all the configuration files and assets for the **Bruce Firmware** themes. 
To ensure the best visual experience, please select the directory that matches your device's screen height/resolution.
                                
---

> **⚠️ Nota de curadoria**: o README original deste repositório (upstream,
> [anonimoKali/Bruce-Themes](https://github.com/anonimoKali/Bruce-Themes)) descreve uma
> estrutura organizada por resolução de tela (`105px/`, `140px/`, `180px/`, `192px/`), mas
> o que foi efetivamente vendorizado nesta pasta está organizado de forma plana, por nome
> de tema (ex.: `Kali_By_anonimoKali/`, `Lilygo_base_By_anonimoKali/`). As instruções abaixo
> foram ajustadas para essa estrutura real — não existem subpastas por resolução aqui.

### 🛠️ How to Choose the Right File
* 1 **Download:** Browse the theme folders below (each is named after its theme, by [anonimoKali](https://github.com/anonimoKali)) and pick the one you like.
* 2 **Identify:** Check each theme's own files/preview to confirm it fits your device's screen height — see the compatibility note below.
* 3 **Transfer:** Connect your SD card to your PC and copy the chosen theme's folder into the /themes directory.
* 3.1 **Note:** If the /themes folder does not exist in your SD root, create it manually.
* 4 **Setup:** Safely eject the SD card, insert it into your device, and power it on.
* 5 **Apply:** Go to the device Settings menu, select Themes, and choose the .json file you just uploaded.

---

### 🔍 Find Your Device
Screen-height reference from the upstream repository (this vendored copy has no per-resolution folders — pick any theme below and check its own preview/files against your device):

* **105px:** M5Stack StickC Plus, M5Stack StickC Plus 2
* **140px:** LilyGO T-Embed CC1101, LilyGO T-Embed CC1101 Plus
* **180px:** Cheap Yellow Display (CYD) ESP32-2432S028, LilyGO T-Deck
* **192px:** LilyGO T-LoRa-Pager

---

> [!IMPORTANT]
> **Compatibility Note:** Using a theme from the wrong pixel folder may result in distorted icons or misaligned text. 
Always use the version specifically optimized for your screen height.

---
**Maintained by:** [anonimoKali](https://github.com/anonimoKali)  
**License:** GNU GPLv3
