set -e

# Deploy to public repository
git add .
git commit -m "${*}"
git push origin main


# Deploy to deployment repository

# Get number of lines to comment out in .gitignore
gitlines=$(grep -nm 1 ^$ .gitignore | cut -c1 | tr -d $'\n')
gitlines=$((gitlines-1))
# Modify .gitignore
sed -i "1,$gitlines s/^/# /1" .gitignore

# Push
git --git-dir=.git-deploy add .
git --git-dir=.git-deploy commit -m "${*}"
git --git-dir=.git-deploy push origin HEAD

# Restore .gitignore
sed -i "1,$gitlines s/# //1" .gitignore


# Windows people SHOO this file isn't for you
