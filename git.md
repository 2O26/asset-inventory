# GitLab Git Commands Tutorial

Assuming you have the latest version of git installed.

## Setting Up Your Environment

```bash
# Check Git version to ensure it's installed
# Should be version 2.23 or later.
git --version

# Set up your Git identity if not previously done.
git config --global user.name "Your Name"
git config --global user.email "youremail@student.bth.se"
```

## Cloning a Repository

### via HTTPS

```bash
git clone https://gitlab.todej.com/knowit-secure/asset-inventory.git
```


## Switching branches

To switch branches in Git, use the `switch` command.
Replace `<branch-name>` with the name of the branch you intend to work with.

```bash
# Switch to an existing branch
git switch <branch-name>

# Create a new branch and switch to it
git switch -c <new-branch-name>
```

## Listing Branches

To see all branches in your repository, both local and remote:

```bash
# List local branches
git branch

# List all branches, including remote
git branch -a
```

## Fetching and Pulling Changes

Before switching branches or starting new work, ensure your local repository is up to date.

```bash
# Fetch changes from the remote repository
git fetch

# Merge changes into your current branch
git pull
```

## Committing Changes in Git

1. **Check the Status of Your Changes**

   - Use the `git status` command to see what files have been modified, added, or deleted:
     ```
     git status
     ```

2. **Stage Your Changes**

   - Stage specific files or all changes in your project:
     - To stage a specific file:

       ```
       git add <file-name>
       ```
     - To stage all changes:

       ```
       git add .
       ```

3. **Commit Your Changes**

   - Commit your staged changes with the task ID from `Trello`:

     ```
     git commit -m "TRELLO_ID: relevant message"
     ```

4. **Pushing Changes**

   - Push your commits to a remote repository:

     ```
     # Push local commits to the remote repository
     git push origin <branch-name>
     ```

## Rebase Branches
Before creating a merge request, a rebase on develop should be performed to avoid merge conflicts.

### Ensure The Develop Branch is Up to Date
Before rebasing, ensure the develop branch is up to date.

```bash
# Switch to develop
git switch develop

# Pull latest from develop
git pull origin develop
```
### Switch and Rebase

Switch back to the branch which you intend to rebase.

```bash
git switch <branch-name>

# Start rebase process
git rebase develop
```
### Handle conflicts
During the rebase, you might encounter conflicts. Git will pause the rebase and allow you to resolve these conflicts manually.

```bash
# After resolving a conflict in a file, add it to the staging area
git add <filename>

# Continue rebase process
git rebase --continue
```
### Push the rebase
Finally push the rebased repository to the remote repository.

```bash
git push origin <branch-name>
```

## Merging Branches

To incorporate changes from one branch into another, use the `merge` command.

```bash
# Switch to the branch you want to merge into
git switch <target-branch>

# Merge another branch into your current branch
git merge <source-branch>
```

## Handling Merge Conflicts

Merge conflicts occur when Git can't automatically resolve differences in code between two commits. When this happens, you'll need to manually resolve the conflicts.

```bash
# After attempting a merge, Git will list files with conflicts
# Open these files in your editor, resolve the conflicts, and then save your changes

# Add the resolved files
git add .

# Commit the merge
git commit -m "Resolved merge conflicts."

# Push the merge commit
git push origin <target-branch>
```

## Deleting Branches

Once you're done with a branch, you might want to delete it.

```bash
# Delete a local branch
git branch -d <branch-name>

# Force delete a local branch
git branch -D <branch-name>

# Delete a remote branch
git push origin --delete <branch-name>
```
