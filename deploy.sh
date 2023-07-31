# Deploy
git add .
timestamp=$(date '+%F_%T')
git commit -m "Publish @ $timestamp"
git push origin main

# Restore .gitignore
sed -i "1,$gitlines s/# //1" .gitignore


# Windows people SHOOO this file isn't for you
