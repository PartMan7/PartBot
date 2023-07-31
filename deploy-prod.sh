# Get number of lines to modify in .gitignore
gitlines=$(grep -nm 1 ^$ .gitignore | cut -c1 | tr -d $'\n')
# Modify .gitignore
sed -i "1,$gitlines s/\b/# /1" .gitignore

# Deploy
git --git-dir=.git-deploy add .
git --git-dir=.git-deploy commit -m $@
git --git-dir=.git-deploy push origin main

# Restore .gitignore
sed -i "1,$gitlines s/# //1" .gitignore


# Windows people SHOOO this file isn't for you
