# Setting Up the New Ekstra Router Repository

## Step 1: Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `ekstra-router`
3. Description: "Smart router firmware and onboarding tools for vending machine operators"
4. Visibility: Private (recommended for now)
5. **Do NOT** initialize with README (we'll push our own)
6. Click "Create repository"

---

## Step 2: Initialize Local Repository

Open terminal/PowerShell in your desired location:

```bash
# Create and enter project directory
mkdir ekstra-router
cd ekstra-router

# Initialize git
git init

# Create initial structure
mkdir -p docs
mkdir -p onboarding-app/src/main
mkdir -p onboarding-app/src/renderer
mkdir -p onboarding-app/assets
mkdir -p onboarding-app/firmware
mkdir -p firmware/packages
mkdir -p firmware/config
mkdir -p firmware/scripts
mkdir -p scripts

# Create placeholder files for directories
touch firmware/packages/.gitkeep
touch firmware/config/.gitkeep
touch onboarding-app/src/main/.gitkeep
touch onboarding-app/src/renderer/.gitkeep
```

---

## Step 3: Copy Project Files

Copy the files I've created to the appropriate locations:

```
ekstra-router/
├── README.md                    ← from repo-files/README.md
├── .gitignore                   ← from repo-files/.gitignore
├── docs/
│   └── ARCHITECTURE.md          ← from repo-files/docs/ARCHITECTURE.md
├── onboarding-app/
│   └── package.json             ← from repo-files/onboarding-app/package.json
└── scripts/
    └── mock-router-api.js       ← from repo-files/scripts/mock-router-api.js
```

---

## Step 4: Initial Commit

```bash
# Add all files
git add .

# Initial commit
git commit -m "Initial project structure

- Clean architecture for Ekstra AI Router
- Onboarding app skeleton (Electron)
- Mock router API for development
- Documentation framework"

# Connect to GitHub
git remote add origin https://github.com/YOUR_USERNAME/ekstra-router.git

# Push to main branch
git branch -M main
git push -u origin main
```

---

## Step 5: Verify Structure

Your repository should now have:

```
ekstra-router/
├── .gitignore
├── README.md
├── docs/
│   └── ARCHITECTURE.md
├── firmware/
│   ├── packages/
│   │   └── .gitkeep
│   ├── config/
│   │   └── .gitkeep
│   └── scripts/
├── onboarding-app/
│   ├── package.json
│   ├── assets/
│   ├── firmware/
│   └── src/
│       ├── main/
│       └── renderer/
└── scripts/
    └── mock-router-api.js
```

---

## Step 6: Add to Cursor/Claude Project

To have Claude monitor and help with this project:

1. In Cursor, open the `ekstra-router` folder
2. Use Claude to help develop each component
3. For code reviews, share specific files or folders

**In Claude.ai Project:**
1. Create a new Project called "Ekstra Router Development"
2. Add the PROJECT_BLUEPRINT.md to Project Knowledge
3. Refer to this context in conversations

---

## Development Workflow

### Working on Onboarding App

```bash
cd onboarding-app
npm install
npm run dev          # Start in development mode
```

### Testing with Mock API

```bash
# In separate terminal
cd scripts
node mock-router-api.js
```

### Building for Distribution

```bash
cd onboarding-app
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

---

## Branch Strategy

```
main          ← Production-ready code
  │
  ├── develop ← Integration branch
  │     │
  │     ├── feature/onboarding-app
  │     ├── feature/firmware-core
  │     ├── feature/sniffer
  │     └── feature/dashboard
  │
  └── release/v1.0.0 ← Release branches
```

### Creating Feature Branch

```bash
git checkout -b feature/onboarding-app
# ... make changes ...
git add .
git commit -m "feat: implement router detection"
git push origin feature/onboarding-app
# Create PR to develop
```

---

## Next Steps

After setup, we'll work through these phases:

1. **Phase 1**: Onboarding App (router detection, firmware flashing)
2. **Phase 2**: Firmware ekstra-core package (API endpoints)
3. **Phase 3**: Firmware ekstra-sniffer package (monitor mode)
4. **Phase 4**: Integration testing
5. **Phase 5**: Production deployment

Let me know when you have the repo set up and we'll start building!
