# Anaconda Navigator Installation Instructions (Windows)

## Important Steps

1. **Download Anaconda**
   - Go to [Anaconda Distribution](https://www.anaconda.com/products/distribution)
   - Select Windows and Python 3.x → Download

2. **Install Anaconda**
   - Run the downloaded `.exe` file
   - Choose **Just Me** (recommended) → Select installation location
   - **Advanced Options:**
     - **Check:** "Register Anaconda3 as my default Python 3.x"
     - **Uncheck:** "Add Anaconda3 to my PATH environment variable" (This prevents conflicts; use Anaconda Prompt instead)
   - Click Install and finish.

3. **Launch Anaconda Navigator**
   - Start Menu → type "Anaconda Navigator" → Enter
   - Dashboard shows Jupyter Notebook, JupyterLab, Spyder, Environments

4. **Verify Installation**
   - Open **Anaconda Prompt** (from Start Menu)
   - Run:
     ```bash
     conda list
     ```
     → Should display installed packages

5. **(Optional but Recommended) Enable in PowerShell/IDE**
   - To use `conda` commands inside VS Code or Trae terminal:
   - Open **Anaconda Prompt** as Administrator.
   - Run:
     ```bash
     conda init powershell
     ```
   - Close and re-open your terminal.

6. **Create Project Environment (Best Practice)**
   - Don't work in the `base` environment. Create one for your project:
     ```bash
     conda create --name capstone_env python=3.9
     conda activate capstone_env
     ```
