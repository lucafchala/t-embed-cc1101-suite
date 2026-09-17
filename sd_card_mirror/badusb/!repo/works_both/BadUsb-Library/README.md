## **BadUSB Library - Comprehensive Payload Collection**

> **⚠️ DISCLAIMER: EDUCATIONAL PURPOSES ONLY**  
> This BadUSB payload library is created solely for educational and research purposes.
> Using these payloads on systems without explicit authorization may violate laws and Terms of Service.
> The authors are not responsible for any misuse. Use at your own risk and make sure you comply with all applicable laws, terms and conditions.

The **BadUSB Library** is a comprehensive collection of 374 BadUSB payloads organized according to the **MITRE ATT&CK Framework**. This library provides a complete range of BadUSB scripts for various operating systems and attack scenarios.

## **Key Features**

- **374 BadUSB Payloads** from 3 major GitHub Repositories and self created
- **Multi-OS Support** - Windows, Linux, macOS, Android, iOS
- **Two Readiness Levels** - Directly Ready & Configuration Needed
- **MITRE ATT&CK Framework** - use case organized

## **Payload Distribution**

### **By Operating System:**
- **Windows**: 222 Payloads (59.4%)
- **Unix-like/Linux**: 64 Payloads (17.1%)
- **Unix-like/macOS**: 63 Payloads (16.8%)
- **Android**: 15 Payloads (4.0%)
- **iOS**: 10 Payloads (2.7%)

### **By Categories:**
- **Prank**: 92 Payloads (24.6%)
- **Destruction**: 51 Payloads (13.6%)
- **Authentication**: 33 Payloads (8.8%)
- **Utilities**: 34 Payloads (9.1%)
- **Command & Control**: 28 Payloads (7.5%)
- **Reconnaissance**: 29 Payloads (7.8%)
- **Data Exfiltration**: 26 Payloads (7.0%)
- **Remote Access**: 25 Payloads (6.7%)
- **Collection**: 15 Payloads (4.0%)
- **Social Engineering**: 13 Payloads (3.5%)
- **Defense Evasion**: 8 Payloads (2.1%)
- **Discovery**: 7 Payloads (1.9%)

### **By Readiness:**
- **Directly Ready**: 280 Payloads (74.9%) - Ready to use immediately
- **Configuration Needed**: 94 Payloads (25.1%) - Require configuration

## **Directory Structure**

```
BadUsbLibrary/
├── authentication/          # Authentication & Credential Harvesting
│   ├── Win/
│   ├── Unix-like/Linux/
│   ├── Unix-like/macOS/
│   ├── Android/
│   └── iOS/
├── collection/              # Data Collection & Information Gathering
├── command_control/         # Command & Control & Remote Access
├── data_exfiltration/       # Data Exfiltration & Theft
├── defense_evasion/         # Defense Evasion & Stealth
├── discovery/               # System Discovery & Enumeration
├── destruction/             # System Destruction & Corruption
├── prank/                   # Pranks & Harmless Fun
├── reconnaissance/          # Reconnaissance & Network Scanning
├── remote_access/           # Remote Access & Backdoors
├── social_engineering/      # Social Engineering & Phishing
└── utilities/               # System Utilities & Tools
```

Each category contains subdirectories for:
- `directly_ready/` - Ready-to-use payloads
- `configuration_needed/` - Payloads requiring configuration

## **Configuration**

### **Directly Ready Payloads**
These payloads are ready to use immediately and require no configuration:
```bash
# Example: macOS Screenshot Taker
DELAY 2000
GUI SPACE
DELAY 1000
STRING Terminal
ENTER
DELAY 3000
STRING screencapture ~/Desktop/screenshot_$(date +%Y%m%d_%H%M%S).png
ENTER
```

### **Configuration Needed Payloads**
These payloads require configuration before use:

**Telegram Bot Setup**:
1. Create a Telegram Bot via @BotFather
2. Get the Bot Token
3. Get the Chat ID
4. Replace `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` in the scripts

**Discord Webhook Setup**:
1. Create a Discord Webhook
2. Copy the Webhook URL
3. Replace `WEBHOOK_GOES_HERE` in the scripts

**Example Configuration**:
```bash
# Before use, replace:
BOT_TOKEN="TELEGRAM_BOT_TOKEN"  # → "1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
CHAT_ID="TELEGRAM_CHAT_ID"      # → "123456789"
```

## **Sources**

The payloads come from the following GitHub Repositories:

1. **[beigeworm/BadUSB-Files-For-FlipperZero](https://github.com/beigeworm/BadUSB-Files-For-FlipperZero)**
2. **[FalsePhilosopher/badusb](https://github.com/FalsePhilosopher/badusb)** 
3. **[hak5/usbrubberducky-payloads](https://github.com/hak5/usbrubberducky-payloads)**
4. **BadUSB Library** 

## **Contributing**

Contributions are welcome! Here's how you can help:

### **Adding New Payloads:**
1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/new-payload`
3. **Add** your payload to the correct category:
   - Choose the appropriate OS category (Win, Unix-like/Linux, Unix-like/macOS, Android, iOS)
   - Decide between `directly_ready/` or `configuration_needed/`
   - Use the MITRE ATT&CK Framework for categorization
4. **Test** your payload thoroughly
5. **Document** the payload with REM comments
6. **Commit** your changes: `git commit -m "Add new payload: [Name]"`
7. **Create** a Pull Request

---

*Last updated: 12.9.2025*
