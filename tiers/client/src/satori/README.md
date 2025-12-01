Git Subtree Workflow
====================


Adding this as a Submodule
--------------------------
```
git submodule add git@github.com:jkassis/satori.git client/src/lib/satori
git submodule init
git submodule update
git add .gitmodules client/src/lib/satori 
git commit -m "Added submodule satori"
```

Git will treat the entire folder at `client/src/lib/satori` as a single file... essentially a reference to the repo SHA that represents the inner content.

Adding a submodule to a Git project allows you to include and track another Git repository at a specific commit within your main repository. This can be useful for incorporating external libraries, frameworks, or other shared components. Here's how you can add a submodule to your project:

### Step 1: Clone Your Main Project
First, ensure you have a local clone of your main project where you want to add the submodule. If you haven't already cloned your main project, do so with:
```bash
git clone <main-project-url>
cd <main-project-directory>
```
Replace `<main-project-url>` with your main project's Git URL, and `<main-project-directory>` with the name of the directory into which your project is cloned.

### Step 2: Add the Submodule
To add a new submodule to your project, use the `git submodule add` command followed by the URL of the repository you wish to add as a submodule and the path within your main project where you want the submodule to reside:
```bash
git submodule add <submodule-repository-url> <path-to-submodule>
```
- `<submodule-repository-url>` is the URL of the repository you want to add as a submodule.
- `<path-to-submodule>` is the directory path within your main project where the submodule will be placed. This path should not already exist in your project; Git will create it for you.

### Step 3: Initialize and Update the Submodule
After adding the submodule, you'll want to initialize your submodule's configuration and update it to fetch the data from the submodule repository:
```bash
git submodule init
git submodule update
```
These commands are necessary for the first time to fetch all the data from the submodule repository and check out the specified commit.

### Step 4: Commit the Submodule to Your Project
Adding a submodule will change your main project's `.gitmodules` file and add a new entry for the submodule. You'll need to commit these changes:
```bash
git add .gitmodules <path-to-submodule>
git commit -m "Added submodule <submodule-name>"
```
Replace `<submodule-name>` with a descriptive name for your submodule. This commits the submodule to your project, along with the `.gitmodules` file that tracks your submodules' configuration.

### Step 5: Push the Changes
Finally, push the changes to your main project's remote repository:
```bash
git push
```
This step ensures that the submodule addition is reflected in the remote repository, allowing others to clone the project and its submodules.

Cloning a Project with Submodules
---------------------------------
For anyone cloning your project after you've added submodules, they should clone the project with the `--recurse-submodules` option to automatically initialize and update each submodule:
```bash
git clone --recurse-submodules <main-project-url>
```
Alternatively, if they've already cloned the project without this option, they can run the following commands inside the project directory to fetch the submodule content:
```bash
git submodule init
git submodule update
```

This workflow allows you to manage external dependencies or shared components across multiple projects efficiently.

Pulling Updates from Submodule
------------------------------
1. **Fetch and Merge for Submodules**: Navigate to the submodule directory and run `git fetch` followed by `git merge origin/main` (replace `main` with the appropriate branch as necessary) to pull the latest changes.
2. **Update the Main Project**: After updating the submodule, return to the main project directory, commit the submodule changes to track the new commit of the submodule in the main project.

Pushing Updates to Submodule
----------------------------
1. **Commit Changes in Submodule**: Make your changes in the submodule directory, commit them, and push them to the submodule's remote repository as you would with any Git repository.
2. **Update the Main Repository**: After pushing the submodule changes, go back to the main project directory, commit the change to the submodule (which is essentially a commit pointer), and then push the main project's changes to its repository.